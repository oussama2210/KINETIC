import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REVERSE_PLATFORM_MAP } from "@/lib/zernio";

/**
 * GET /api/social/callback
 * OAuth callback from Zernio after user authorizes a social account.
 *
 * Query params: connected, profileId, accountId, username
 * Saves SocialAccount to DB and redirects to dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const connected = searchParams.get("connected"); // Zernio platform slug (e.g., "tiktok")
    const profileId = searchParams.get("profileId");
    const accountId = searchParams.get("accountId");
    const username = searchParams.get("username");

    // Validate required params
    if (!connected || !profileId || !accountId) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/dashboard?tab=connect-social&error=missing_params`
      );
    }

    // Map Zernio slug back to our platform ID
    const platform = REVERSE_PLATFORM_MAP[connected];
    if (!platform) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/dashboard?tab=connect-social&error=unsupported_platform`
      );
    }

    // Find user by Zernio profile ID
    const user = await prisma.user.findFirst({
      where: { zernioProfileId: profileId },
    });

    if (!user) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/dashboard?tab=connect-social&error=user_not_found`
      );
    }

    // Upsert SocialAccount record
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
      update: {
        zernioAccountId: accountId,
        username: username || undefined,
        connected: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        platform,
        handle: username || `@${platform.toLowerCase()}`,
        zernioAccountId: accountId,
        username: username || undefined,
        connected: true,
      },
    });

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      `${req.nextUrl.origin}/dashboard?tab=connect-social&connected=1&platform=${platform}`
    );
  } catch (err) {
    console.error("Error in /api/social/callback:", err);
    return NextResponse.redirect(
      `${req.nextUrl.origin}/dashboard?tab=connect-social&error=callback_failed`
    );
  }
}
