"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: Array<{ priority: string; _count: { priority: number } }>;
}

// Premium semantic colors — not raw red/green, but sophisticated tones
const COLORS: Record<string, string> = {
  HIGH: "oklch(0.640 0.220 22)",    // deep crimson
  MEDIUM: "oklch(0.750 0.175 72)",  // warm golden amber
  LOW: "oklch(0.660 0.175 148)",    // sage emerald
};

const LABELS: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Med",
  LOW: "Low",
};

const TooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

export function TasksByPriorityChart({
  data,
}: Props) {
  const chartData = ["HIGH", "MEDIUM", "LOW"].map((p) => ({
    name: LABELS[p],
    key: p,
    count: data.find((d) => d.priority === p)?._count.priority ?? 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Tasks by Priority</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={40} barGap={8}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={24}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4, radius: 4 }}
              contentStyle={TooltipStyle}
              formatter={(value) => [value, "Tasks"]}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
