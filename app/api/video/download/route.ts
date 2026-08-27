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

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF ]/g, "_").slice(0, 80);
  return `${cleaned || "short"}.mp4`;
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

    // Server-side fetch (HTTP/1.1 via undici — immune to the QUIC bug)
    const upstream = await fetch(parsed.toString());

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Storage returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const fileName = sanitizeFileName(short.title);
    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);

    // Stream bytes straight through — nothing buffered in memory
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("[Download API Error]:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
