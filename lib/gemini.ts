/**
 * Google Gemini AI provider
 * Analyzes a Deepgram transcript + caption timeline and selects the most
 * engaging moments for short-form vertical videos (Between 30 to 90 seconds).
 */

import { VIDEO_ANALYSIS_CONFIG } from "@/config/video-analysis";

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

export const hasGeminiKey = Boolean(geminiApiKey);

export interface CaptionCueLite {
  start: number;
  end: number;
  text: string;
  index?: number;
}

export interface SelectedMoment {
  rank: number;
  title: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  whyBestReason: string;
  seoRanking: number; // SEO ranking out of 100
  hookReason: string;
  viralRationale: string;
  startCaption: string;
  endCaption: string;
  captions: CaptionCueLite[]; // Synchronized caption cues for this exact time window
  transcriptExcerpt: string;
  viralityScore: number;
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Ask Gemini AI to pick the best engaging moments from the transcript.
 * Returns structured JSON with start/end times (30-90s), why it's best, SEO ranking (0-100), and captions.
 */
export async function selectBestMoments(
  transcript: string,
  cues: CaptionCueLite[],
  videoDurationSec?: number
): Promise<SelectedMoment[]> {
  if (!hasGeminiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const { shortsToGenerate, minShortDurationSec, maxShortDurationSec } =
    VIDEO_ANALYSIS_CONFIG;

  // Compact caption timeline so the model can map text -> timestamps
  const timeline = cues
    .map((c) => `[${c.start.toFixed(1)}s-${c.end.toFixed(1)}s] ${c.text}`)
    .join("\n");

  const prompt = `You are an elite short-form video editor, viral content strategist, and SEO ranking expert for YouTube Shorts, TikTok, and Instagram Reels.

Below is the timestamped transcript of a long video${videoDurationSec ? ` (${Math.round(videoDurationSec)} seconds long)` : ""}.

TASK:
Analyze the full transcript and select the ${shortsToGenerate} BEST engaging moments to cut into high-performing short vertical videos.
Every short video MUST be strictly between ${minShortDurationSec} and ${maxShortDurationSec} seconds in duration.
CRITICAL: each moment MUST cover a DISTINCT, NON-OVERLAPPING time window. Never repeat or reuse the same segment — every startTimeSec must come from a different part of the transcript.

For each moment return:
- "rank": integer (1 = best short video overall)
- "title": punchy, click-worthy title for the short
- "startTimeSec": start timestamp in seconds (number, from transcript timeline)
- "endTimeSec": end timestamp in seconds (number, must satisfy: ${minShortDurationSec} <= endTimeSec - startTimeSec <= ${maxShortDurationSec})
- "whyBestReason": clear explanation of why this is the best short video and what makes the moment captivating (1-2 sentences)
- "seoRanking": integer from 1 to 100 representing the searchability, discoverability, and SEO viral ranking score
- "hookReason": explanation of the hook trigger in the first 3 seconds
- "viralRationale": why algorithms (TikTok FYP, Reels, Shorts) will favor this clip
- "startCaption": punchy on-screen caption hook for the START of the clip (max ~10 words)
- "endCaption": strong call-to-action caption for the END of the clip (max ~10 words)
- "transcriptExcerpt": exact transcript spoken inside this [startTimeSec, endTimeSec] window

Respond ONLY with valid JSON matching exactly this schema:
{"moments":[{"rank":number,"title":string,"startTimeSec":number,"endTimeSec":number,"whyBestReason":string,"seoRanking":number,"hookReason":string,"viralRationale":string,"startCaption":string,"endCaption":string,"transcriptExcerpt":string}]}

TIMESTAMPED TRANSCRIPT TIMELINE:
${timeline || transcript}`;

  const response = await fetch(
    `${GEMINI_API_BASE}/${VIDEO_ANALYSIS_CONFIG.geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: VIDEO_ANALYSIS_CONFIG.geminiTemperature,
          maxOutputTokens: VIDEO_ANALYSIS_CONFIG.geminiMaxOutputTokens,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText: string | undefined =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? undefined;

  if (!rawText) {
    throw new Error("Gemini returned no content");
  }

  let parsed: { moments?: Array<Record<string, unknown>> };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  const moments = Array.isArray(parsed.moments) ? parsed.moments : [];

  // Never let a moment window reach past the real end of the content —
  // otherwise the player/FFmpeg trim produces repeated identical tails.
  const lastCueEnd = cues.length ? Math.max(...cues.map((c) => c.end)) : 0;
  const horizon = Math.max(
    videoDurationSec ?? 0,
    lastCueEnd,
    minShortDurationSec
  );

  const mapped = moments
    .map((m, idx): SelectedMoment => {
      const start = Math.min(Math.max(0, Number(m.startTimeSec) || 0), Math.max(0, horizon - minShortDurationSec));
      let end = Number(m.endTimeSec) || start + minShortDurationSec;

      // Enforce the 30s to 90s duration bounds strictly + clamp to content end
      if (end - start < minShortDurationSec) end = start + minShortDurationSec;
      if (end - start > maxShortDurationSec) end = start + maxShortDurationSec;
      if (end > horizon) end = horizon;
      if (end - start < 5) return null as unknown as SelectedMoment;

      const durationSec = Math.round((end - start) * 10) / 10;
      const seoScore = Math.min(100, Math.max(1, Number(m.seoRanking) || 90));
      const whyBest = String(m.whyBestReason || m.hookReason || "High retention opening hook with strong emotional resonance.");

      // Slice the exact caption cues that fall within this short video window [start, end]
      const windowCues = cues.filter(
        (c) => c.start >= start - 0.5 && c.end <= end + 0.5
      );

      // If no cues in exact window, adjust cue start/ends relative to window or fallback
      const momentCaptions: CaptionCueLite[] = windowCues.length > 0
        ? windowCues
        : [
            {
              start,
              end: Math.min(start + 3, end),
              text: String(m.startCaption || "Check this out"),
            },
            {
              start: Math.max(start + 3, end - 3),
              end,
              text: String(m.endCaption || "Follow for more"),
            },
          ];

      return {
        rank: Number(m.rank) || idx + 1,
        title: String(m.title ?? `Viral Short #${idx + 1}`),
        startTimeSec: start,
        endTimeSec: end,
        durationSec,
        whyBestReason: whyBest,
        seoRanking: seoScore,
        hookReason: String(m.hookReason ?? whyBest),
        viralRationale: String(m.viralRationale ?? "Optimized for viral algorithm recommendation and retention."),
        startCaption: String(m.startCaption ?? "Watch till the end"),
        endCaption: String(m.endCaption ?? "Follow for more"),
        captions: momentCaptions,
        transcriptExcerpt: String(m.transcriptExcerpt ?? ""),
        viralityScore: seoScore,
      };
    })
    .filter((m): m is SelectedMoment => Boolean(m))
    .sort((a, b) => a.rank - b.rank);

  // Deduplicate: drop moments that heavily overlap an already-kept one
  // (Gemini often repeats the same "best" window several times).
  const kept: SelectedMoment[] = [];
  for (const m of mapped) {
    const duplicate = kept.some((k) => {
      const overlap = Math.min(m.endTimeSec, k.endTimeSec) - Math.max(m.startTimeSec, k.startTimeSec);
      return overlap > 0.5 * Math.min(m.durationSec, k.durationSec);
    });
    if (!duplicate) kept.push(m);
  }

  // Backfill with distinct windows if dedup removed too many
  let rank = kept.length;
  let cursor = 0;
  while (kept.length < shortsToGenerate && cursor + 10 < horizon) {
    const overlaps = kept.some(
      (k) => cursor < k.endTimeSec && cursor + minShortDurationSec > k.startTimeSec
    );
    if (!overlaps) {
      const start = cursor;
      const end = Math.min(horizon, start + minShortDurationSec);
      if (end - start >= Math.min(15, minShortDurationSec)) {
        rank += 1;
        const windowCues = cues.filter((c) => c.start >= start - 0.5 && c.end <= end + 0.5);
        kept.push({
          rank,
          title: `Hidden Gem Segment #${rank}`,
          startTimeSec: start,
          endTimeSec: end,
          durationSec: Math.round((end - start) * 10) / 10,
          whyBestReason: "Distinct non-overlapping segment selected to guarantee variety across shorts.",
          seoRanking: Math.max(60, 90 - rank * 2),
          hookReason: "Fresh angle on the content that complements the other clips.",
          viralRationale: "Additional unique perspective increases total channel watch time.",
          startCaption: "Don't miss this part",
          endCaption: "Follow for more",
          captions: windowCues.length > 0 ? windowCues : [{ start, end, text: "Don't miss this part" }],
          transcriptExcerpt: windowCues.map((c) => c.text).join(" ").slice(0, 200),
          viralityScore: Math.max(60, 90 - rank * 2),
        });
      }
    }
    cursor += 10;
  }

  kept.sort((a, b) => a.rank - b.rank);
  kept.forEach((m, i) => {
    m.rank = i + 1;
  });

  return kept;
}
