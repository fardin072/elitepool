"use client";

import Link from "next/link";
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
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside className={cn(
      "relative flex flex-col border-r border-sidebar-border transition-all duration-300 sidebar-gradient",
      sidebarOpen ? "w-60" : "w-16"
    )}>
      {/* Logo */}
      <Link href="/" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-violet-500/20">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-5z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
  );
}
