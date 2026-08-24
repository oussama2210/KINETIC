/**
 * Deepgram Speech-to-Text provider (official @deepgram/sdk)
 * Transcribes a video/audio URL and returns transcript + word-level timestamps
 * used to build synchronized captions.
 */

import { DeepgramClient } from "@deepgram/sdk";

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

/**
 * Transcribe media from a public/signed URL using the Deepgram SDK
 * (REST prerecorded transcription via /v1/listen)
 */
export async function transcribeWithDeepgram(
  mediaUrl: string
): Promise<TranscriptionResult> {
  const client = getDeepgramClient();

  if (!client) {
    throw new Error("DEEPGRAM_API_KEY is not configured");
  }

  const result = await client.listen.v1.media.transcribeUrl({
    url: mediaUrl,
    model: "nova-3",
    smart_format: true,
    punctuate: true,
    paragraphs: true,
    utterances: true,
    detect_language: true,
  });

  // Response is a union: sync transcription result or async-accepted ack.
  // We never use callbacks, so a missing "results" payload means failure.
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
