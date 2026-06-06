"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, Inbox, FolderPlus, CheckSquare, Pencil, Play } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Activity {
  id: string;
  action: string;
  entityName: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

// Map activity actions to icons + colors instead of user avatars
const ACTION_META: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  "created project": { icon: FolderPlus,   color: "text-violet-400",   bg: "bg-violet-500/15" },
  "created task":    { icon: CheckSquare,  color: "text-emerald-400",  bg: "bg-emerald-500/15" },
  "completed task":  { icon: CheckSquare,  color: "text-emerald-400",  bg: "bg-emerald-500/15" },
  "updated task":    { icon: Pencil,       color: "text-amber-400",    bg: "bg-amber-500/15" },
  "started task":    { icon: Play,         color: "text-sky-400",      bg: "bg-sky-500/15" },
  "updated project": { icon: Pencil,       color: "text-amber-400",    bg: "bg-amber-500/15" },
};

function getActionMeta(action: string) {
  const key = Object.keys(ACTION_META).find((k) => action.includes(k));
  return key ? ACTION_META[key] : { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/activity?limit=12").then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const activities: Activity[] = data?.data ?? [];
  const unread = activities.filter((a) => !readIds.has(a.id));

  const handleOpen = (val: boolean) => {
    if (val) {
      setTimeout(() => setReadIds(new Set(activities.map((a) => a.id))), 1500);
    }
    setOpen(val);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none">
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full gradient-brand text-[9px] font-bold text-white ring-[1.5px] ring-background">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-90 p-0 shadow-xl border-border/80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full gradient-brand px-1.5 text-[10px] font-bold text-white">
                {unread.length}
              </span>
            )}
          </div>
          {activities.length > 0 && (
            <button
              onClick={() => setReadIds(new Set(activities.map((a) => a.id)))}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-85">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Inbox className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-xs text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <div>
              {activities.map((activity, i) => {
                const isUnread = !readIds.has(activity.id);
                const meta = getActionMeta(activity.action);
                const IconComp = meta.icon;

                return (
                  <div key={activity.id}>
                    {i > 0 && <Separator className="opacity-40" />}
                    <div className={cn(
                      "flex gap-3 px-4 py-3 transition-colors",
                      isUnread ? "bg-primary/6" : "hover:bg-muted/40"
                    )}>
                      {/* Activity type icon — no user avatar */}
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
                        <IconComp className={cn("h-4 w-4", meta.color)} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">{activity.user.name}</span>{" "}
                          <span className="text-muted-foreground">{activity.action}</span>
                          {activity.entityName && (
                            <span className="font-medium text-foreground"> &ldquo;{activity.entityName}&rdquo;</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>

                      {isUnread && (
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full gradient-brand" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="px-4 py-2.5">
          <p className="text-center text-xs text-muted-foreground">
            Showing last {activities.length} activities
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
