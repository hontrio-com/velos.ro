"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Car,
  Bell,
  BarChart3,
  Settings,
  X,
  ChevronDown,
  Check,
  Plus,
  UserCog,
  Globe,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/stores/app-store";
import { SmsQuotaWidget } from "./sms-quota-widget";

interface Statie {
  id: string;
  nume: string;
  activa: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: string | null; // null = always visible, string = requires this permission key
  ownerOnly?: boolean;        // only shown to owners (never to employees)
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "GESTIUNE",
    items: [
      { href: "/programari", label: "Programări", icon: CalendarDays, permission: "programari" },
      { href: "/clienti", label: "Clienți", icon: Users, permission: "clienti" },
      { href: "/vehicule", label: "Vehicule", icon: Car, permission: "vehicule" },
      { href: "/angajati", label: "Angajați", icon: UserCog, ownerOnly: true },
    ],
  },
  {
    label: "AUTOMATIZĂRI",
    items: [{ href: "/remindere", label: "Remindere", icon: Bell, permission: "remindere" }],
  },
  {
    label: "MARKETING",
    items: [{ href: "/smart-page", label: "ITP Smart Page", icon: Globe, ownerOnly: true }],
  },
  {
    label: "RAPOARTE",
    items: [{ href: "/rapoarte", label: "Rapoarte", icon: BarChart3, permission: "rapoarte" }],
  },
];

function NavItemLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-[#EFF6FF] text-[#1877F2] font-medium"
          : "text-[#374151] hover:bg-[#F9FAFB] font-[450]"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-[#1877F2]" : "text-[#9CA3AF]"
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

function StatieSwitcher({
  statii,
  selectedId,
  onSelect,
  isEmployee,
}: {
  statii: Statie[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isEmployee: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current =
    statii.find((s) => s.id === selectedId) ?? statii[0] ?? null;

  if (statii.length === 0) return null;

  // Employees see their single station — no switcher
  if (isEmployee || statii.length === 1) {
    return (
      <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white">
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            current?.activa ? "bg-emerald-500" : "bg-red-400"
          )}
        />
        <span className="flex-1 text-sm font-medium text-[#111318] truncate">
          {current?.nume ?? "Stație"}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors text-left"
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            current?.activa ? "bg-emerald-500" : "bg-red-400"
          )}
        />
        <span className="flex-1 text-sm font-medium text-[#111318] truncate">
          {current?.nume ?? "Selectează stație"}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
        </motion.div>
      </PopoverTrigger>
      <PopoverContent className="w-[196px] p-1" align="start">
        {statii.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              onSelect(s.id);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                s.activa ? "bg-emerald-500" : "bg-red-400"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.nume}</p>
            </div>
            {s.id === (selectedId ?? statii[0]?.id) && (
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </button>
        ))}
        <div className="border-t border-border mt-1 pt-1">
          <Link
            href="/setari/statii/noua"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Adaugă stație
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SidebarProps {
  statii?: Statie[];
  isOpen?: boolean;
  onClose?: () => void;
  permisiuni?: Record<string, boolean> | null;
  role?: "owner" | "angajat";
  isAdmin?: boolean;
}

export function Sidebar({
  statii = [],
  isOpen = false,
  onClose,
  permisiuni = null,
  role = "owner",
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { statieActivaId, setStatieActivaId } = useAppStore();
  const isEmployee = role === "angajat";

  function isItemVisible(item: NavItem): boolean {
    if (item.ownerOnly) return !isEmployee;
    if (!isEmployee) return true; // owners see everything
    if (!item.permission) return true; // always visible (Dashboard)
    return permisiuni?.[item.permission] === true;
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-[220px] bg-white flex flex-col",
          "border-r border-[#E5E7EB]",
          "transition-transform duration-300 ease-in-out",
          "-translate-x-full lg:translate-x-0",
          isOpen && "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#E5E7EB] shrink-0">
          <Link href="/dashboard" className="flex flex-1 justify-center">
            <Image
              src="/logo441x245.png"
              alt="Velos"
              width={176}
              height={98}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Station switcher */}
        {statii.length > 0 && (
          <div className="px-3 py-3 border-b border-[#E5E7EB] shrink-0">
            <StatieSwitcher
              statii={statii}
              selectedId={statieActivaId}
              onSelect={setStatieActivaId}
              isEmployee={isEmployee}
            />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = group.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            const isActive = (href: string) =>
              pathname === href || pathname.startsWith(href + "/");

            return (
              <div key={gi} className={gi > 0 ? "mt-4" : ""}>
                {group.label && (
                  <p className="px-3 mb-1 text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <li key={item.href}>
                      <NavItemLink
                        item={item}
                        isActive={isActive(item.href)}
                        onClick={onClose}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#E5E7EB] px-2 py-3 space-y-2 shrink-0">
          {!isEmployee && <SmsQuotaWidget />}

          {/* Support card */}
          <a
            href="tel:0757941553"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1877F2]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-white">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#1877F2] leading-tight">Ai nevoie de ajutor?</p>
              <p className="text-[11px] text-[#374151] font-medium leading-tight">0757 941 553</p>
            </div>
          </a>

          {isAdmin && (
            <NavItemLink
              item={{ href: "/admin", label: "Panou Admin", icon: ShieldCheck }}
              isActive={pathname === "/admin" || pathname.startsWith("/admin/")}
              onClick={onClose}
            />
          )}
          <NavItemLink
            item={{ href: "/ajutor", label: "Ajutor", icon: HelpCircle }}
            isActive={pathname === "/ajutor" || pathname.startsWith("/ajutor/")}
            onClick={onClose}
          />
          {!isEmployee && (
            <NavItemLink
              item={{ href: "/setari", label: "Setări", icon: Settings }}
              isActive={pathname === "/setari" || pathname.startsWith("/setari/")}
              onClick={onClose}
            />
          )}
        </div>
      </aside>
    </>
  );
}
