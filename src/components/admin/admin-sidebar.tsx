"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, CreditCard, MessageSquare,
  ArrowLeft, Shield, Settings, Send, ClipboardList, FileText, HeadphonesIcon, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/utilizatori", label: "Utilizatori", icon: Users },
  { href: "/admin/statii", label: "Stații", icon: Building2 },
  { href: "/admin/plati", label: "Plăți SMS", icon: CreditCard },
  { href: "/admin/facturi", label: "Facturi SmartBill", icon: FileText },
  { href: "/admin/suport", label: "Suport", icon: HeadphonesIcon },
  { href: "/admin/sms", label: "SMS Quota", icon: MessageSquare },
  { href: "/admin/broadcast", label: "Broadcast", icon: Send },
  { href: "/admin/setari", label: "Setări", icon: Settings },
  { href: "/admin/audit", label: "Audit Log", icon: ClipboardList },
];

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ userName, userEmail, isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 w-[220px] bg-[#111827] flex flex-col z-50",
        "transition-transform duration-300 ease-in-out",
        "-translate-x-full lg:translate-x-0",
        isOpen && "translate-x-0"
      )}>
        {/* Logo + badge */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Image
              src="/logo441x245.png"
              alt="Velos"
              width={100}
              height={56}
              className="h-7 w-auto object-contain brightness-0 invert"
              priority
            />
            <span className="text-[10px] font-bold bg-[#1877F2] text-white px-1.5 py-0.5 rounded shrink-0">
              ADMIN
            </span>
          </div>
          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-[#1877F2] text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-3 py-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-full bg-[#1877F2]/20 flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5 text-[#1877F2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{userName || userEmail}</p>
              <p className="text-[10px] text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Înapoi la Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
