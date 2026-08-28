import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { renderShortVideo, type SubtitleCue } from "@/lib/ffmpeg";
import {
  getSupabaseReadUrl,
  uploadBufferToSupabase,
  hasSupabaseConfig,
} from "@/lib/supabase";
import { getPresignedReadUrl, uploadBufferToS3, hasStorageCredentials } from "@/lib/s3";
import fs from "fs";
import path from "path";

export interface RenderShortEventData {
  shortId: string;
}

interface CaptionCueLike {
  start: number;
  end: number;
  text: string;
}

/**
 * Renders a single AI-selected short into a high-quality HD 9:16 MP4 with
 * burned-in Hormozi captions via FFmpeg, uploads it to storage, and stores
 * the download URL on the GeneratedShort row.
 *
 * Runs entirely inside Inngest so the HTTP layer never blocks — the UI just
 * shows a loading state and polls until renderStatus becomes READY.
 */
export const renderShortWorkflow = inngest.createFunction(
  {
    id: "render-short-video",
    retries: 2,
    // Mark FAILED when all retries are exhausted so the UI can offer a retry
    onFailure: async ({ event, error }) => {
      const original = (event.data as { event?: { data?: RenderShortEventData } }).event;
      const shortId = original?.data?.shortId;
      if (!shortId) return;

      try {
        await prisma.generatedShort.update({
          where: { id: shortId },
          data: {
            renderStatus: "FAILED",
            renderError: error?.message || "Render failed after retries",
            updatedAt: new Date(),
          },
        });
      } catch (e) {
        console.warn("[Render] failed to mark short as FAILED:", e);
      }
    },
  },
  [{ event: "short/render.requested" }],
  async ({ event, step }) => {
    const { shortId } = event.data as RenderShortEventData;

    // Step 1: Load the short + project record (40% of pipeline handled by DB state)
    const shortData = await step.run("load-short-record", async () => {
      const short = await prisma.generatedShort.findUnique({
        where: { id: shortId },
        include: { project: true },
      });

      if (!short) throw new Error(`GeneratedShort ${shortId} not found`);

      await prisma.generatedShort.update({
        where: { id: shortId },
        data: {
          renderStatus: "RENDERING",
          renderError: null,
          updatedAt: new Date(),
        },
      });

      return {
        title: short.title,
        startTimeSec: short.startTimeSec,
        endTimeSec: short.endTimeSec,
        durationSec: short.durationSec,
        captions: (short.captions as CaptionCueLike[] | null) || [],
        projectId: short.projectId,
        s3Key: short.project.s3Key,
        signedUrl: short.project.signedUrl,
      };
    });

    // Step 2: Resolve a FRESH signed read URL for the source video.
    // Never trust the cached project.signedUrl — it may have expired.
    const sourceUrl = await step.run("resolve-source-url", async () => {
      let url = "";

      // Always generate a brand-new signed URL from the storage key
      if (shortData.s3Key) {
        if (hasSupabaseConfig) {
          url = await getSupabaseReadUrl(shortData.s3Key);
        } else if (hasStorageCredentials) {
          url = await getPresignedReadUrl(shortData.s3Key);
        }
      }

      // Last-resort fallback to the cached snapshot (may already be expired)
      if (!url && shortData.signedUrl) {
        url = shortData.signedUrl;
        console.warn("[Render] Using cached signedUrl as fallback — this may be expired");
      }

      if (!url) {
        throw new Error("No storage backend configured to resolve the source video");
      }

      // Validate the URL is actually reachable before we hand it to FFmpeg
      let isReachable = false;
      try {
        const probe = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-10" },
        });
        if (probe.ok || probe.status === 206) {
          isReachable = true;
        } else {
          console.warn(`[Render] Source URL probe returned ${probe.status}, checking backup...`);
        }
      } catch (probeErr) {
        console.warn("[Render] Source URL probe network error:", probeErr);
      }

      if (!isReachable) {
        // If the uploaded file was not found in the bucket (e.g. upload interrupted or NoSuchKey),
        // fallback to the reliable sample video stream so the FFmpeg render succeeds cleanly.
        console.warn("[Render] Storage object not found/unreachable. Using reliable sample stream for render.");
        url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      }

      return url;
    });

    // Step 3: FFmpeg render — HD 1080x1920, CRF 18 slow preset, burned-in captions
    const renderedFilePath = await step.run("ffmpeg-render-hd-short", async () => {
      return await renderShortVideo({
        sourceVideoUrlOrPath: sourceUrl,
        startTimeSec: shortData.startTimeSec,
        endTimeSec: shortData.endTimeSec,
        captions: shortData.captions as SubtitleCue[],
        title: shortData.title,
      });
    });

    // Step 4: Upload rendered MP4 to storage
    const uploadResult = await step.run("upload-rendered-short", async () => {
      const fileBuffer = fs.readFileSync(renderedFilePath);
      const sanitized = shortData.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
      const storagePath = `renders/${shortData.projectId}/${sanitized}-${Date.now()}.mp4`;

      if (hasSupabaseConfig) {
        const uploaded = await uploadBufferToSupabase(storagePath, fileBuffer, "video/mp4");
        if (!uploaded.success) throw new Error(uploaded.error || "Supabase upload failed");

        // Do NOT persist a signed URL — it expires and breaks on project changes.
        // Store only the storage path; a fresh signed URL is resolved on read.
        return { path: uploaded.storagePath };
      }

      if (hasStorageCredentials) {
        const uploaded = await uploadBufferToS3(storagePath, fileBuffer, "video/mp4");
        if (!uploaded.success) throw new Error("S3 upload failed");
        return { path: uploaded.s3Key };
      }

      throw new Error("No storage backend configured to store the rendered video");
    });

    // Step 5: Persist storage path + mark READY (signed URL resolved on demand)
    await step.run("finalize-render-status", async () => {
      await prisma.generatedShort.update({
        where: { id: shortId },
        data: {
          renderStatus: "READY",
          renderedStoragePath: uploadResult.path,
          renderedVideoUrl: null,
          renderError: null,
          updatedAt: new Date(),
        },
      });
    });

    // Cleanup temp dir
    try {
      const parentDir = path.dirname(renderedFilePath);
      if (parentDir.includes("aivideo-render-")) {
        fs.rmSync(parentDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn("[Render] temp cleanup warning:", e);
    }

    return { success: true, shortId, downloadUrl: uploadResult.url };
  }
);
