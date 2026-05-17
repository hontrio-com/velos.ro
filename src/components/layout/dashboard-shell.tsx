"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface Statie {
  id: string;
  nume: string;
  activa: boolean;
}

interface DashboardShellProps {
  userEmail?: string;
  userName?: string;
  statii?: Statie[];
  permisiuni?: Record<string, boolean> | null;
  role?: "owner" | "angajat";
  isAdmin?: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  userEmail,
  userName,
  statii = [],
  permisiuni = null,
  role = "owner",
  isAdmin = false,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        statii={statii}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        permisiuni={permisiuni}
        role={role}
        isAdmin={isAdmin}
      />

      <Header
        userEmail={userEmail}
        userName={userName}
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        role={role}
      />

      <main className="lg:ml-[220px] pt-14 min-h-screen">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
