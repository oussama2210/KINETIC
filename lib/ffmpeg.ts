/**
 * FFmpeg Video Processing & Subtitle Burn-in Engine
 * Renders high-quality 9:16 vertical short videos with burned-in captions.
 */

import path from "path";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";

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
    } catch (err: any) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to fetch source video after ${MAX_RETRIES} attempts: ${err.message}`);
      }
      console.warn(`[FFmpeg] Download attempt ${attempt} error: ${err.message} — retrying...`);
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
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

  let localInputPath = sourceVideoUrlOrPath;
  if (isRemote) {
    localInputPath = path.join(tempDir, "source_input.mp4");
    await downloadSourceVideo(sourceVideoUrlOrPath, localInputPath);
  }

  const finalOutput = outputPath || path.join(tempDir, `short_${Date.now()}.mp4`);
  const assPath = path.join(tempDir, "subtitles.ass");

  const durationSec = Math.max(1, endTimeSec - startTimeSec);

  // Size-aware bitrate cap: keep the rendered MP4 under the storage bucket's
  // per-file limit (Supabase default = 50MB). Target 40MB total, reserve room
  // for 128k AAC audio. Short clips keep the full 4Mbps quality ceiling.
  const TARGET_OUTPUT_BYTES = 40 * 1024 * 1024;
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
  // 1. Scale and crop to 1080x1920 (9:16 vertical centered)
  // 2. Burn in ASS subtitles (if available)
  let videoFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
  if (hasSubtitles) {
    videoFilter += `,ass='${escapedAssPath}'`;
  }

  // FFmpeg arguments:
  // Fast seek to startTime, decode for durationSec, crop 9:16, web-optimized H.264
  const args = [
    "-y",
    "-ss", String(startTimeSec),
    "-t", String(durationSec),
    "-i", localInputPath,
    "-vf", videoFilter,
    "-c:v", "libx264",
    "-preset", "fast",
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

  return new Promise((resolve, reject) => {
    console.log(`[FFmpeg] Executing: ${ffmpegPath} ${args.join(" ")}`);
    const proc = spawn(ffmpegPath, args);

    let stderr = "";
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(finalOutput)) {
        console.log(`[FFmpeg] Render succeeded: ${finalOutput} (${(fs.statSync(finalOutput).size / (1024 * 1024)).toFixed(1)} MB)`);
        resolve(finalOutput);
      } else {
        console.warn(`[FFmpeg] Render with ASS failed (exit ${code}). Trying fallback without subtitle filter...`);
        // Fallback: render without ASS filter if the static build lacks libass
        const fallbackArgs = [
          "-y",
          "-ss", String(startTimeSec),
          "-t", String(durationSec),
          "-i", localInputPath,
          "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-maxrate", maxRateArg,
          "-bufsize", bufSizeArg,
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          finalOutput,
        ];

        const fallbackProc = spawn(ffmpegPath, fallbackArgs);
        let fallbackStderr = "";
        fallbackProc.stderr.on("data", (d) => { fallbackStderr += d.toString(); });
        fallbackProc.on("close", (fbCode) => {
          if (fbCode === 0 && fs.existsSync(finalOutput)) {
            console.log(`[FFmpeg] Fallback render succeeded: ${finalOutput}`);
            resolve(finalOutput);
          } else {
            reject(new Error(`FFmpeg failed with code ${fbCode}: ${fallbackStderr || stderr}`));
          }
        });
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
    });
  });
}
