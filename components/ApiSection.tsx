"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Code2, Cpu, Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export function ApiSection() {
  const [activeLang, setActiveLang] = useState<"python" | "typescript" | "curl">("python");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const codeSnippets = {
    python: `import kinetic  # (Coming Soon — SDK v1.0 Private Beta)

# Initialize client with early-access developer key
client = kinetic.Client(api_key="kt_live_coming_soon")

# Direct 4K cinematic video synthesis + Auto-Social distribution
task = client.videos.generate_and_publish(
    prompt="Cyberpunk Neo-Tokyo alleyway in heavy rain, anamorphic 35mm lens",
    resolution="3840x2160",
    fps=60,
    camera={"trajectory": "orbit_3d", "speed": 1.2},
    social_channels=["tiktok", "reels", "youtube_shorts", "x"],
    auto_caption=True
)

print(f"Dispatched across 4 channels. Status: {task.status}")`,

    typescript: `import { KineticClient } from "@kinetic/video-sdk"; // (Coming Soon)

const kinetic = new KineticClient({ 
  apiKey: process.env.KINETIC_BETA_KEY 
});

// Synthesize 4K sequence and auto-publish
const task = await kinetic.videos.generateAndPublish({
  prompt: "Cyberpunk Neo-Tokyo alleyway in heavy rain, anamorphic 35mm lens",
  resolution: "3840x2160",
  fps: 60,
  socialChannels: ["tiktok", "reels", "youtube_shorts", "x"],
  autoCaption: true
});

console.log("Multi-Publish Stream:", task.broadcastUrls);`,

    curl: `curl -X POST https://api.kinetic.video/v1/generate-and-publish \\
  -H "Authorization: Bearer kt_live_beta_access" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Cyberpunk Neo-Tokyo alleyway in heavy rain, anamorphic 35mm lens",
    "resolution": "3840x2160",
    "fps": 60,
    "social_channels": ["tiktok", "reels", "youtube_shorts", "x"],
    "auto_caption": true
  }'`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsJoined(true);
  };

  return (
    <section className="py-24 border-t border-[#161718] bg-[#08090a]" id="api">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: API Info & Waitlist Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono text-[#e4f222]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e4f222] animate-pulse"></span>
                COMING SOON · PRIVATE BETA
              </span>
              <span className="mono-badge text-[10px] text-[#8a8f98]">Q3 2026</span>
            </div>

            <h2 className="section-title text-[#ffffff]">
              Developer SDK &amp; Headless API.
            </h2>
            <p className="text-sm text-[#8a8f98] leading-relaxed">
              We are rolling out private access to our programmatic video rendering &amp; multi-social publishing API for agencies, bot creators, and VFX pipelines.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-xs text-[#d0d6e0]">
                <div className="w-5 h-5 rounded bg-[#161718] border border-[#23252a] flex items-center justify-center text-[#e4f222]">
                  ✓
                </div>
                <span>REST &amp; WebSockets API with sub-400ms cluster latency</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#d0d6e0]">
                <div className="w-5 h-5 rounded bg-[#161718] border border-[#23252a] flex items-center justify-center text-[#e4f222]">
                  ✓
                </div>
                <span>Direct 1-line multi-social auto-publishing endpoint</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#d0d6e0]">
                <div className="w-5 h-5 rounded bg-[#161718] border border-[#23252a] flex items-center justify-center text-[#e4f222]">
                  ✓
                </div>
                <span>Webhooks for frame-by-frame rendering events &amp; EXR depth passes</span>
              </div>
            </div>

            {/* SDK Early Access Waitlist Form */}
            <div className="p-4 rounded-xl bg-[#0f1011] border border-[#23252a] space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-[#ffffff]">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#e4f222]" />
                  Join SDK Early Access Waitlist
                </span>
                <span className="text-[10px] font-mono text-[#27a644]">1,420+ in Queue</span>
              </div>

              {isJoined ? (
                <div className="p-3 rounded-lg bg-[#27a644]/10 border border-[#27a644]/30 text-xs text-[#27a644] flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>You're on the priority list! We'll invite your email soon.</span>
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-[#62666d] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@company.com"
                      className="w-full bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-md pl-9 pr-3 py-2 text-xs text-[#ffffff] placeholder-[#62666d] outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-acid-lime py-2 px-4 text-xs whitespace-nowrap cursor-pointer"
                  >
                    <span>Request API Key</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Code Preview with Coming Soon Ribbon */}
          <div className="lg:col-span-7">
            <div className="hairline-card overflow-hidden bg-[#0a0b0c] border border-[#23252a] relative">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f1011] border-b border-[#23252a]">
                <div className="flex items-center gap-1.5">
                  {(["python", "typescript", "curl"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded text-xs font-mono capitalize transition-all cursor-pointer ${
                        activeLang === lang
                          ? "bg-[#161718] text-[#ffffff] border border-[#383b3f]"
                          : "text-[#8a8f98] hover:text-[#ffffff]"
                      }`}
                    >
                      {lang === "curl" ? "cURL" : lang}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="mono-badge text-[10px] text-[#e4f222]">COMING SOON</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded bg-[#161718] hover:bg-[#23252a] text-[#8a8f98] hover:text-white transition-colors cursor-pointer"
                    title="Copy code preview"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#27a644]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Code Pre Box */}
              <div className="p-5 font-mono text-xs overflow-x-auto leading-relaxed text-[#d0d6e0] selection:bg-[#e4f222] selection:text-[#08090a]">
                <pre>
                  <code>{codeSnippets[activeLang]}</code>
                </pre>
              </div>

              {/* Bottom Subtle Status Bar */}
              <div className="px-4 py-2 bg-[#08090a] border-t border-[#1f2126] flex items-center justify-between text-[11px] font-mono text-[#62666d]">
                <span>npm install @kinetic/video-sdk (Coming Soon)</span>
                <span className="text-[#e4f222]">Private Beta in Progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
