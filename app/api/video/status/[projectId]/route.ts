import { NextRequest, NextResponse } from "next/server";
import { slidingWindow } from "@arcjet/next";
import { aj } from "@/lib/arcjet";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getSupabaseReadUrl, hasSupabaseConfig } from "@/lib/supabase";
import { getPresignedReadUrl, hasStorageCredentials } from "@/lib/s3";

// Polling endpoint: generous sliding window so status refreshes aren't throttled
const ajStatus = aj.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: 60,
    max: 60,
  })
);

/**
 * Generate a fresh signed read URL from the storage key.
 * Never rely on the cached `signedUrl` column — it expires.
 */
async function freshSignedUrl(s3Key: string | null | undefined): Promise<string> {
  if (!s3Key) return "";
  try {
    if (hasSupabaseConfig) {
      return await getSupabaseReadUrl(s3Key);
    }
    if (hasStorageCredentials) {
      return await getPresignedReadUrl(s3Key);
    }
  } catch (e) {
    console.warn("[Status] Could not regenerate signed URL for key:", s3Key, e);
  }
  return "";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const decision = await ajStatus.protect(req);

    if (decision.isDenied()) {
      return NextResponse.json(
        { success: false, error: "Too many requests — slow down." },
        { status: 429 }
      );
    }

    const { projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    let project: any = null;
    try {
      // withDbRetry absorbs transient Supabase pooler P1001 errors
      project = await withDbRetry(() =>
        (prisma as any).project.findUnique({
          where: { id: projectId },
          include: {
            shorts: true,
            generatedShorts: {
              orderBy: { rank: "asc" },
            },
          },
        })
      );
    } catch (e) {
      console.warn("Prisma project query fallback", e);
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // ── Always serve a FRESH signed URL so the player never gets a stale one ──
    const liveSignedUrl = await freshSignedUrl(project.s3Key);
    if (liveSignedUrl) {
      project.signedUrl = liveSignedUrl;
    }

    // Refresh videoUrl on every GeneratedShort so the player works even after
    // the original snapshot expires (for shorts that haven't been rendered yet)
    if (project.generatedShorts?.length) {
      for (const gs of project.generatedShorts) {
        if (gs.renderStatus === "READY") {
          // Resolve a FRESH signed download URL from the stored storage path.
          // The cached renderedVideoUrl expires / invalidates on project changes,
          // so we always regenerate it here at read time.
          const freshDownload = await freshSignedUrl(gs.renderedStoragePath || null);
          if (freshDownload) {
            gs.renderedVideoUrl = freshDownload;
          }
        } else if (gs.renderStatus !== "READY" || !gs.renderedVideoUrl) {
          // Only refresh the preview URL; rendered shorts already have their own URL
          gs.videoUrl = liveSignedUrl || gs.videoUrl;
        }
      }
    }

    // Also refresh ShortClip videoUrl for the legacy player
    if (project.shorts?.length && liveSignedUrl) {
      for (const sc of project.shorts) {
        sc.videoUrl = liveSignedUrl;
      }
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error("Fetch project status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project status" },
      { status: 500 }
    );
  }
}
