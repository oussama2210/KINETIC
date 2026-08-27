"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Share2, Sparkles } from "lucide-react";

interface HeroProps {
  onScrollToStudio: () => void;
}

export function Hero({ onScrollToStudio }: HeroProps) {
  return (
    <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 text-center px-4 overflow-hidden">
      <div className="max-w-[900px] mx-auto flex flex-col items-center">
        {/* Release Pill Announcement */}
        <a 
          href="#distribution"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161718] border border-[#23252a] hover:border-[#383b3f] text-[#d0d6e0] text-xs font-normal transition-all mb-8 group cursor-pointer"
        >
          <span className="pulse-dot"></span>
          <span className="text-[#d0d6e0] group-hover:text-white">
            New: 1-Click Multi-Social Media Auto-Publisher &amp; Smart 9:16 Reframe
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#8a8f98] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </a>

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-[510] tracking-[-0.025em] text-[#ffffff] leading-[1.04] mb-6">
          Upload one long video. <br className="hidden sm:inline" />
          Get a feed of <span className="text-[#e4f222]">viral shorts</span>.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#8a8f98] max-w-[680px] leading-relaxed font-normal mb-8">
          KINETIC turns your long-form videos into polished, captioned 9:16 shorts. We find the best moments, auto-reframe and transcribe them, then publish straight to <span className="text-[#ffffff]">TikTok, Instagram Reels, YouTube Shorts, and X</span> — no editing required.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center mb-14">
          <Link
            href="/dashboard"
            className="btn-acid-lime w-full sm:w-auto px-6 py-3 text-sm cursor-pointer"
          >
            <span>Upload your video</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
           
          <a 
            href="#how" 
            className="btn-ghost w-full sm:w-auto px-5 py-3 text-sm flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5 text-[#02b8cc]" />
            <span>See how it works</span>
          </a>
        </div>

        {/* Performance Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 py-4 px-6 rounded-xl bg-[#0f1011]/80 border border-[#23252a] w-full max-w-[780px]">
          <div className="flex flex-col items-center">
            <span className="text-base sm:text-lg font-mono font-medium text-[#ffffff]">Any length</span>
            <span className="text-[11px] text-[#8a8f98]">Long video in, shorts out</span>
          </div>
          <div className="flex flex-col items-center border-l-0 md:border-l border-[#23252a]">
            <span className="text-base sm:text-lg font-mono font-medium text-[#e4f222]">5 Channels</span>
            <span className="text-[11px] text-[#8a8f98]">1-Click Multi-Publish</span>
          </div>
          <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-[#23252a] pt-3 md:pt-0">
            <span className="text-base sm:text-lg font-mono font-medium text-[#02b8cc]">9:16 / 16:9</span>
            <span className="text-[11px] text-[#8a8f98]">AI Subject Re-framing</span>
          </div>
          <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-[#23252a] pt-3 md:pt-0">
            <span className="text-base sm:text-lg font-mono font-medium text-[#ffffff]">Auto-SEO</span>
            <span className="text-[11px] text-[#8a8f98]">Viral AI Captions</span>
          </div>
        </div>
      </div>
    </section>
  );
}
