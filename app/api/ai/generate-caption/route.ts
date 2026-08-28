import { NextRequest, NextResponse } from "next/server";
import { checkAndSyncUser } from "@/lib/auth-sync";

/**
 * POST /api/ai/generate-caption
 * 
 * Generates AI-powered captions with hashtags for social media posts.
 * Uses Google Gemini or falls back to template-based generation.
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const dbUser = await checkAndSyncUser();
    if (!dbUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, transcript, platforms = [] } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Try Google Gemini if API key exists
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (geminiKey) {
      try {
        const prompt = `Generate an engaging social media caption for this short video:

Title: ${title}
${transcript ? `Transcript excerpt: ${transcript.slice(0, 500)}` : ""}

Platforms: ${platforms.join(", ")}

Requirements:
- Start with an attention-grabbing hook
- 2-3 sentences maximum
- Include 5-8 relevant hashtags
- Use emojis strategically
- Optimize for ${platforms[0] || "viral"} engagement

Generate ONLY the caption text with hashtags, no explanations.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 300,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const caption =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";

          if (caption) {
            return NextResponse.json({ caption: caption.trim() });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API failed, using fallback:", geminiErr);
      }
    }

    // Fallback: Template-based caption generation
    const platformHashtags: Record<string, string[]> = {
      TIKTOK: ["#fyp", "#viral", "#trending", "#foryou", "#foryoupage"],
      REELS: ["#reels", "#reelsinstagram", "#instareels", "#trending", "#viral"],
      SHORTS: ["#shorts", "#youtubeshorts", "#viral", "#trending"],
      X: ["#viral", "#trending", "#thread"],
      LINKEDIN: ["#professional", "#business", "#career", "#linkedin"],
      FACEBOOK: ["#facebook", "#viral", "#trending"],
    };

    const selectedHashtags = new Set<string>();
    
    // Add platform-specific hashtags
    platforms.forEach((platform: string) => {
      const tags = platformHashtags[platform] || [];
      tags.slice(0, 3).forEach((tag) => selectedHashtags.add(tag));
    });

    // Add generic hashtags
    ["#shorts", "#viral", "#trending", "#fyp"].forEach((tag) =>
      selectedHashtags.add(tag)
    );

    const hashtagString = Array.from(selectedHashtags).slice(0, 8).join(" ");

    // Extract key words from title for hooks
    const titleWords = title.split(" ").slice(0, 5).join(" ");

    const hooks = [
      `🔥 ${titleWords}... you won't believe what happens next!`,
      `⚡ ${titleWords} - this is INSANE!`,
      `💥 Watch till the end!`,
      `🎯 ${titleWords}`,
      `🚀 This will blow your mind!`,
    ];

    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];

    const fallbackCaption = `${randomHook}\n\n${hashtagString}`;

    return NextResponse.json({ caption: fallbackCaption });
  } catch (err: any) {
    console.error("Error generating caption:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate caption" },
      { status: 500 }
    );
  }
}
