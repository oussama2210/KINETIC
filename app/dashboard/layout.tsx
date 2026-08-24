"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { 
  Home,
  Video, 
  Calendar, 
  Share2, 
  CreditCard, 
  Settings, 
  User, 
  Sparkles,
  ChevronRight, 
  ChevronLeft, 
  Menu, 
  X, 
  ArrowLeft,
  Search,
  Bell,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  HelpCircle
} from "lucide-react";
import { DashboardProvider, useDashboard, DashboardTab } from "./DashboardContext";

interface NavItem {
  id: DashboardTab;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    sublabel: "Overview & metrics",
    icon: Home,
  },
  {
    id: "my-videos",
    label: "My Video",
    sublabel: "4K Studio & renders",
    icon: Video,
    badge: "4K UHD",
    badgeColor: "bg-[#e4f222]/15 text-[#e4f222] border-[#e4f222]/30",
  },
  {
    id: "schedule",
    label: "Schedule",
    sublabel: "Auto-publisher queue",
    icon: Calendar,
    badge: "3 Queued",
    badgeColor: "bg-[#02b8cc]/15 text-[#02b8cc] border-[#02b8cc]/30",
  },
  {
    id: "connect-social",
    label: "Connect Social",
    sublabel: "TikTok, Reels, Shorts, X",
    icon: Share2,
    badge: "4 Active",
    badgeColor: "bg-[#27a644]/15 text-[#27a644] border-[#27a644]/30",
  },
  {
    id: "account",
    label: "Account",
    sublabel: "GPU minutes & billing",
    icon: CreditCard,
    badge: "Studio Pro",
    badgeColor: "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30",
  },
  {
    id: "settings",
    label: "Settings",
    sublabel: "Presets & API keys",
    icon: Settings,
  },
  {
    id: "profile",
    label: "Profile",
    sublabel: "Clerk user & security",
    icon: User,
  },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { 
    activeTab, 
    setActiveTab, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    setQuickModal
  } = useDashboard();

  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090a] text-[#d0d6e0] flex flex-col font-sans selection:bg-[#e4f222] selection:text-[#08090a]">
      {/* Top Header: Brand Name & Logo + Breadcrumbs + Status + Quick Actions */}
      <header className="h-14 border-b border-[#23252a] bg-[#0c0d0e]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Mobile Toggle & Brand Logo & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            type="button"
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded-md text-[#8a8f98] hover:text-white hover:bg-[#161718] transition-colors cursor-pointer"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-[#161718] border border-[#23252a] flex items-center justify-center group-hover:border-[#e4f222] shadow-[0_0_12px_rgba(228,242,34,0.15)] group-hover:shadow-[0_0_16px_rgba(228,242,34,0.35)] transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polygon points="5 3 19 12 5 21 5 3" fill="#ffffff" />
                <path d="M19 4L22 7L19 10" stroke="#e4f222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[14px] font-[600] text-[#ffffff] tracking-tight group-hover:text-[#e4f222] transition-colors">
                KINETIC
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-[#e4f222] bg-[#e4f222]/10 border border-[#e4f222]/30 px-1.5 py-0.2 rounded">
                AI STUDIO
              </span>
            </div>
          </Link>

          <span className="hidden sm:inline-block text-[#383b3f]">/</span>

          {/* Breadcrumb Workspace Info */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#8a8f98]">
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab("home")}>Workspace #01</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#383b3f]" />
            <span className="text-[#d0d6e0] font-mono text-[11px] capitalize bg-[#161718] px-2 py-0.5 rounded border border-[#23252a]">
              {activeTab.replace("-", " ")}
            </span>
          </div>
        </div>

        {/* Center: Search / Quick Command Jump Button */}
        <div className="hidden md:flex items-center">
          <button 
            type="button"
            onClick={() => setActiveTab("my-videos")}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#161718] border border-[#23252a] text-xs text-[#8a8f98] hover:text-white hover:border-[#383b3f] transition-all w-48 sm:w-64"
          >
            <Search className="w-3.5 h-3.5 text-[#62666d]" />
            <span className="flex-1 text-left text-[11px]">Search videos, posts...</span>
            <kbd className="text-[9px] font-mono bg-[#0f1011] border border-[#23252a] px-1.5 py-0.5 rounded text-[#62666d]">⌘K</kbd>
          </button>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Node GPU Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#27a644] animate-pulse shadow-[0_0_8px_#27a644]"></span>
            <span className="text-[#8a8f98]">H100 Nodes:</span>
            <span className="text-[#27a644] font-medium">Ready</span>
          </div>

          {/* Quick "+ New Video" Trigger */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("my-videos");
              setQuickModal("synthesizer");
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a] text-xs font-[510] transition-colors shadow-[0_0_12px_rgba(228,242,34,0.25)] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Create Video</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-1.5 rounded-md text-[#8a8f98] hover:text-white hover:bg-[#161718] transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#e4f222]"></span>
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0f1011] border border-[#23252a] rounded-lg shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#23252a]">
                  <span className="text-xs font-semibold text-white">Activity Alerts</span>
                  <span className="text-[10px] text-[#e4f222] font-mono">3 New</span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2 rounded bg-[#161718] border border-[#23252a]/60">
                    <p className="text-white text-[11px] font-medium">4K Master Render Complete</p>
                    <p className="text-[#8a8f98] text-[10px]">Cyberpunk Neo-Tokyo finished in 14.2s</p>
                  </div>
                  <div className="p-2 rounded bg-[#161718] border border-[#23252a]/60">
                    <p className="text-[#02b8cc] text-[11px] font-medium">Auto-Published to TikTok & Reels</p>
                    <p className="text-[#8a8f98] text-[10px]">Scheduled post went live successfully</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Landing Page Link */}
          <Link 
            href="/"
            className="hidden xl:flex text-xs text-[#8a8f98] hover:text-white items-center gap-1 px-2 py-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing</span>
          </Link>

          {/* Clerk User Button */}
          <div className="pl-1">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-[#23252a] hover:border-[#e4f222] transition-colors shadow-sm",
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Workspace Layout (Sliding Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Slide Drawer Backdrop */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sliding Navigation Sidebar */}
        <aside 
          className={`border-r border-[#23252a] bg-[#090a0b] flex flex-col justify-between transition-all duration-300 ease-in-out z-40 ${
            sidebarCollapsed ? "w-20" : "w-64"
          } ${
            mobileSidebarOpen 
              ? "fixed inset-y-14 left-0 w-64 block bg-[#090a0b] shadow-2xl" 
              : "hidden md:flex"
          }`}
        >
          {/* Top Section of Sidebar: Nav Links */}
          <div className="p-3 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* Slide Collapse / Expand Toggle Button (Desktop) */}
            <div className="hidden md:flex items-center justify-between px-2 pt-1 pb-1">
              {!sidebarCollapsed && (
                <span className="text-[10px] font-mono text-[#62666d] tracking-wider uppercase">
                  Studio Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className={`p-1.5 rounded text-[#8a8f98] hover:text-white hover:bg-[#161718] transition-colors cursor-pointer ${
                  sidebarCollapsed ? "mx-auto" : ""
                }`}
                title={sidebarCollapsed ? "Expand sidebar (Slide out)" : "Collapse sidebar (Slide in)"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-[#e4f222]" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Nav Menu Items */}
            <nav className="space-y-1.5" aria-label="Dashboard views">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                      isActive
                        ? "bg-[#161718] text-[#ffffff] border border-[#23252a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#121315] border border-transparent"
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {/* Active Accent Bar Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#e4f222] shadow-[0_0_8px_#e4f222]" />
                    )}

                    <Icon 
                      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-[#e4f222]" : "text-[#8a8f98] group-hover:text-white"
                      }`} 
                    />

                    {!sidebarCollapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <div className="flex flex-col items-start truncate">
                          <span className="truncate">{item.label}</span>
                          {item.sublabel && (
                            <span className="text-[10px] text-[#62666d] font-normal truncate">
                              {item.sublabel}
                            </span>
                          )}
                        </div>

                        {item.badge && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor || "bg-[#161718] text-[#8a8f98] border-[#23252a]"}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Footer Section in Nav Slide */}
          <div className="p-3 border-t border-[#23252a] bg-[#0c0d0e]/50 space-y-3">
            {!sidebarCollapsed ? (
              <>
                {/* GPU Compute Mini Meter */}
                <div className="p-3 rounded-lg bg-[#0f1011] border border-[#23252a] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#8a8f98]">
                      <Zap className="w-3.5 h-3.5 text-[#e4f222]" />
                      <span>GPU Quota</span>
                    </div>
                    <span className="text-[#e4f222] font-mono text-[10px]">Studio Pro</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#161718] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#27a644] to-[#e4f222] w-[30.6%] rounded-full transition-all duration-500"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#62666d]">
                    <span>184 / 600 min</span>
                    <span className="text-[#27a644]">416 min free</span>
                  </div>
                </div>

                {/* Status & Version Footer Bar */}
                <div className="flex items-center justify-between px-1 text-[10px] text-[#62666d] font-mono">
                  <div className="flex items-center gap-1.5 text-[#27a644]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27a644]"></span>
                    <span>100% Operational</span>
                  </div>
                  <span>v3.4.2</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-8 h-8 rounded bg-[#0f1011] border border-[#23252a] flex items-center justify-center text-[#e4f222] hover:border-[#e4f222] transition-colors"
                  title="GPU Minutes: 416 min left"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Dashboard Main Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#08090a] flex flex-col justify-between min-h-[calc(100vh-3.5rem)]">
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            {children}
          </div>

          {/* Sleek Dashboard Footer */}
          <footer className="border-t border-[#161718] bg-[#090a0b]/80 px-6 py-4 text-xs text-[#8a8f98] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#161718] border border-[#23252a] flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                  <polygon points="5 3 19 12 5 21 5 3" fill="#ffffff" />
                  <path d="M19 4L22 7L19 10" stroke="#e4f222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[11px] text-[#d0d6e0] font-medium">KINETIC AI Studio</span>
              <span className="text-[#383b3f]">|</span>
              <span className="text-[11px] text-[#62666d]">Autonomous 4K Video Synthesizer &amp; Multi-Social Auto-Publisher</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <button 
                type="button" 
                onClick={() => setActiveTab("settings")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                API Presets
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab("account")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Billing &amp; Compute
              </button>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Docs</span>
                <ExternalLink className="w-3 h-3 text-[#62666d]" />
              </a>
              <span className="text-[#62666d]">© 2026 Kinetic Labs</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08090a] flex items-center justify-center text-xs text-[#8a8f98]">Loading studio engine...</div>}>
      <DashboardProvider>
        <DashboardShell>
          {children}
        </DashboardShell>
      </DashboardProvider>
    </Suspense>
  );
}
