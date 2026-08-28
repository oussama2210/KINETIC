import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type DbUserWithRelations = NonNullable<Awaited<ReturnType<typeof checkAndSyncUser>>>;

/**
 * Server helper to synchronize and fetch authenticated user from Supabase PostgreSQL via Prisma.
 * - Checks DB directly on every visit without requiring webhooks.
 * - Automatically saves new users upon their first arrival to the app.
 * - Updates user info if profile details changed.
 */
export async function checkAndSyncUser() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const imageUrl = clerkUser.imageUrl || "";

    // 1. Fetch or Upsert user safely to prevent concurrent P2002 race conditions
    let dbUser = await prisma.user.upsert({
      where: {
        clerkId: clerkUser.id,
      },
      update: {
        email: email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        imageUrl: imageUrl || undefined,
      },
      create: {
        clerkId: clerkUser.id,
        email: email || `${clerkUser.id}@aivideo.studio`,
        firstName: firstName || "Director",
        lastName: lastName || "Creator",
        imageUrl: imageUrl || null,
        plan: "STUDIO_PRO",
        computeCredits: 600,
        videos: {
          create: [
            {
              title: "Cyberpunk Tokyo Rain (Master)",
              prompt: "Hyper-lapse tracking shot through neon-drenched Neo-Tokyo alleyway in heavy rain, reflections on wet asphalt, volumetric steam, anamorphic 35mm lens.",
              camera: "Orbit Arc (3D)",
              aspectRatio: "16:9",
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
              duration: "00:12",
              fps: 60,
              resolution: "3840x2160",
              published: true,
              channels: ["TikTok", "Reels", "Shorts", "X"],
            },
          ],
        },
      },
      include: {
        videos: {
          orderBy: {
            createdAt: "desc",
          },
        },
        socialAccounts: true,
      },
    });

    return dbUser;
  } catch (error: any) {
    // If concurrent insert race condition occurs (P2002), fallback to findUnique
    if (error?.code === "P2002") {
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const fallbackUser = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id },
            include: {
              videos: { orderBy: { createdAt: "desc" } },
              socialAccounts: true,
            },
          });
          if (fallbackUser) return fallbackUser;
        }
      } catch (fallbackErr) {
        console.warn("Fallback findUnique error:", fallbackErr);
      }
    }
    console.error("[Supabase Prisma Auth Sync Error]:", error);
    return null;
  }
}
