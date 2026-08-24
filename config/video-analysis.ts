/**
 * Central configuration for the AI video analysis pipeline.
 * Tweak these values to change how many shorts are generated,
 * their duration bounds, and which AI model is used.
 */
export const VIDEO_ANALYSIS_CONFIG = {
  /**
   * How many short videos to generate from each uploaded long video.
   * Change this number anytime — the Inngest step adapts automatically.
   */
  shortsToGenerate: 4,

  /** Minimum allowed short duration in seconds */
  minShortDurationSec: 30,

  /** Maximum allowed short duration in seconds */
  maxShortDurationSec: 90,

  /**
   * Google Gemini model used to pick the best engaging moments.
   * Change the model ID here (or set GEMINI_MODEL env var) later.
   */
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",

  /** Sampling temperature for the moment-selection model */
  geminiTemperature: 0.7,

  /** Max output tokens for the selection response */
  geminiMaxOutputTokens: 8192,
} as const;

export const hasGeminiConfig = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
