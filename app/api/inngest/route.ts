import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processVideoWorkflow } from "@/lib/inngest/functions/video-process";

// Create the Inngest API Route handler for Next.js App Router
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processVideoWorkflow],
});
