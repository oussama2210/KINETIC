import { checkAndSyncUser } from "@/lib/auth-sync";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  // 1. Fetch authenticated user from Clerk and check/create/sync with Supabase via Prisma
  const dbUser = await checkAndSyncUser();

  // 2. Render client dashboard with the fresh Supabase database user record
  return <DashboardClient initialDbUser={dbUser} />;
}