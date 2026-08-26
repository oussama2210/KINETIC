/**
 * Deepgram Speech-to-Text provider (official @deepgram/sdk)
 * Transcribes a video/audio URL or buffer and returns transcript + word-level timestamps
 * used to build synchronized captions.
 *
 * Language support:
 * - Pass 1: nova-3 with language auto-detection → best for English + supported languages
 * - Pass 2: nova-3 with explicit language=ar → nova-3 ships a native monolingual
 *           Arabic model; `detect_language` does NOT cover Arabic, so Arabic
 *           videos are transcribed by this dedicated pass.
 * The best result (most words) wins.
 */

import { DeepgramClient } from "@deepgram/sdk";
import type { ListenV1AcceptedResponse } from "@deepgram/sdk";
import { getSupabaseConfig } from "./supabase";

const deepgramApiKey = process.env.DEEPGRAM_API_KEY || "";

export const hasDeepgramConfig = Boolean(deepgramApiKey);

function getDeepgramClient(): DeepgramClient | null {
  if (!hasDeepgramConfig) return null;
  return new DeepgramClient({ apiKey: deepgramApiKey });
}

export interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
  confidence: number;
}

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
  index?: number;
}

export interface TranscriptionResult {
  transcript: string;
  words: DeepgramWord[];
  durationSeconds: number;
  isLive: boolean;
}

interface RawDeepgramAlternative {
  transcript?: string;
  words?: Array<{
    word?: string;
    punctuated_word?: string;
    start?: number;
    end?: number;
    confidence?: number;
  }>;
}

interface RawDeepgramResult {
  results?: {
    channels?: Array<{
      alternatives?: RawDeepgramAlternative[];
    }>;
  };
  metadata?: {
    duration?: number;
  };
}

function parseDeepgramResponse(
  result: RawDeepgramResult | ListenV1AcceptedResponse | null | undefined
): TranscriptionResult {
  if (!result || !("results" in result) || !result.results) {
    throw new Error("Deepgram returned no transcription results");
  }

  const alternative: RawDeepgramAlternative | undefined =
    result.results.channels?.[0]?.alternatives?.[0];

  if (!alternative) {
    throw new Error("Deepgram returned no transcription alternatives");
  }

  const words: DeepgramWord[] = (alternative.words ?? []).map((w) => ({
    word: w.word ?? "",
    punctuated_word: w.punctuated_word,
    start: w.start ?? 0,
    end: w.end ?? 0,
    confidence: w.confidence ?? 0,
  }));

  const metadataDuration = result.metadata?.duration;

  return {
    transcript: alternative.transcript ?? "",
    words,
    durationSeconds:
      metadataDuration ??
      (words.length ? words[words.length - 1].end : 0),
    isLive: true,
  };
}

/** Shared quality flags for every transcription pass */
const COMMON_FLAGS = {
  smart_format: true,
  punctuate: true,
  paragraphs: true,
  utterances: true,
} as const;

/** Pick the pass that produced the most usable transcription */
function betterResult(
  a: TranscriptionResult | null,
  b: TranscriptionResult | null
): TranscriptionResult | null {
  if (!a) return b;
  if (!b) return a;
  const scoreA = a.words.length * 2 + (a.transcript ? 1 : 0);
  const scoreB = b.words.length * 2 + (b.transcript ? 1 : 0);
  return scoreB > scoreA ? b : a;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Transcribe media from a public/signed URL using the Deepgram SDK.
 * If the remote storage blocks Deepgram (e.g. 400 Bad Request / private bucket),
 * it automatically downloads the buffer on the server and streams it directly to Deepgram.
 */
export async function transcribeWithDeepgram(
  mediaUrl: string
): Promise<TranscriptionResult> {
  const client = getDeepgramClient();

  if (!client) {
    throw new Error("DEEPGRAM_API_KEY is not configured");
  }

  let best: TranscriptionResult | null = null;

  // ── Attempt 1: URL-based transcription (auto-detect, then explicit Arabic) ──
  try {
    // Pass A: auto-detect (English + supported languages)
    const detected = await client.listen.v1.media.transcribeUrl({
      url: mediaUrl,
      model: "nova-3",
      ...COMMON_FLAGS,
      detect_language: true,
    });
    best = betterResult(best, parseDeepgramResponse(detected));
  } catch (err) {
    console.warn("[Deepgram] URL pass (detect_language) failed:", errMessage(err));
    // Remote access issue — URL passes won't work, jump straight to buffer mode
    return transcribeBufferWithDeepgram(client, mediaUrl);
  }

  if (best && best.words.length > 0 && /[\u0600-\u06FF]/.test(best.transcript)) {
    // Already Arabic content transcribed successfully
    return best;
  }

  // Pass B: explicit Arabic model — catches pure-Arabic and mixed AR/EN audio
  try {
    const arabic = await client.listen.v1.media.transcribeUrl({
      url: mediaUrl,
      model: "nova-3",
      language: "ar",
      ...COMMON_FLAGS,
    });
    best = betterResult(best, parseDeepgramResponse(arabic));
  } catch (err) {
    console.warn("[Deepgram] URL pass (ar) failed:", errMessage(err));
  }

  if (best && best.words.length > 0) return best;

  // ── Attempt 2: buffer fallback via server-side fetch ──
  return transcribeBufferWithDeepgram(client, mediaUrl, best);
}

/**
 * Server-side fetch of the media (with Supabase auth headers when applicable),
 * streamed to Deepgram as a file. Tries auto-detect first, then explicit Arabic.
 */
async function transcribeBufferWithDeepgram(
  client: DeepgramClient,
  mediaUrl: string,
  previousBest: TranscriptionResult | null = null
): Promise<TranscriptionResult> {
  const { serviceKey, anonKey } = getSupabaseConfig();
  const apiKey = serviceKey || anonKey;

  const fetchHeaders: Record<string, string> = {};
  if (apiKey && mediaUrl.includes("supabase.co")) {
    fetchHeaders["apikey"] = apiKey;
    fetchHeaders["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(mediaUrl, { headers: fetchHeaders });
  if (!res.ok) {
    if (previousBest) return previousBest;
    throw new Error(
      `Failed to fetch media file for transcription: ${res.status} ${res.statusText}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let best = previousBest;

  // Buffer pass A: auto-detect
  try {
    const detected = await client.listen.v1.media.transcribeFile(buffer, {
      model: "nova-3",
      ...COMMON_FLAGS,
      detect_language: true,
    });
    best = betterResult(best, parseDeepgramResponse(detected));
  } catch (err) {
    console.warn("[Deepgram] buffer pass (detect_language) failed:", errMessage(err));
  }

  if (best && best.words.length > 0) return best;

  // Buffer pass B: explicit Arabic
  try {
    const arabic = await client.listen.v1.media.transcribeFile(buffer, {
      model: "nova-3",
      language: "ar",
      ...COMMON_FLAGS,
    });
    best = betterResult(best, parseDeepgramResponse(arabic));
  } catch (err) {
    console.warn("[Deepgram] buffer pass (ar) failed:", errMessage(err));
  }

  if (best) return best;
  throw new Error("All Deepgram transcription passes failed");
}

/**
 * Build caption cues from word-level timestamps.
 * Groups words into short phrases (max ~5 words / ~2.5s) suitable for
 * dynamic word-by-word subtitles on shorts.
 * Handles Latin AND Arabic sentence punctuation.
 */
export function buildCaptionCues(words: DeepgramWord[]): CaptionCue[] {
  const cues: CaptionCue[] = [];
  let currentWords: DeepgramWord[] = [];

  const flush = () => {
    if (!currentWords.length) return;
    cues.push({
      start: currentWords[0].start,
      end: currentWords[currentWords.length - 1].end,
      text: currentWords
        .map((w) => w.punctuated_word || w.word)
        .join(" "),
    });
    currentWords = [];
  };

  for (const word of words) {
    const spanStart = currentWords.length ? currentWords[0].start : word.start;
    const tooManyWords = currentWords.length >= 5;
    const tooLong = word.end - spanStart > 2.5;
    // Sentence break for Latin (. ! ?) and Arabic (؟ ۔) punctuation incl. closing quotes
    const sentenceBreak = /[.!؟۔?]["'\u201D\u00BB\u2019]?$/.test(
      word.punctuated_word || word.word
    );

    currentWords.push(word);

    if (tooManyWords || tooLong || sentenceBreak) {
      flush();
    }
  }

  flush();

  return cues.map((cue, index) => ({
    ...cue,
    text: cue.text.trim(),
    index,
  }));
}
