"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  FolderKanban, CheckSquare, Clock, AlertTriangle, Activity, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksByPriorityChart } from "@/components/charts/tasks-by-priority";
import { TasksByStatusChart } from "@/components/charts/tasks-by-status";
import { formatRelativeTime, formatDate, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalProjects: number; activeProjects: number; totalTasks: number;
    completedTasks: number; pendingTasks: number; overdueTasks: number;
  };
  recentActivity: Array<{
    id: string; action: string; entityName: string | null;
    createdAt: string; user: { id: string; name: string; avatar: string | null };
  }>;
  upcomingTasks: Array<{
    id: string; title: string; dueDate: string; priority: string;
    project: { id: string; name: string };
  }>;
  tasksByPriority: Array<{ priority: string; _count: { priority: number } }>;
  tasksByStatus: Array<{ status: string; _count: { status: number } }>;
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "bg-destructive/15 text-destructive",
  MEDIUM: "bg-yellow-500/15 text-yellow-500",
  LOW: "bg-green-500/15 text-green-500",
};

const kpiConfig = [
  {
    key: "totalProjects",
    label: "Total Projects",
    subKey: "activeProjects",
    subLabel: "active",
    icon: FolderKanban,
    gradient: "from-violet-500 to-indigo-600",
    glow: "shadow-violet-500/20",
  },
  {
    key: "totalTasks",
    label: "Total Tasks",
    subKey: "completedTasks",
    subLabel: "completed",
    icon: CheckSquare,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
  },
  {
    key: "pendingTasks",
    label: "Pending Tasks",
    subLabel: "awaiting completion",
    icon: Clock,
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
  },
  {
    key: "overdueTasks",
    label: "Overdue Tasks",
    subLabel: "past due date",
    icon: AlertTriangle,
    gradient: "from-rose-500 to-red-600",
    glow: "shadow-rose-500/20",
  },
];

export function DashboardClient() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  if (isLoading) return <DashboardLoading />;
  const d = data?.data;
  if (!d) return null;

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {getHour()},{" "}
            <span className="gradient-text">{session?.user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in your workspace today
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiConfig.map((kpi) => {
          const value = d.stats[kpi.key as keyof typeof d.stats];
          const subValue = kpi.subKey ? d.stats[kpi.subKey as keyof typeof d.stats] : null;
          return (
            <Card key={kpi.key} className="overflow-hidden border-white/6 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {kpi.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {subValue !== null && subValue !== undefined
                        ? `${subValue} ${kpi.subLabel}`
                        : kpi.subLabel}
                    </p>
                  </div>
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-lg",
                    kpi.gradient, kpi.glow
                  )}>
                    <kpi.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TasksByPriorityChart data={d.tasksByPriority} />
        <TasksByStatusChart data={d.tasksByStatus} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-white/6 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Activity className="h-3.5 w-3.5 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {d.recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full gradient-brand" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{log.user.name}</span>{" "}
                    <span className="text-muted-foreground">{log.action}</span>
                    {log.entityName && (
                      <span className="font-medium text-foreground"> &ldquo;{log.entityName}&rdquo;</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-white/6 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold">Upcoming Deadlines</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.upcomingTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No deadlines in the next 7 days.</p>
            )}
            {d.upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full gradient-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.project.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={`text-[10px] px-1.5 ${PRIORITY_COLOR[task.priority]}`} variant="secondary">
                    {task.priority}
                  </Badge>
                  <span className={cn("text-xs tabular-nums", isOverdue(task.dueDate) ? "text-destructive" : "text-muted-foreground")}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
