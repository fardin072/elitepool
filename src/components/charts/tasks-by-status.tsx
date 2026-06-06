"use client";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: Array<{ status: string; _count: { status: number } }>;
}

const COLORS: Record<string, string> = {
  TODO: "oklch(0.450 0.050 265)",       // muted violet-gray
  IN_PROGRESS: "oklch(0.660 0.263 264.376)",  // brand violet
  COMPLETED: "oklch(0.660 0.175 148)",  // sage emerald
};

const LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const TooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

export function TasksByStatusChart({ data }: Props) {
  const chartData = ["TODO", "IN_PROGRESS", "COMPLETED"].map((s) => ({
    name: LABELS[s],
    value: data.find((d) => d.status === s)?._count.status ?? 0,
    key: s,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TooltipStyle}
              formatter={(value, name) => [value, name]}
            />
            <Legend
              formatter={(value) => (
                <span
                  style={{ fontSize: "11px", color: "var(--muted-foreground)" }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
