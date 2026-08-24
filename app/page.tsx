"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StudioWorkspace } from "@/components/StudioWorkspace";
import { SocialDistribution } from "@/components/SocialDistribution";
import { SocialProof } from "@/components/SocialProof";
import { Architecture } from "@/components/Architecture";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { ApiSection } from "@/components/ApiSection";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { CommandPalette } from "@/components/CommandPalette";
import { ArrowRight, Film, Share2 } from "lucide-react";
import Link from "next/link";
export default function Home() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | undefined>(undefined);
  const [activeCamera, setActiveCamera] = useState<string | undefined>(undefined);

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

  const scrollToStudio = () => {
    const el = document.getElementById("studio");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectAction = (action: string, payload?: any) => {
    if (action === "load-preset") {
      setActivePreset(payload);
      scrollToStudio();
    } else if (action === "set-camera") {
      setActiveCamera(payload);
      scrollToStudio();
    }
  };

  const handleSelectPromptFromGallery = (promptText: string, sceneKey: string) => {
    setActivePreset(sceneKey);
    scrollToStudio();
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
        <Hero onScrollToStudio={scrollToStudio} />

        {/* Interactive Studio Workspace */}
        <StudioWorkspace
          externalPreset={activePreset}
          externalCamera={activeCamera}
        />

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
                Generate 4K video. <br className="hidden sm:inline" />
                Broadcast to every platform in seconds.
              </h2>
              
              <p className="text-sm sm:text-base text-[#8a8f98] max-w-lg mx-auto leading-relaxed">
                Connect your TikTok, Instagram Reels, YouTube Shorts, and X accounts to turn text prompts into synchronized viral campaigns automatically.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={scrollToStudio}
                  className="btn-acid-lime px-8 py-3 text-sm cursor-pointer w-full sm:w-auto"
                >
                  <span>Launch Studio &amp; Auto-Post</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
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
