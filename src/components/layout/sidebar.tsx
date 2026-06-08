"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Users, BarChart3, ChevronLeft, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { ScrollArea } from "@/components/ui/scroll-area";

const ROLE_SHORT: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "PM",
  TEAM_MEMBER: "Member",
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/members", label: "Members", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border sidebar-gradient",
        "transition-all duration-300",
        "md:relative md:z-auto",
        sidebarOpen
          ? "w-64 md:w-60 translate-x-0"
          : "w-64 md:w-16 -translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden">
            <Image src="/logo.png" alt="ElitePool" width={36} height={36} className="object-contain w-full h-full" />
          </div>
          {sidebarOpen && (
            <span className="text-base font-bold tracking-tight">
              <span className="gradient-text">fws</span>
              <span className="text-sidebar-foreground">Tasks</span>
            </span>
          )}
        </Link>

        {/* Nav items */}
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <span className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "nav-active-glow text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}>
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                    {sidebarOpen && <span>{label}</span>}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mx-4 my-3 h-px bg-sidebar-border" />

          <nav className="flex flex-col gap-0.5 px-2">
            <Link href="/settings">
              <span className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                pathname.startsWith("/settings")
                  ? "nav-active-glow text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
                <Settings className={cn("h-4 w-4 shrink-0", pathname.startsWith("/settings") && "text-primary")} />
                {sidebarOpen && <span>Settings</span>}
              </span>
            </Link>
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-2">
          <Link href="/profile">
            <div className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150 hover:bg-sidebar-accent cursor-pointer",
              pathname === "/profile" && "nav-active-glow"
            )}>
              {sidebarOpen && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-sidebar-foreground leading-none">
                    {session?.user?.name ?? "…"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {ROLE_SHORT[session?.user?.role ?? ""] ?? "Member"}
                  </p>
                </div>
              )}
            </div>
          </Link>

          <button
            onClick={toggleSidebar}
            className="mt-1 flex w-full items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}
