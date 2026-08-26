/**
 * Deepgram Speech-to-Text provider (official @deepgram/sdk)
 * Transcribes a video/audio URL or buffer and returns transcript + word-level timestamps
 * used to build synchronized captions.
 */

import { DeepgramClient } from "@deepgram/sdk";
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

function parseDeepgramResponse(result: any): TranscriptionResult {
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

  // Attempt 1: Transcribe directly via public/signed URL
  try {
    const result = await client.listen.v1.media.transcribeUrl({
      url: mediaUrl,
      model: "nova-3",
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      utterances: true,
      detect_language: true,
    });
    return parseDeepgramResponse(result);
  } catch (urlErr: any) {
    console.warn(
      "[Deepgram] URL transcription failed (remote access issue). Fetching buffer on server and streaming to Deepgram directly:",
      urlErr?.message || urlErr
    );

    // Attempt 2: Server-side fetch with Supabase credentials & transcribe as buffer
    const { serviceKey, anonKey } = getSupabaseConfig();
    const apiKey = serviceKey || anonKey;

    const fetchHeaders: Record<string, string> = {};
    if (apiKey && mediaUrl.includes("supabase.co")) {
      fetchHeaders["apikey"] = apiKey;
      fetchHeaders["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(mediaUrl, { headers: fetchHeaders });
    if (!res.ok) {
      throw new Error(`Failed to fetch media file for transcription: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileResult = await client.listen.v1.media.transcribeFile(buffer, {
      model: "nova-3",
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      utterances: true,
      detect_language: true,
    });

    return parseDeepgramResponse(fileResult);
  }
}

/**
 * Build caption cues from word-level timestamps.
 * Groups words into short phrases (max ~5 words / ~2.5s) suitable for
 * dynamic word-by-word subtitles on shorts.
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
    const sentenceBreak = /[.!?]$/.test(word.punctuated_word || word.word);

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
