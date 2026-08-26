/**
 * Shared Arcjet security client.
 * Base protection (Shield WAF) applied everywhere via withRule() clones.
 */
import arcjet, { shield } from "@arcjet/next";

export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Blocks common attacks: SQLi, XSS, path traversal
    shield({ mode: "LIVE" }),
  ],
});
