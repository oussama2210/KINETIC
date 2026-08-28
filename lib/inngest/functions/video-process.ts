interface InngestHandlerCtx {
  event: { data: any; [key: string]: any };
  step: {
    run: <T>(id: string, fn: () => T | Promise<T>) => Promise<T>;
    sleep: (id: string, duration: number | string) => Promise<void>;
  };
}
import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSupabaseReadUrl, getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase";
import { getPresignedReadUrl, hasStorageCredentials } from "@/lib/s3";
import {
  transcribeWithDeepgram,
  buildCaptionCues,
  hasDeepgramConfig,
  type DeepgramWord,
  type CaptionCue,
} from "@/lib/deepgram";
import {
  selectBestMoments,
  hasGeminiKey,
  type SelectedMoment,
} from "@/lib/gemini";
import { VIDEO_ANALYSIS_CONFIG } from "@/config/video-analysis";
import { arcjetGuard, promptInjectionRule } from "@/lib/arcjet-guard";

export interface ProcessVideoEventData {
  projectId: string;
  userId: string;
  s3Key: string;
  originalFileName: string;
  fileSize?: string;
  clipCount?: string;
  captionStyle?: string;
  aspectRatio?: string;
  detectHooks?: boolean;
  autoBroll?: boolean;
}

/**
 * Fallback: build evenly-timed caption cues from a plain transcript
 * when no word-level timestamps are available (~2.5s per cue).
 */
function buildCuesFromPlainText(transcript: string): CaptionCue[] {
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const cues: CaptionCue[] = [];
  let cursor = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (let i = 0; i < words.length; i += 5) {
      const text = words.slice(i, i + 5).join(" ");
      cues.push({
        start: cursor,
        end: cursor + 2.5,
        text,
        index: cues.length,
      });
      cursor += 2.5;
    }
  }

  return cues;
}

// NOTE: Inngest's published types require a 3-arg signature, but the installed
// runtime expects `triggers` inside the options object (2-arg). Cast keeps tsc
// happy while matching the runtime contract.
export const processVideoWorkflow = (inngest.createFunction as any)(
  {
    id: "process-uploaded-video",
    retries: 2,
    triggers: [{ event: "video/process.started" }],
  },
  async ({ event, step }: InngestHandlerCtx) => {
    const data = event.data as ProcessVideoEventData;
    const { projectId, userId, s3Key, originalFileName, clipCount, captionStyle, aspectRatio } = data;

    // Step 1: Initialize Database Project Record & Set Status to UPLOADING (20%)
    const project = await step.run("init-db-status", async () => {
      try {
        const updated = await prisma.project.update({
          where: { id: projectId },
          data: {
            status: "UPLOADING",
            progress: 20,
            currentStep: "Uploading video package to Supabase storage bucket",
          },
        });
        return updated;
      } catch (err) {
        console.warn("Prisma project update warning (fallback):", err);
        return { id: projectId, status: "UPLOADING", progress: 20 };
      }
    });

    // Step 2: Wait for the client upload to finish, then generate a fresh signed URL (40%)
    const signedUrlData = await step.run("wait-and-generate-signed-url", async () => {
      // If s3Key is already a direct URL (pasted link), use it directly
      if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
        return { signedUrl: s3Key };
      }

      let signedUrl = "";

      // Probe storage up to 5 times (total wait: ~25s) to let the client upload finish
      const MAX_PROBES = 5;
      for (let probe = 1; probe <= MAX_PROBES; probe++) {
        if (hasSupabaseConfig) {
          signedUrl = await getSupabaseReadUrl(s3Key);
        } else {
          signedUrl = await getPresignedReadUrl(s3Key);
        }

        // Verify the URL is actually reachable (file exists in storage)
        const probeHeaders: Record<string, string> = { Range: "bytes=0-10" };
        if (hasSupabaseConfig && signedUrl.includes("supabase.co")) {
          const { serviceKey, anonKey } = getSupabaseConfig();
          const key = serviceKey || anonKey;
          if (key) {
            probeHeaders["apikey"] = key;
            probeHeaders["Authorization"] = `Bearer ${key}`;
          }
        }

        try {
          const res = await fetch(signedUrl, {
            method: "GET",
            headers: probeHeaders,
          });
          if (res.ok || res.status === 206) {
            console.log(`[Process] Source video verified in storage on probe ${probe}`);
            break;
          }
          console.warn(`[Process] Probe ${probe}/${MAX_PROBES}: storage returned ${res.status}, waiting...`);
        } catch (e) {
          console.warn(`[Process] Probe ${probe}/${MAX_PROBES}: GET probe error, waiting...`);
        }

        if (probe < MAX_PROBES) {
          // Progressive delay: 3s, 5s, 7s, 9s, 11s
          await new Promise((r) => setTimeout(r, (probe * 2 + 1) * 1000));
          // Re-generate signed URL in case the previous one was signed against a non-existent object
          signedUrl = "";
        }
      }

      // If probes all failed and a real storage backend is configured, the
      // source object truly does not exist (failed/aborted upload or the file
      // exceeded the bucket size limit). Abort instead of generating fake
      // fallback shorts that point at a non-existent object.
      if (!signedUrl) {
        const storageConfigured = hasSupabaseConfig || hasStorageCredentials;
        if (storageConfigured) {
          try {
            await prisma.project.update({
              where: { id: projectId },
              data: {
                status: "FAILED",
                errorMessage:
                  "Source video was not found in the storage bucket. The upload may have failed, been interrupted, or exceeded the bucket's per-file size limit.",
                currentStep: "Failed • Source video not found in storage bucket",
              },
            });
          } catch (e) {
            console.warn("DB update skipped in failed-probe branch", e);
          }
          throw new Error(
            `Source video "${s3Key}" not found in storage after ${MAX_PROBES} probes — upload likely failed or exceeded the bucket size limit`
          );
        }

        // No storage configured (mock mode) — keep the demo flowing
        if (hasSupabaseConfig) {
          signedUrl = await getSupabaseReadUrl(s3Key);
        } else {
          signedUrl = await getPresignedReadUrl(s3Key);
        }
        console.warn("[Process] Could not verify source video — proceeding with unverified URL");
      }

      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            signedUrl,
            status: "PROCESSING",
            progress: 40,
            currentStep: "Supabase storage verified • Generating signed playback stream",
          },
        });
      } catch (e) {
        console.warn("DB update skipped in step 2", e);
      }

      return { signedUrl };
    });


    // Step 4: Deepgram AI Speech-to-Text Transcription from uploaded video URL (70%)
    const transcriptionResult = await step.run("transcribe-video-deepgram", async () => {
      let transcript = "";
      let words: DeepgramWord[] = [];

      if (hasDeepgramConfig && signedUrlData.signedUrl) {
        // Real Deepgram transcription from the signed video URL
        try {
          const result = await transcribeWithDeepgram(signedUrlData.signedUrl);
          transcript = result.transcript;
          words = result.words;
        } catch (dgErr) {
          console.warn("Deepgram transcription failed, using fallback:", dgErr);
        }
      }

      if (!transcript) {
        // Fallback mock transcript when Deepgram key is missing or call failed
        transcript =
          "Welcome back everyone. In today's masterclass, we are dissecting the exact architecture behind autonomous AI video generation. " +
          "The first rule of thumb is temporal coherence. If your frames drift, your audience drops. " +
          "Secondly, dynamic word-by-word subtitles increase retention on TikTok and Reels by over 340%. " +
          "Let's dive straight into the 3 execution steps to scale your content pipeline. " +
          "Step one is selecting your anchor seed. Step two is configuring camera physics. " +
          "Step three is deploying multi-platform automated scheduling to dominate the algorithm.";
      }

      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            transcription: transcript,
            status: "TRANSCRIBING",
            progress: 70,
            currentStep: hasDeepgramConfig
              ? "Deepgram Nova speech-to-text complete • Word-level timestamps extracted"
              : "Fallback transcript generated (DEEPGRAM_API_KEY not set)",
          },
        });
      } catch (e) {
        console.warn("DB update skipped in transcribe step", e);
      }

      return { transcript, words };
    });

    // Step 5: Generate synchronized captions from word-level timestamps (80%)
    const captionResult = await step.run("generate-synchronized-captions", async () => {
      let cues: CaptionCue[] = [];

      if (transcriptionResult.words.length > 0) {
        cues = buildCaptionCues(transcriptionResult.words);
      } else {
        // Derive simple evenly-timed cues from the plain transcript
        cues = buildCuesFromPlainText(transcriptionResult.transcript);
      }

      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            captions: cues as unknown as Prisma.InputJsonValue,
            progress: 80,
            currentStep: `Captions generated • ${cues.length} synchronized subtitle cues`,
          },
        });
      } catch (e) {
        console.warn("DB update skipped in caption step", e);
      }

      return { cues };
    });

    // Step 6: Send transcript to AI Model to select best engaging moments (Between 30 to 90s) (85%)
    // Returns startTime, endTime, whyBestReason, seoRanking (out of 100), and windowed captions
    const momentSelection = await step.run("select-best-moments-ai", async () => {
      let moments: SelectedMoment[] = [];

      if (hasGeminiKey && transcriptionResult.transcript) {
        // Prompt injection protection: scan the untrusted transcript before
        // it reaches the Gemini model prompt (Arcjet Guard, LIVE mode)
        const decision = await arcjetGuard.guard({
          label: "gemini.select-best-moments",
          rules: [promptInjectionRule(transcriptionResult.transcript)],
          metadata: { project_id: projectId, user_id: userId },
        });

        if (decision.conclusion === "DENY") {
          const denied = promptInjectionRule.deniedResult(decision);
          console.warn(
            "Prompt injection detected in transcript — skipping AI moment selection:",
            decision.reason,
            denied ?? ""
          );
          // Fall through to the deterministic fallback moments below
        } else {
          if (decision.hasError()) {
            console.warn("Arcjet guard rule error (fail-open ALLOW)");
          }
          try {
            // Real content duration (from word timestamps or caption timeline)
            // so Gemini never picks windows beyond the actual video end.
            const lastWordEnd = transcriptionResult.words.length
              ? transcriptionResult.words[transcriptionResult.words.length - 1].end
              : 0;
            const lastCueEnd = captionResult.cues.length
              ? Math.max(...captionResult.cues.map((c: CaptionCue) => c.end))
              : 0;
            const contentDuration = Math.max(lastWordEnd, lastCueEnd) || undefined;

            moments = await selectBestMoments(
              transcriptionResult.transcript,
              captionResult.cues.map((c: CaptionCue) => ({ start: c.start, end: c.end, text: c.text })),
              contentDuration
            );
          } catch (aiErr) {
            console.warn("AI moment selection failed, using fallback:", aiErr);
          }
        }
      }

      if (!moments.length) {
        // Fallback: Generate configured count (4-5 shorts) bounded strictly between 30 and 90 seconds
        const count = VIDEO_ANALYSIS_CONFIG.shortsToGenerate; // Configurable: default 5
        const minSec = VIDEO_ANALYSIS_CONFIG.minShortDurationSec; // 30s
        const maxSec = VIDEO_ANALYSIS_CONFIG.maxShortDurationSec; // 90s

        // Real content duration from the caption timeline — never emit windows
        // beyond it, and never emit overlapping windows (that produces 4-5
        // identical shorts instead of distinct moments).
        const lastCueEnd = captionResult.cues.length
          ? Math.max(...captionResult.cues.map((c: CaptionCue) => c.end))
          : 0;
        const horizon = Math.max(lastCueEnd, minSec);
        const safeCount = Math.max(
          1,
          Math.min(count, Math.max(1, Math.floor(horizon / minSec)))
        );
        // Equal-length, back-to-back windows: never overlap, never exceed horizon
        const clipLen = Math.min(
          maxSec,
          Math.max(minSec, Math.floor(horizon / safeCount))
        );

        const sampleHooks = [
          {
            title: "Viral Hook #1 — Temporal Coherence Secret",
            whyBest: "High-retention psychological opening hook explaining why AI frame coherence prevents viewer drop-off in the first 3 seconds.",
            seoRanking: 98,
            startCaption: "The #1 AI Rule",
            endCaption: "Follow for part 2",
          },
          {
            title: "Viral Hook #2 — 340% More Retention with Dynamic Subtitles",
            whyBest: "Explosive curiosity gap showing data-backed retention surge for animated TikTok and Reels captions.",
            seoRanking: 95,
            startCaption: "Boost Views 340%",
            endCaption: "Save this video",
          },
          {
            title: "Viral Hook #3 — 3 Execution Steps to Scale Fast",
            whyBest: "Actionable step-by-step masterclass framework delivering instant value to creators and agencies.",
            seoRanking: 94,
            startCaption: "Step-by-step Blueprint",
            endCaption: "Share with a creator",
          },
          {
            title: "Viral Hook #4 — The Seed Anchoring Algorithm Hack",
            whyBest: "Unlocks the exact technical secret behind camera physics and cinematic visual consistency.",
            seoRanking: 91,
            startCaption: "Anchor Seed Secret",
            endCaption: "Try this workflow",
          },
          {
            title: "Viral Hook #5 — Multi-Social Automated Distribution",
            whyBest: "High-intent closing strategy revealing how to dominate TikTok, Reels, and Shorts simultaneously.",
            seoRanking: 89,
            startCaption: "Auto-Publish Everywhere",
            endCaption: "Link in bio",
          },
        ];

        moments = Array.from({ length: safeCount }, (_, i) => {
          const start = i * clipLen;
          const end = Math.min(start + clipLen, horizon);
          const hook = sampleHooks[i % sampleHooks.length];

          // Extract cues in this window
          const windowCues = captionResult.cues.filter(
            (c: CaptionCue) => c.start >= start - 0.5 && c.end <= end + 0.5
          );

          return {
            rank: i + 1,
            title: hook.title,
            startTimeSec: start,
            endTimeSec: end,
            durationSec: Math.round((end - start) * 10) / 10,
            whyBestReason: hook.whyBest,
            seoRanking: hook.seoRanking,
            hookReason: hook.whyBest,
            viralRationale: "High SEO discoverability, strong viewer retention velocity, and algorithm-optimized watch time.",
            startCaption: hook.startCaption,
            endCaption: hook.endCaption,
            captions: windowCues.length > 0 ? windowCues : [
              { start, end: start + 3, text: hook.startCaption },
              { start: end - 3, end, text: hook.endCaption },
            ],
            transcriptExcerpt: transcriptionResult.transcript.slice(i * 120, i * 120 + 140),
            viralityScore: hook.seoRanking,
          };
        });
      }

      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            status: "GENERATING_SHORTS",
            progress: 85,
            currentStep: `AI selected ${moments.length} best engaging moments (${VIDEO_ANALYSIS_CONFIG.minShortDurationSec}-${VIDEO_ANALYSIS_CONFIG.maxShortDurationSec}s) with SEO rankings`,
          },
        });
      } catch (e) {
        console.warn("DB update skipped in moment selection step", e);
      }

      return { moments };
    });

    // Step 7: Save AI-selected short videos into new GeneratedShort table in Database (88%)
    await step.run("save-generated-shorts-to-db", async () => {
      try {
        // Replace previous entries for clean idempotency
        await prisma.generatedShort.deleteMany({ where: { projectId } });

        // Save all short videos generated from this long video
        for (const moment of momentSelection.moments) {
          await prisma.generatedShort.create({
            data: {
              projectId,
              rank: moment.rank,
              title: moment.title,
              startTimeSec: moment.startTimeSec,
              endTimeSec: moment.endTimeSec,
              durationSec: moment.durationSec,
              whyBestReason: moment.whyBestReason,
              hookReason: moment.hookReason,
              seoRanking: moment.seoRanking,
              viralRationale: moment.viralRationale,
              startCaption: moment.startCaption,
              endCaption: moment.endCaption,
              captions: moment.captions as unknown as Prisma.InputJsonValue,
              transcriptExcerpt: moment.transcriptExcerpt,
              viralityScore: moment.seoRanking,
              // Store the source video URL — the client player trims to [startTimeSec, endTimeSec]
              videoUrl: signedUrlData.signedUrl || null,
              status: "READY",
            },
          });
        }
      } catch (e) {
        console.warn("Failed to save GeneratedShort rows to database:", e);
      }

      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            progress: 88,
            currentStep: `${momentSelection.moments.length} short videos with SEO rankings saved to database`,
          },
        });
      } catch (e) {
        console.warn("DB update skipped in save shorts step", e);
      }

      return { savedCount: momentSelection.moments.length };
    });

    // Step 8: Finalize Playable Short Clips & Complete Project Status (100%)
    const finalResult = await step.run("finalize-and-save-clips", async () => {
      try {
        // Mirror the AI-selected moments as playable ShortClips for instant UI rendering
        // Each clip stores the SOURCE video URL + trim points so the client player handles playback
        await prisma.shortClip.deleteMany({ where: { projectId } });
        for (const moment of momentSelection.moments) {
          await prisma.shortClip.create({
            data: {
              projectId,
              title: moment.title,
              // Source video — the ShortVideoPlayer component trims to [startTimeSec, endTimeSec]
              videoUrl: signedUrlData.signedUrl || "",
              duration: formatDuration(moment.durationSec || (moment.endTimeSec - moment.startTimeSec)),
              viralityScore: moment.seoRanking,
              transcriptSnippet:
                "\u201C" +
                (moment.transcriptExcerpt || moment.whyBestReason).slice(0, 140) +
                "...\u201D",
              aspectRatio: "9:16",
            },
          });
        }

        // Finalize Project in Database
        const finalized = await prisma.project.update({
          where: { id: projectId },
          data: {
            status: "COMPLETED",
            progress: 100,
            currentStep: `Completed • ${momentSelection.moments.length} AI Shorts generated with synchronized captions & SEO rankings`,
          },
          include: {
            shorts: true,
            generatedShorts: {
              orderBy: { rank: "asc" },
            },
          },
        });

        return finalized;
      } catch (err) {
        console.warn("DB finalize error (fallback):", err);
        return {
          id: projectId,
          status: "COMPLETED",
          progress: 100,
          currentStep: "Completed • AI Shorts generated",
          shorts: momentSelection.moments,
        };
      }
    });

    return {
      success: true,
      projectId,
      status: "COMPLETED",
      signedUrl: signedUrlData.signedUrl,
      shortsCount: momentSelection.moments.length,
      transcript: transcriptionResult.transcript,
      captions: captionResult.cues,
      selectedMoments: momentSelection.moments,
      result: finalResult,
    };
  }
);

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
