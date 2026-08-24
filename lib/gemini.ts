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

  return moments
    .map((m, idx): SelectedMoment => {
      const start = Math.max(0, Number(m.startTimeSec) || 0);
      let end = Number(m.endTimeSec) || start + minShortDurationSec;

      // Enforce the 30s to 90s duration bounds strictly
      if (end - start < minShortDurationSec) end = start + minShortDurationSec;
      if (end - start > maxShortDurationSec) end = start + maxShortDurationSec;

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
    .sort((a, b) => a.rank - b.rank);
}
