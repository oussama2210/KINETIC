import { NextRequest, NextResponse } from "next/server";
import { fixedWindow } from "@arcjet/next";
import { aj } from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";
import { getSupabaseReadUrl, hasSupabaseConfig } from "@/lib/supabase";
import { getPresignedReadUrl, hasStorageCredentials } from "@/lib/s3";

// Resolve a fresh signed read URL from a storage path — signed URLs expire and
// invalidate on Supabase project changes, so we never serve a cached one.
async function freshSignedUrl(storagePath: string | null | undefined): Promise<string> {
  if (!storagePath) return "";
  try {
    if (hasSupabaseConfig) return await getSupabaseReadUrl(storagePath);
    if (hasStorageCredentials) return await getPresignedReadUrl(storagePath);
  } catch (e) {
    console.warn("[Export] Could not regenerate signed URL for path:", storagePath, e);
  }
  return "";
}

// Fire-and-forget endpoint: queues an Inngest render job and returns instantly.
// The heavy FFmpeg work happens in the background workflow, so there is no
// HTTP timeout risk. The UI polls /api/video/status until renderStatus = READY.
const ajExport = aj.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1h",
    max: 30,
  })
);

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const decision = await ajExport.protect(req);

    if (decision.isDenied()) {
      return NextResponse.json(
        { success: false, error: "Too many render requests — try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { shortId } = body;

    if (!shortId) {
      return NextResponse.json(
        { success: false, error: "Missing shortId" },
        { status: 400 }
      );
    }

    const short = await prisma.generatedShort.findUnique({
      where: { id: shortId },
      select: {
        id: true,
        title: true,
        renderStatus: true,
        renderedVideoUrl: true,
        renderedStoragePath: true,
        updatedAt: true,
      },
    });

    if (!short) {
      return NextResponse.json(
        { success: false, error: "Short not found" },
        { status: 404 }
      );
    }

    // Already rendered — resolve a FRESH signed download URL from the storage
    // path (never serve the cached one, which expires / invalidates on project changes)
    if (short.renderStatus === "READY") {
      let downloadUrl = "";
      try {
        downloadUrl = await freshSignedUrl(short.renderedStoragePath || null);
      } catch {
        downloadUrl = "";
      }
      if (!downloadUrl && short.renderedVideoUrl) downloadUrl = short.renderedVideoUrl;

      if (downloadUrl) {
        return NextResponse.json({
          success: true,
          shortId,
          renderStatus: "READY",
          downloadUrl,
        });
      }
    }

    // Stuck-run detection: QUEUED/RENDERING is only honored while fresh.
    // If the workflow died (crash, upload 413, restart), re-queue after 5 min
    // instead of blocking the button forever.
    const STALE_AFTER_MS = 5 * 60 * 1000;
    const isStale =
      (short.renderStatus === "QUEUED" || short.renderStatus === "RENDERING") &&
      Date.now() - new Date(short.updatedAt).getTime() > STALE_AFTER_MS;

    if (
      !isStale &&
      (short.renderStatus === "QUEUED" || short.renderStatus === "RENDERING")
    ) {
      return NextResponse.json({
        success: true,
        shortId,
        renderStatus: short.renderStatus,
      });
    }

    // Queue the background render job (returns immediately — no blocking)
    await inngest.send({
      name: "short/render.requested",
      data: { shortId },
    });

    await prisma.generatedShort.update({
      where: { id: shortId },
      data: { renderStatus: "QUEUED", renderError: null },
    });

    console.log(`[Export API] Queued Inngest render for short "${short.title}" (${shortId})`);

    return NextResponse.json({
      success: true,
      shortId,
      renderStatus: "QUEUED",
    });
  } catch (error: any) {
    console.error("[Export API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to queue render job",
      },
      { status: 500 }
    );
  }
}
