"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
  Search,
  Building2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchCommand } from "./search-command";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userEmail?: string;
  userName?: string;
  onMenuToggle?: () => void;
}

export function Header({ userEmail, userName, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? "?";

  const displayName = userName
    ? userName.split(" ")[0]
    : userEmail?.split("@")[0] ?? "";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // ⌘K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 lg:left-[220px] z-30 h-14 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-4 md:px-6">
        {/* Left: hamburger (mobile) + search */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "hidden sm:flex items-center gap-2 h-[34px] w-[280px] px-3 rounded-lg",
              "border border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] text-[13px]",
              "hover:border-[#D1D5DB] transition-colors"
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Caută client, vehicul...</span>
            <span className="flex items-center justify-center px-1.5 py-0.5 rounded bg-[#F7F8FA] text-[#9CA3AF] text-[11px] font-mono leading-none">
              ⌘K
            </span>
          </button>
        </div>

        {/* Right: bell + user */}
        <div className="flex items-center gap-1.5">
          {/* Bell */}
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F9FAFB] transition-colors"
          >
            <Bell className="h-4 w-4 text-[#374151]" />
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-[#F9FAFB] transition-colors outline-none"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-[#1877F2] text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-[#374151] hidden md:block max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="h-3 w-3 text-[#9CA3AF] hidden md:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                  {userEmail}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push("/setari/profil")}>
                  <User className="h-4 w-4" />
                  Profilul meu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/setari/statii")}>
                  <Building2 className="h-4 w-4" />
                  Stațiile mele
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/setari")}>
                  <Settings className="h-4 w-4" />
                  Setări
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Deconectare
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
