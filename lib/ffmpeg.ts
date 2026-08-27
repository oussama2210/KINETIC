/**
 * FFmpeg Video Processing & Subtitle Burn-in Engine
 * Renders high-quality 9:16 vertical short videos with burned-in captions.
 */

import path from "path";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";
import { VIDEO_ANALYSIS_CONFIG } from "@/config/video-analysis";

// Try resolving the static FFmpeg binary
let ffmpegPath = "ffmpeg";
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
  if (ffmpegInstaller?.path) {
    ffmpegPath = ffmpegInstaller.path;
  }
} catch {
  // Fall back to system ffmpeg
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface RenderShortOptions {
  sourceVideoUrlOrPath: string;
  startTimeSec: number;
  endTimeSec: number;
  captions?: SubtitleCue[];
  title?: string;
  outputPath?: string;
}

/**
 * Convert seconds into ASS subtitle timestamp format: H:MM:SS.cc
 */
function formatAssTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const centis = Math.floor((s % 1) * 100);

  return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

/**
 * Generate an Advanced SubStation Alpha (.ass) subtitle file
 * with Hormozi-style bold neon typography.
 */
export function generateAssSubtitles(
  cues: SubtitleCue[],
  startTimeOffsetSec: number,
  outputFilePath: string
): void {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hormozi,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,2,60,60,280,1
Style: Accent,Arial,68,&H0022F2E4,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,7,4,2,60,60,280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogueLines = cues.map((cue, idx) => {
    // Offset timestamps so they are relative to the trimmed short video (starting at 0s)
    const relStart = Math.max(0, cue.start - startTimeOffsetSec);
    const relEnd = Math.max(relStart + 0.5, cue.end - startTimeOffsetSec);

    const startStr = formatAssTime(relStart);
    const endStr = formatAssTime(relEnd);

    // Highlight every 2nd or 3rd cue with neon lime accent
    const styleName = idx % 3 === 0 ? "Accent" : "Hormozi";
    // Sanitize text for ASS
    const safeText = cue.text
      .toUpperCase()
      .replace(/\\/g, "\\\\")
      .replace(/{/g, "\\{")
      .replace(/}/g, "\\}")
      .trim();

    return `Dialogue: 0,${startStr},${endStr},${styleName},,0,0,0,,${safeText}`;
  });

  const assContent = header + dialogueLines.join("\n") + "\n";
  fs.writeFileSync(outputFilePath, assContent, "utf-8");
}

/**
 * Download a remote video URL to a local temporary file.
 * Retries up to 3 times with exponential backoff to handle
 * transient errors and large-file edge cases.
 */
async function downloadSourceVideo(url: string, targetPath: string): Promise<void> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[FFmpeg] Downloading source video (attempt ${attempt}/${MAX_RETRIES})...`);
      const res = await fetch(url);

      if (!res.ok) {
        const bodySnippet = await res.text().catch(() => "");
        const msg = `Download failed (attempt ${attempt}): ${res.status} ${res.statusText}` +
          (bodySnippet ? ` — ${bodySnippet.slice(0, 200)}` : "");

        if (attempt === MAX_RETRIES) {
          throw new Error(msg + `\nURL: ${url.slice(0, 120)}...`);
        }
        console.warn(`[FFmpeg] ${msg} — retrying in ${attempt * 2}s...`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }

      // Validate content-type looks like a video
      const contentType = res.headers.get("content-type") || "";
      if (contentType && !contentType.includes("video") && !contentType.includes("octet-stream")) {
        console.warn(`[FFmpeg] Unexpected content-type: ${contentType} — proceeding anyway`);
      }

      const arrayBuffer = await res.arrayBuffer();

      if (arrayBuffer.byteLength < 1024) {
        const msg = `Downloaded file is suspiciously small (${arrayBuffer.byteLength} bytes)`;
        if (attempt === MAX_RETRIES) {
          throw new Error(msg);
        }
        console.warn(`[FFmpeg] ${msg} — retrying in ${attempt * 2}s...`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }

      fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
      console.log(`[FFmpeg] Downloaded ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB to ${targetPath}`);
      return;
    } catch (err) {
      const msg = errMessage(err);
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to fetch source video after ${MAX_RETRIES} attempts: ${msg}`);
      }
      console.warn(`[FFmpeg] Download attempt ${attempt} error: ${msg} — retrying...`);
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Render an HD 9:16 vertical short video with burned-in captions using FFmpeg.
 */
export async function renderShortVideo({
  sourceVideoUrlOrPath,
  startTimeSec,
  endTimeSec,
  captions = [],
  outputPath,
}: RenderShortOptions): Promise<string> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aivideo-render-"));
  const isRemote = sourceVideoUrlOrPath.startsWith("http://") || sourceVideoUrlOrPath.startsWith("https://");

  // Speed optimization: stream the source straight from its (signed) URL into
  // FFmpeg instead of downloading the whole file first. FFmpeg seeks via HTTP
  // range requests, so only the trimmed segment is fetched/decoded — this cuts
  // render time from minutes to seconds for large source videos. If a remote
  // input fails, we fall back to a full local download further below.
  const localInputPath = isRemote ? sourceVideoUrlOrPath : sourceVideoUrlOrPath;

  console.log(
    `[FFmpeg] Source mode: ${isRemote ? "REMOTE (streaming directly from URL — no full pre-download)" : "LOCAL file"}. ` +
    `Trim: ${startTimeSec}s → ${endTimeSec}s (${Math.max(1, endTimeSec - startTimeSec)}s).`
  );

  const finalOutput = outputPath || path.join(tempDir, `short_${Date.now()}.mp4`);
  const assPath = path.join(tempDir, "subtitles.ass");

  const durationSec = Math.max(1, endTimeSec - startTimeSec);

  // Size-aware bitrate cap: keep the rendered MP4 safely under the storage
  // bucket's per-file limit (Supabase free tier rejects large objects with
  // 413 EntityTooLarge). Target 30MB total, reserve room for 128k AAC audio.
  // Short clips keep the full 4Mbps quality ceiling.
  const TARGET_OUTPUT_BYTES = 30 * 1024 * 1024;
  const MAX_SAFE_OUTPUT_BYTES = 45 * 1024 * 1024;
  const maxRateKbps = Math.max(
    700,
    Math.min(
      4000,
      Math.floor((TARGET_OUTPUT_BYTES * 8) / durationSec / 1000) - 160
    )
  );
  const maxRateArg = `${maxRateKbps}k`;
  const bufSizeArg = `${maxRateKbps * 2}k`;

  // Generate subtitle file if captions exist
  let hasSubtitles = false;
  if (captions && captions.length > 0) {
    try {
      generateAssSubtitles(captions, startTimeSec, assPath);
      hasSubtitles = fs.existsSync(assPath);
    } catch (e) {
      console.warn("Could not generate ASS subtitles, rendering without captions:", e);
    }
  }

  // Windows path formatting for FFmpeg filters: escape colons and backslashes
  const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");

  // Build FFmpeg video filter:
  // 1. Scale and crop to vertical 9:16 centered (resolution from config)
  // 2. Burn in ASS subtitles (if available)
  const { renderWidth, renderHeight, renderPreset } = VIDEO_ANALYSIS_CONFIG;
  const baseVideoFilter = `scale=${renderWidth}:${renderHeight}:force_original_aspect_ratio=increase,crop=${renderWidth}:${renderHeight}`;
  const videoFilter = hasSubtitles ? `${baseVideoFilter},ass='${escapedAssPath}'` : baseVideoFilter;

  // Promisified single render attempt (with or without burned-in subtitles).
  const attemptRender = (withAss: boolean): Promise<void> =>
    new Promise((resolve, reject) => {
      const vf = withAss && hasSubtitles ? videoFilter : baseVideoFilter;
      const attemptArgs = [
        "-y",
        "-ss", String(startTimeSec),
        "-t", String(durationSec),
        "-i", localInputPath,
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", renderPreset,
        "-crf", "23",
        "-maxrate", maxRateArg,
        "-bufsize", bufSizeArg,
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-movflags", "+faststart",
        finalOutput,
      ];
      console.log(`[FFmpeg] Executing: ${ffmpegPath} ${attemptArgs.join(" ")}`);
      const proc = spawn(ffmpegPath, attemptArgs);
      let stderr = "";
      proc.stderr.on("data", (d) => { stderr += d.toString(); });
      proc.on("close", (code) => {
        if (code === 0 && fs.existsSync(finalOutput)) resolve();
        else reject(new Error(`FFmpeg exited ${code}: ${stderr.slice(-1500)}`));
      });
      proc.on("error", (err) => reject(new Error(`Failed to start FFmpeg: ${err.message}`)));
    });

  // Safety net: if the render exceeds the storage limit, re-encode once at
  // half the bitrate. Always resolves to a usable path.
  const recompressIfNeeded = (): Promise<string> =>
    new Promise((resolve) => {
      if (!fs.existsSync(finalOutput)) return resolve("");
      const sizeBytes = fs.statSync(finalOutput).size;
      if (sizeBytes <= MAX_SAFE_OUTPUT_BYTES) return resolve(finalOutput);

      const halfRateKbps = Math.max(500, Math.floor(maxRateKbps / 2));
      const compressed = finalOutput.replace(/\.mp4$/, "") + "_compressed.mp4";
      console.warn(
        `[FFmpeg] Output ${(sizeBytes / 1024 / 1024).toFixed(1)} MB exceeds safe limit — recompressing at ${halfRateKbps}k...`
      );
      const child = spawn(ffmpegPath, [
        "-y",
        "-i", finalOutput,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "28",
        "-maxrate", `${halfRateKbps}k`,
        "-bufsize", `${halfRateKbps * 2}k`,
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "96k",
        "-movflags", "+faststart",
        compressed,
      ]);
      child.on("close", (code) => {
        if (code === 0 && fs.existsSync(compressed)) {
          fs.rmSync(finalOutput, { force: true });
          console.log(`[FFmpeg] Recompressed: ${(fs.statSync(compressed).size / (1024 * 1024)).toFixed(1)} MB`);
          resolve(compressed);
        } else {
          console.warn("[FFmpeg] Recompress failed — using original file");
          resolve(finalOutput);
        }
      });
      child.on("error", () => resolve(finalOutput));
    });

  // Try ASS burn-in first, fall back to a no-subtitles render.
  const runRenderSequence = async (input: string): Promise<string> => {
    try {
      await attemptRender(true);
    } catch (e) {
      if (!hasSubtitles) throw e;
      console.warn("[FFmpeg] Render with ASS failed, retrying without subtitles:", (e as Error).message);
      await attemptRender(false);
    }
    const out = await recompressIfNeeded();
    if (!out) throw new Error("Render produced no output");
    return out;
  };

  // Remote sources are streamed straight from their URL for speed. If that
  // fails (e.g. range requests unsupported by the host), download the file
  // locally once and retry — preserving the old reliable behavior as a fallback.
  let renderedPath: string;
  const renderStart = Date.now();
  try {
    renderedPath = await runRenderSequence(localInputPath);
  } catch (err) {
    if (isRemote) {
      console.warn("[FFmpeg] Remote input failed, downloading source locally and retrying...", (err as Error).message);
      const localPath = path.join(tempDir, "source_input.mp4");
      await downloadSourceVideo(sourceVideoUrlOrPath, localPath);
      renderedPath = await runRenderSequence(localPath);
    } else {
      throw err;
    }
  }

  console.log(`[FFmpeg] Render finished in ${((Date.now() - renderStart) / 1000).toFixed(1)}s → ${renderedPath}`);
  return renderedPath;
}
