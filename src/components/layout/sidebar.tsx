"use client";

import Image from "next/image";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

function NavContent({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onNavigate}>
                <span className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "nav-active-glow text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {expanded && <span>{label}</span>}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 my-3 h-px bg-sidebar-border" />

        <nav className="flex flex-col gap-0.5 px-2">
          <Link href="/settings" onClick={onNavigate}>
            <span className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              pathname.startsWith("/settings")
                ? "nav-active-glow text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}>
              <Settings className={cn("h-4 w-4 shrink-0", pathname.startsWith("/settings") && "text-primary")} />
              {expanded && <span>Settings</span>}
            </span>
          </Link>
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-2">
        <Link href="/profile" onClick={onNavigate}>
          <div className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150 hover:bg-sidebar-accent cursor-pointer",
            pathname === "/profile" && "nav-active-glow"
          )}>
            {expanded && (
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
      </div>
    </>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  return (
    <>
      {/* Desktop sidebar — hidden on mobile/tablet */}
      <aside className={cn(
        "relative hidden lg:flex flex-col border-r border-sidebar-border transition-all duration-300 sidebar-gradient",
        sidebarOpen ? "w-60" : "w-16"
      )}>
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 shrink-0">
          <Image
            src="/logo.png"
            alt="ElitePool"
            width={36}
            height={36}
            className="shrink-0 rounded-xl"
          />
          {sidebarOpen && (
            <span className="text-base font-bold tracking-tight">
              <span className="gradient-text">fws</span>
              <span className="text-sidebar-foreground">Tasks</span>
            </span>
          )}
        </Link>

        <NavContent expanded={sidebarOpen} />

        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-1.5 mx-0 mb-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile sidebar — Sheet drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 sidebar-gradient border-sidebar-border flex flex-col"
        >
          <Link
            href="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 shrink-0"
          >
            <Image
              src="/logo.png"
              alt="ElitePool"
              width={36}
              height={36}
              className="shrink-0 rounded-xl"
            />
            <span className="text-base font-bold tracking-tight">
              <span className="gradient-text">fws</span>
              <span className="text-sidebar-foreground">Tasks</span>
            </span>
          </Link>

          <NavContent expanded onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
