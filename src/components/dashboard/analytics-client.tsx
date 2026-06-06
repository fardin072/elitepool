"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "oklch(0.577 0.245 27.325)",
  MEDIUM: "oklch(0.76 0.17 75)",
  LOW: "oklch(0.68 0.18 145)",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "oklch(0.556 0 0)",
  IN_PROGRESS: "oklch(0.62 0.243 264.376)",
  COMPLETED: "oklch(0.68 0.18 145)",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

export function AnalyticsClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", "", "ALL"],
    queryFn: () => fetch("/api/projects?pageSize=20").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const priorityData = ["HIGH", "MEDIUM", "LOW"].map((p) => ({
    name: p,
    count: d.tasksByPriority.find((x: Record<string, unknown>) => x.priority === p)?._count?.priority ?? 0,
  }));

  const statusData = ["TODO", "IN_PROGRESS", "COMPLETED"].map((s) => ({
    name: STATUS_LABELS[s],
    value: d.tasksByStatus.find((x: Record<string, unknown>) => x.status === s)?._count?.status ?? 0,
    key: s,
  }));

  const projects = projectsData?.data ?? [];
  const projectProgressData = projects.map((p: Record<string, unknown>) => {
    const tasks = (p.tasks as Array<Record<string, string>>) ?? [];
    const total = (p._count as Record<string, number>)?.tasks ?? 0;
    const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
    return {
      name: (p.name as string).slice(0, 16),
      progress: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Workspace performance overview</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tasks by Priority */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityData} barSize={40}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "oklch(1 0 0 / 5%)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Tasks">
                  {priorityData.map((e) => (
                    <Cell key={e.name} fill={PRIORITY_COLORS[e.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {statusData.map((e) => (
                    <Cell key={e.key} fill={STATUS_COLORS[e.key]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Progress */}
        {projectProgressData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={projectProgressData} layout="vertical" barSize={20}>
                  <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={120} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, "Progress"]} />
                  <Bar dataKey="progress" radius={[0, 4, 4, 0]} fill="oklch(0.62 0.243 264.376)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
