"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export type DashboardTab = 
  | "home" 
  | "my-videos" 
  | "schedule" 
  | "connect-social" 
  | "account" 
  | "settings" 
  | "profile";

interface DashboardContextType {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  quickModal: string | null;
  setQuickModal: (modal: string | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const queryTab = searchParams.get("tab") as DashboardTab | null;
  const initialTab: DashboardTab = 
    queryTab && ["home", "my-videos", "schedule", "connect-social", "account", "settings", "profile"].includes(queryTab)
      ? queryTab
      : "home";

  const [activeTab, setActiveTabState] = useState<DashboardTab>(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [quickModal, setQuickModal] = useState<string | null>(null);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (queryTab && queryTab !== activeTab && ["home", "my-videos", "schedule", "connect-social", "account", "settings", "profile"].includes(queryTab)) {
      setActiveTabState(queryTab);
    }
  }, [queryTab, activeTab]);

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
    });
  };

  return (
    <DashboardContext.Provider
      value={{
        activeTab,
        setActiveTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        quickModal,
        setQuickModal,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
