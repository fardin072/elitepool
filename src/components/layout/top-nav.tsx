"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings, Moon, Sun, ChevronDown, UserCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CommandPalette } from "@/components/layout/command-palette";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_MEMBER: "Team Member",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-destructive/15 text-destructive",
  PROJECT_MANAGER: "bg-primary/15 text-primary",
  TEAM_MEMBER: "bg-muted text-muted-foreground",
};

export function TopNav() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-background/80 px-6 backdrop-blur-sm">
      <CommandPalette />

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 rounded-lg"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <NotificationBell />

        <div className="mx-1 h-5 w-px bg-border" />

        {/* User menu — monogram tile trigger, no circle avatar */}
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all hover:bg-accent outline-none">
              <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="hidden flex-col items-start sm:flex">
                <span className="text-sm font-semibold leading-none text-foreground">
                  {session.user.name}
                </span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">
                  {ROLE_LABELS[session.user.role] ?? session.user.role}
                </span>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* Header: name + email + role — no avatar */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold leading-none">{session.user.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[session.user.role]}`} variant="secondary">
                        {ROLE_LABELS[session.user.role]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut({
                      callbackUrl: "/login",
                      redirect: true,
                    });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
