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
import { ArrowRight, Film, Share2, Upload, Wand2, Send } from "lucide-react";
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
    <div className="relative min-h-screen bg-[#08090a] text-[#d0d6e0] font-sans selection:bg-[#e4f222] selection:text-[#08090a]">
      {/* Ambient background glow */}
      <div className="ambient-glow" aria-hidden="true" />

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
