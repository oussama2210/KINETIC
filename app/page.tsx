"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SocialDistribution } from "@/components/SocialDistribution";
import { SocialProof } from "@/components/SocialProof";
import { Architecture } from "@/components/Architecture";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { ApiSection } from "@/components/ApiSection";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { CommandPalette } from "@/components/CommandPalette";
import { ArrowRight, Film, Share2, Upload, Wand2, Send, Sparkles } from "lucide-react";
import Link from "next/link";
export default function Home() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const scrollToHow = () => {
    const el = document.getElementById("how");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectAction = (action: string, payload?: any) => {
    scrollToHow();
  };

  const handleSelectPromptFromGallery = (promptText: string, sceneKey: string) => {
    scrollToHow();
  };

  return (
    <div className="relative min-h-screen bg-[#08090a] text-[#d0d6e0] font-sans selection:bg-[#e4f222] selection:text-[#08090a] overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#08090a]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e4f222]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#02b8cc]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-[#6366f1]/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08090a]/50 to-[#08090a]" />
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectAction={handleSelectAction}
      />

      {/* Navigation Header */}
      <Header onOpenPalette={() => setIsPaletteOpen(true)} />

      <main>
        {/* Hero Section */}
        <Hero onScrollToStudio={scrollToHow} />

      {/* How it works — upload long video, get shorts */}
      <section className="py-20 border-t border-[#161718] bg-[#08090a]" id="how">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[700px] mb-14">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono text-[#e4f222] mb-4">
              <span>HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-[510] text-[#ffffff] tracking-tight mb-4">
              One upload. A feed of ready-to-post shorts.
            </h2>
            <p className="text-sm text-[#8a8f98] leading-relaxed">
              No prompts, no editing timeline. Drop in a long-form video and KINETIC does the repurposing for you.
            </p>
          </div>

          {/* Video Example Showcase */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left: Before (Long Video) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#161718] border border-[#23252a] flex items-center justify-center text-xs font-mono text-[#8a8f98]">
                    1
                  </div>
                  <span className="text-sm font-medium text-white">Upload Long Video</span>
                  <span className="text-xs text-[#8a8f98] font-mono">16:9 · 10 min</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-[#23252a] bg-[#0f1011]">
                  <video
                    className="w-full aspect-video object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop"
                  >
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-[#08090a]/80 backdrop-blur-sm border border-[#23252a] text-[10px] font-mono text-[#8a8f98]">
                    Original · 1920x1080
                  </div>
                </div>
              </div>

              {/* Right: After (Shorts) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e4f222] border border-[#e4f222] flex items-center justify-center text-xs font-mono text-[#08090a]">
                    2
                  </div>
                  <span className="text-sm font-medium text-white">Get AI-Generated Shorts</span>
                  <span className="text-xs text-[#e4f222] font-mono">9:16 · 30-60s</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { title: "Hook #1", score: 94, url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
                    { title: "Hook #2", score: 89, url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
                    { title: "Hook #3", score: 87, url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
                  ].map((short, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-[#23252a] bg-[#0f1011] group">
                      <video
                        className="w-full aspect-[9/16] object-cover"
                        loop
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      >
                        <source src={short.url} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08090a]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-[9px] font-mono text-white mb-1">{short.title}</div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-1 bg-[#23252a] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#e4f222] rounded-full" 
                                style={{ width: `${short.score}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-[#e4f222] font-mono">{short.score}</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#e4f222] text-[8px] font-mono text-[#08090a] font-bold">
                        9:16
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8a8f98]">
                  <Sparkles className="w-4 h-4 text-[#e4f222]" />
                  <span>AI selected 3 viral moments · Auto-captioned · Ready to publish</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="hairline-card p-7 bg-[#0f1011] border border-[#23252a] rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#161718] border border-[#23252a] flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#e4f222]" />
              </div>
              <h3 className="text-base font-[510] text-white">1 · Upload your video</h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Drag in any long-form recording — a webinar, podcast, tutorial, or gameplay. We handle 4K and long files.
              </p>
            </div>

            <div className="hairline-card p-7 bg-[#0f1011] border border-[#23252a] rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#161718] border border-[#23252a] flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-[#02b8cc]" />
              </div>
              <h3 className="text-base font-[510] text-white">2 · AI finds the moments</h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                We transcribe the audio, score each moment for virality, and auto-reframe, caption, and trim into 9:16 shorts.
              </p>
            </div>

            <div className="hairline-card p-7 bg-[#0f1011] border border-[#23252a] rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#161718] border border-[#23252a] flex items-center justify-center">
                <Send className="w-5 h-5 text-[#27a644]" />
              </div>
              <h3 className="text-base font-[510] text-white">3 · Publish everywhere</h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Review, then publish or schedule to TikTok, Instagram Reels, YouTube Shorts, and X in one click.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/dashboard" className="btn-acid-lime px-7 py-3 text-sm cursor-pointer">
              <span>Start repurposing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#showcase" className="btn-ghost px-6 py-3 text-sm">
              <span>See example shorts</span>
            </a>
          </div>
        </div>
      </section>

        {/* Unified Social Media Auto-Publisher Hub */}
        <SocialDistribution />

        {/* Customer Social Proof Strip */}
        <SocialProof />

        {/* Core Architecture Capabilities & Interactive Comparison */}
        <Architecture />

        {/* Video Gallery Showcase */}
        <ShowcaseGallery onSelectPrompt={handleSelectPromptFromGallery} />

        {/* Developer API & SDK */}
        <ApiSection />

        {/* Predictable Pricing */}
        <Pricing />

        {/* Pre-Footer Action Banner */}
        <section className="py-20 border-t border-[#161718] bg-[#08090a] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="hairline-card p-10 sm:p-14 bg-gradient-to-b from-[#121315] to-[#0a0b0c] text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono text-[#e4f222]">
                <Share2 className="w-3.5 h-3.5" />
                <span>ONE-CLICK AUTO-PUBLISH</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-[510] text-[#ffffff] tracking-tight">
                Upload once. <br className="hidden sm:inline" />
                Publish the best moments everywhere.
              </h2>
              
              <p className="text-sm sm:text-base text-[#8a8f98] max-w-lg mx-auto leading-relaxed">
                Connect your TikTok, Instagram Reels, YouTube Shorts, and X accounts and we'll turn one long video into a full feed of shorts — trimmed, captioned, and ready to publish.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="btn-acid-lime px-8 py-3 text-sm cursor-pointer w-full sm:w-auto"
                >
                  <span>Upload your video</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#distribution" className="btn-ghost px-6 py-3 text-sm w-full sm:w-auto">
                  <span>Explore Social Integrations</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
