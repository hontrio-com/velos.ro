"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export function AdminShell({ children, userName, userEmail }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#111827] flex items-center px-4 gap-3 border-b border-white/10">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo441x245.png"
            alt="Velos"
            width={80}
            height={45}
            className="h-6 w-auto object-contain brightness-0 invert"
            priority
          />
          <span className="text-[10px] font-bold bg-[#1877F2] text-white px-1.5 py-0.5 rounded">
            ADMIN
          </span>
        </Link>
      </div>

      <div className="lg:ml-[220px] min-h-screen flex flex-col pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
