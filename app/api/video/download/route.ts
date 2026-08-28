/**
 * GET /api/video/download?shortId=xxx
 *
 * Streams the rendered short video back from storage through our own server
 * and returns it as a same-origin attachment. We deliberately DO NOT redirect
 * to the Supabase signed URL — that would expose the storage URL to the user
 * and, for cross-origin links, browsers ignore the download attribute and just
 * navigate to the Supabase page. Streaming keeps the download on our domain and
 * still works behind the Inngest render flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseReadUrl, hasSupabaseConfig } from "@/lib/supabase";
import { getPresignedReadUrl, hasStorageCredentials } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shortId = searchParams.get("shortId");

    if (!shortId) {
      return NextResponse.json({ error: "Missing shortId" }, { status: 400 });
    }

    // Fetch the short — prefer the stored storage PATH so we can resolve a fresh
    // signed URL (the cached renderedVideoUrl may be expired / from an old project).
    const short = await prisma.generatedShort.findUnique({
      where: { id: shortId },
      select: {
        title: true,
        renderStatus: true,
        renderedStoragePath: true,
        renderedVideoUrl: true,
        videoUrl: true,
        project: {
          select: {
            s3Key: true,
            s3Bucket: true,
            signedUrl: true,
          },
        },
      },
    });

    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    if (short.renderStatus !== "READY") {
      return NextResponse.json(
        { error: "Render not ready yet" },
        { status: 409 }
      );
    }

    // Resolve a storage path (prefer rendered output, fall back to source).
    let storageKey = short.renderedStoragePath || "";

    function keyFromUrl(raw?: string | null): string {
      if (!raw) return "";
      try {
        const url = new URL(raw);
        const match = url.pathname.match(
          /\/storage\/v1\/object\/(?:sign|public)\/[^/]+\/(.+)$/
        );
        if (match && match[1]) return match[1].split("?")[0];
      } catch {
        /* ignore */
      }
      return "";
    }

    if (!storageKey) storageKey = keyFromUrl(short.renderedVideoUrl);
    if (!storageKey) storageKey = keyFromUrl(short.videoUrl);
    if (!storageKey && short.project.s3Key) storageKey = short.project.s3Key;

    if (!storageKey) {
      return NextResponse.json(
        { error: "No video available for download" },
        { status: 404 }
      );
    }

    // Resolve the actual (fresh) download URL from storage.
    let sourceUrl = "";
    if (hasSupabaseConfig) {
      sourceUrl = await getSupabaseReadUrl(storageKey);
    } else if (hasStorageCredentials) {
      sourceUrl = await getPresignedReadUrl(storageKey);
    } else {
      sourceUrl = short.renderedVideoUrl || short.videoUrl || short.project.signedUrl || "";
    }

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Could not generate download URL" },
        { status: 500 }
      );
    }

    // Stream the file back through our server as a same-origin attachment.
    const upstream = await fetch(sourceUrl);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Failed to fetch video from storage" },
        { status: 502 }
      );
    }

    const cleanTitle = (short.title || "short").replace(/[^a-zA-Z0-9_\- ]/g, "_");
    const filename = `${cleanTitle}.mp4`;

    // Relay the upstream body directly (no buffering of the whole file).
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": upstream.headers.get("Content-Length") || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        // Allow the browser to stream the download
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error: any) {
    console.error("[Download API Error]:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
