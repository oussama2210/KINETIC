"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, X, LayoutDashboard } from "lucide-react";
import { 
  SignInButton, 
  SignUpButton, 
  Show, 
  UserButton 
} from "@clerk/nextjs";

interface HeaderProps {
  onOpenPalette: () => void;
}

export function Header({ onOpenPalette }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        scrolled 
          ? "bg-[#08090a]/90 backdrop-blur-md border-b border-[#23252a] py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded-md bg-[#161718] border border-[#23252a] flex items-center justify-center group-hover:border-[#e4f222] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <polygon points="5 3 19 12 5 21 5 3" fill="#ffffff"/>
              <path d="M19 4L22 7L19 10" stroke="#e4f222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[15px] font-medium tracking-tight text-[#ffffff]">
            KINETIC
          </span>
          <span className="mono-badge text-[10px] ml-1">
            v3.4
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-[#d0d6e0]">
          <a href="#how" className="hover:text-[#ffffff] transition-colors">How it works</a>
          <a href="#distribution" className="hover:text-[#ffffff] text-[#e4f222] transition-colors">Auto-Publish</a>
          <a href="#features" className="hover:text-[#ffffff] transition-colors">Architecture</a>
          <a href="#showcase" className="hover:text-[#ffffff] transition-colors">Showcase</a>
          <a href="#api" className="hover:text-[#ffffff] flex items-center gap-1.5 transition-colors">
            <span>SDK</span>
            <span className="mono-badge text-[9px] text-[#e4f222]">Coming Soon</span>
          </a>
          <a href="#pricing" className="hover:text-[#ffffff] transition-colors">Pricing</a>
        </nav>

        {/* Actions with Clerk Components */}
        <div className="hidden sm:flex items-center gap-3">
          <button 
            onClick={onOpenPalette}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#0f1011] border border-[#23252a] hover:border-[#383b3f] text-[#8a8f98] hover:text-[#d0d6e0] transition-colors cursor-pointer text-xs"
            title="Quick actions (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Prompt Studio</span>
            <span className="mono-badge text-[10px]">⌘K</span>
          </button>

          {/* Signed Out: Clerk Show component */}
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="text-[13px] text-[#d0d6e0] hover:text-[#ffffff] px-2.5 py-1.5 rounded hover:bg-[#161718] transition-colors cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn-pill-white text-xs cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </Show>

          {/* Signed In: Clerk Show component */}
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-[#d0d6e0] hover:text-[#ffffff] px-3 py-1.5 rounded bg-[#161718] border border-[#23252a] hover:border-[#383b3f] transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#e4f222]" />
              <span>Dashboard</span>
            </Link>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-[#23252a] hover:border-[#e4f222] transition-colors",
                }
              }}
            />
          </Show>
        </div>

        {/* Mobile Hamburger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#d0d6e0] hover:text-white"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f1011] border-b border-[#23252a] px-6 py-4 space-y-3">
          <a 
            href="#how" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-[#d0d6e0] hover:text-white py-1"
          >
            How it works
          </a>
          <a 
            href="#distribution" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-[#e4f222] hover:text-white py-1"
          >
            Social Auto-Publish
          </a>
          <a 
            href="#features" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-[#d0d6e0] hover:text-white py-1"
          >
            Architecture
          </a>
          <a 
            href="#showcase" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-[#d0d6e0] hover:text-white py-1"
          >
            Showcase
          </a>
          <a 
            href="#api" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-[#d0d6e0] hover:text-white py-1"
          >
            SDK (Coming Soon)
          </a>
          <a 
            href="#pricing" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-[#d0d6e0] hover:text-white py-1"
          >
            Pricing
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPalette();
              }}
              className="btn-ghost w-full justify-center text-xs"
            >
              Search Command (⌘K)
            </button>

            <Show when="signed-out">
              <div className="flex gap-2 pt-1">
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <button className="btn-ghost flex-1 justify-center text-xs text-center cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <button className="btn-acid-lime flex-1 justify-center text-xs text-center cursor-pointer">
                    Sign Up Free
                  </button>
                </SignUpButton>
              </div>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center justify-between py-2 border-t border-[#23252a]">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#e4f222] font-medium"
                >
                  Go to Dashboard →
                </Link>
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}
