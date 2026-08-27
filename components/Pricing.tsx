"use client";

import React, { useState } from "react";
import { Check, Sparkles, Zap, Shield, Share2 } from "lucide-react";
import { SignUpButton, Show } from "@clerk/nextjs";
import Link from "next/link";

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-24 border-t border-[#161718] bg-[#08090a]" id="pricing">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-[650px] mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono text-[#e4f222]">
            <span>TRANSPARENT COMPUTE</span>
          </div>
          <h2 className="section-title text-[#ffffff]">
            Pricing that scales with your content.
          </h2>
          <p className="text-sm text-[#8a8f98]">
            Start free, then pay only for the compute you use. Every plan includes AI video generation and one-click multi-platform publishing.
          </p>

          {/* Billing Interval Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs">
            <span className={!isAnnual ? "text-[#ffffff] font-medium" : "text-[#8a8f98]"}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-[#161718] border border-[#23252a] p-0.5 flex items-center transition-colors cursor-pointer"
              aria-label="Toggle Annual Billing"
            >
              <div 
                className={`w-5 h-5 rounded-full bg-[#ffffff] transition-transform ${
                  isAnnual ? "translate-x-6 bg-[#e4f222]" : "translate-x-0"
                }`}
              />
            </button>
            <span className={isAnnual ? "text-[#ffffff] font-medium" : "text-[#8a8f98]"}>
              Annual <span className="text-[#27a644] font-mono ml-1 text-[11px]">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Creator Plan */}
          <div className="hairline-card p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-[510] text-[#ffffff]">Creator</h3>
                <p className="text-xs text-[#8a8f98]">For solo content creators and indie filmmakers.</p>
              </div>

              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-3xl font-[510] text-[#ffffff] font-mono">
                  ${isAnnual ? "24" : "29"}
                </span>
                <span className="text-xs text-[#8a8f98]">/ month</span>
              </div>

              <div className="border-t border-[#1f2126] pt-4 space-y-2.5 text-xs text-[#d0d6e0]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span><strong>120 min</strong> 1080p generation / mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span><strong>3 Connected Social Accounts</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span>9:16 Vertical &amp; 16:9 Auto-Crop</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span>AI Viral Captions &amp; Hashtags</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span>Web Studio access</span>
                </div>
              </div>
            </div>

            <Show when="signed-out">
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="btn-ghost w-full justify-center py-2.5 text-xs cursor-pointer">
                  Start Free Trial
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="btn-ghost w-full justify-center py-2.5 text-xs text-center">
                Manage Plan in Dashboard
              </Link>
            </Show>
          </div>

          {/* Studio Pro Plan (Electric Acid Lime Highlight) */}
          <div className="hairline-card relative p-8 flex flex-col justify-between space-y-6 border-[#e4f222]/40 bg-[#121314] shadow-[0_0_30px_rgba(228,242,34,0.05)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#e4f222] text-[#08090a] text-[10px] font-mono font-medium tracking-wide">
              MOST POPULAR
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-[510] text-[#ffffff]">Studio Pro</h3>
                <p className="text-xs text-[#8a8f98]">For viral creators, social media agencies, and VFX teams.</p>
              </div>

              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-3xl font-[510] text-[#ffffff] font-mono">
                  ${isAnnual ? "79" : "99"}
                </span>
                <span className="text-xs text-[#8a8f98]">/ month</span>
              </div>

              <div className="border-t border-[#23252a] pt-4 space-y-2.5 text-xs text-[#d0d6e0]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span><strong>600 min</strong> Native 4K UHD compute</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span><strong>Unlimited Connected Social Channels</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>1-Click Multi-Publish to TikTok, Reels, Shorts, X</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>AI Automated Calendar Scheduler</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>ProRes 4444 &amp; 32-bit EXR depth export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>Full API &amp; Webhook Access (10 req/s)</span>
                </div>
              </div>
            </div>

            <Show when="signed-out">
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="btn-acid-lime w-full justify-center py-2.5 text-xs cursor-pointer">
                  Upgrade to Studio Pro
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="btn-acid-lime w-full justify-center py-2.5 text-xs text-center">
                Upgrade in Dashboard
              </Link>
            </Show>
          </div>

          {/* Enterprise Plan */}
          <div className="hairline-card p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-[510] text-[#ffffff]">Enterprise</h3>
                <p className="text-xs text-[#8a8f98]">For media agencies managing 100+ client brand accounts.</p>
              </div>

              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-3xl font-[510] text-[#ffffff] font-mono">Custom</span>
                <span className="text-xs text-[#8a8f98]">Bespoke Cluster</span>
              </div>

              <div className="border-t border-[#1f2126] pt-4 space-y-2.5 text-xs text-[#d0d6e0]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span>Unlimited dedicated H100 GPU nodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span>Multi-Brand Social Media Workspace Separation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span>Zero data retention guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8a8f98]" />
                  <span>24/7 dedicated engineering &amp; SLA support</span>
                </div>
              </div>
            </div>

            <button className="btn-ghost w-full justify-center py-2.5 text-xs cursor-pointer">
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
