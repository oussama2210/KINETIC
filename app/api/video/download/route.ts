import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Streams a rendered short MP4 through this server with
 * Content-Disposition: attachment so the browser saves it.
 *
 * Why a proxy? Some networks break Chrome's QUIC (HTTP/3) connection to
 * Supabase Storage (net::ERR_QUIC_PROTOCOL_ERROR), which kills direct
 * anchor downloads. Node's server-side fetch uses plain HTTP/1.1 over TCP,
 * so relaying through here always works. Only our own Supabase project
 * host is allowed — this can't be abused as an open proxy.
 */

const ALLOWED_HOST_PATTERN = /\.supabase\.co$/i;

/**
 * Build a Content-Disposition value that is safe for ASCII and non-ASCII
 * titles (RFC 5987 `filename*` encoding), so the saved file keeps its
 * real name even with Arabic/Unicode characters.
 */
function contentDispositionValue(name: string): string {
  const clean = (name || "short").slice(0, 80);
  // The legacy `filename` parameter MUST be ASCII (HTTP header ByteString),
  // so strip every non-ASCII character here. The full Unicode name is carried
  // safely in the RFC 5987 `filename*` parameter instead.
  const ascii = clean.replace(/[^a-zA-Z0-9_\- ]/g, "_").replace(/\s+/g, "_") || "short";
  const fallback = `${ascii}.mp4`;
  const encoded = encodeURIComponent(`${clean}.mp4`);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shortId = searchParams.get("shortId");

    if (!shortId) {
      return NextResponse.json({ error: "Missing shortId" }, { status: 400 });
    }

    const short = await prisma.generatedShort.findUnique({
      where: { id: shortId },
      select: {
        title: true,
        renderedVideoUrl: true,
        videoUrl: true,
        project: { select: { signedUrl: true } },
      },
    });

    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    // Prefer the FFmpeg-rendered HD file; fall back to source playback URL
    const targetUrl =
      short.renderedVideoUrl || short.videoUrl || short.project.signedUrl;

    if (!targetUrl) {
      return NextResponse.json(
        { error: "No rendered video available yet — render it first." },
        { status: 404 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: "Invalid stored URL" }, { status: 500 });
    }

    if (!ALLOWED_HOST_PATTERN.test(parsed.hostname)) {
      return NextResponse.json(
        { error: "Host not allowed" },
        { status: 403 }
      );
    }

    // Forward any Range header so the browser can download in chunks and
    // resume interrupted downloads instead of restarting the whole file.
    // This is the main speed win for large HD MP4s.
    const range = req.headers.get("range");
    const upstreamHeaders: Record<string, string> = {};
    if (range) upstreamHeaders["Range"] = range;

    // Server-side fetch (HTTP/1.1 via undici — immune to the QUIC bug)
    const upstream = await fetch(parsed.toString(), {
      headers: upstreamHeaders,
      // Don't cache upstream so fresh bytes always come back
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Storage returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const fileName = contentDispositionValue(short.title);
    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    headers.set("Content-Disposition", fileName);
    // Advertise that we (and the upstream) support range/resume
    headers.set("Accept-Ranges", "bytes");
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);
    // Let edge/CDN cache completed (non-range) responses briefly for repeats
    if (!range) headers.set("Cache-Control", "public, max-age=300");

    // Stream bytes straight through — nothing buffered in memory.
    // Status 206 when serving a partial range, 200 otherwise.
    return new NextResponse(upstream.body, {
      status: upstream.status === 206 ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("[Download API Error]:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
