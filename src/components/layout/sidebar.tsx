"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { sidebarOpen, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "flex flex-col border-r border-sidebar-border sidebar-gradient transition-all duration-300",
        // Mobile: fixed overlay, slides in/out
        "fixed inset-y-0 left-0 z-50 md:relative md:z-auto",
        mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
        // Desktop: collapsed or expanded
        sidebarOpen ? "w-64" : "md:w-16 w-64",
      )}>
        {/* Logo */}
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden">
            <Image src="/logo.png" alt="fwsTasks" width={36} height={36} className="object-contain" />
          </div>
          {(sidebarOpen || mobileMenuOpen) && (
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
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                  <span className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "nav-active-glow text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}>
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                    {(sidebarOpen || mobileMenuOpen) && <span>{label}</span>}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mx-4 my-3 h-px bg-sidebar-border" />

          <nav className="flex flex-col gap-0.5 px-2">
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
              <span className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                pathname.startsWith("/settings")
                  ? "nav-active-glow text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
                <Settings className={cn("h-4 w-4 shrink-0", pathname.startsWith("/settings") && "text-primary")} />
                {(sidebarOpen || mobileMenuOpen) && <span>Settings</span>}
              </span>
            </Link>
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-2">
          <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
            <div className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150 hover:bg-sidebar-accent cursor-pointer",
              pathname === "/profile" && "nav-active-glow"
            )}>
              {(sidebarOpen || mobileMenuOpen) && (
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

          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleSidebar}
            className="mt-1 hidden md:flex w-full items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}
