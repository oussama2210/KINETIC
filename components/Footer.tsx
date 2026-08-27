"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="border-t border-[#161718] bg-[#08090a] py-16 text-xs text-[#8a8f98]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#161718] border border-[#23252a] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <polygon points="5 3 19 12 5 21 5 3" fill="#ffffff"/>
                  <path d="M19 4L22 7L19 10" stroke="#e4f222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-[#ffffff] tracking-tight">KINETIC</span>
            </div>
            <p className="text-xs text-[#8a8f98] max-w-sm leading-relaxed">
              The all-in-one platform for AI video creation and social distribution. Generate, edit, and publish viral-ready video from a single workspace.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0f1011] border border-[#23252a] text-[11px] font-mono text-[#d0d6e0]">
              <span className="pulse-dot"></span>
              <span>All 10,000+ GPU Nodes Operational</span>
            </div>
          </div>

          {/* Links 1: Product */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-[#ffffff] tracking-tight">Product</div>
            <ul className="space-y-2">
              <li><a href="#studio" className="hover:text-white transition-colors">Prompt Studio</a></li>
              <li><a href="#distribution" className="hover:text-white transition-colors">Auto-Publisher</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Architecture</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">Showcase</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Links 2: Developers */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-[#ffffff] tracking-tight">Developers</div>
            <ul className="space-y-2">
              <li><a href="#api" className="hover:text-white transition-colors flex items-center gap-1.5">Python SDK <span className="text-[10px] text-[#e4f222] font-mono">(Coming Soon)</span></a></li>
              <li><a href="#api" className="hover:text-white transition-colors">REST API Reference</a></li>
              <li><a href="#api" className="hover:text-white transition-colors">Webhooks</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Unreal Engine 5 Bridge</a></li>
              <li><a href="#" className="hover:text-white transition-colors">ComfyUI Nodes</a></li>
            </ul>
          </div>

          {/* Links 3: Company */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-[#ffffff] tracking-tight">Company</div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Research Papers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security &amp; SOC 2</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#161718] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#62666d]">
          <div>
            © 2026 Kinetic AI, Inc. Built for directors, creators &amp; viral publishers.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[#161718] border border-[#23252a] text-[#8a8f98]">⌘</kbd>
              <kbd className="px-1 py-0.5 rounded bg-[#161718] border border-[#23252a] text-[#8a8f98]">K</kbd>
              <span className="ml-1">Quick Launcher</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#161718] border border-[#23252a] text-[#8a8f98]">Space</kbd>
              <span className="ml-1">Play / Pause</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
