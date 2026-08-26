/**
 * Shared Arcjet Guard client.
 * Protects non-HTTP code paths (Inngest workflow steps) that have no
 * request object — e.g. scanning untrusted transcripts before they
 * reach the Gemini model call.
 */
import { launchArcjet, detectPromptInjection } from "@arcjet/guard/node";

export const arcjetGuard = launchArcjet({
  key: process.env.ARCJET_KEY!,
});

// Module scope so per-rule accessors (deniedResult/errorResult) work
export const promptInjectionRule = detectPromptInjection({
  mode: "LIVE",
  label: "gemini.transcript-scan",
});
