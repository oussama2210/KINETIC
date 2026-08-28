import { NextRequest, NextResponse } from "next/server";
import { checkAndSyncUser } from "@/lib/auth-sync";
import {
  ensureProfileId,
  getConnectUrlFor,
  zernioEnabled,
  PLATFORM_MAP,
} from "@/lib/zernio";

/**
 * POST /api/social/connect
 * Generate OAuth URL for connecting a social platform via Zernio.
 *
 * Body: { platform: "TIKTOK" | "REELS" | "SHORTS" | "X" | "LINKEDIN" | "FACEBOOK" }
 * Returns: { authUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!zernioEnabled) {
      return NextResponse.json(
        {
          error: "Social publishing is not configured. ZERNIO_API_KEY is missing.",
        },
        { status: 503 }
      );
    }

    // Authenticate user
    const dbUser = await checkAndSyncUser();
    if (!dbUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { platform } = body;

    // Validate platform
    if (!platform || !PLATFORM_MAP[platform]) {
      return NextResponse.json(
        {
          error: `Invalid platform. Must be one of: ${Object.keys(PLATFORM_MAP).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Ensure user has a Zernio profile ID (create if needed)
    const profileId = await ensureProfileId(dbUser);

    // Build callback URL
    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const redirectUrl = `${origin}/api/social/callback`;

    // Generate OAuth URL from Zernio
    const authUrl = await getConnectUrlFor(platform, profileId, redirectUrl);

    return NextResponse.json({ authUrl });
  } catch (err: any) {
    console.error("Error in /api/social/connect:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate OAuth URL" },
      { status: 500 }
    );
  }
}
