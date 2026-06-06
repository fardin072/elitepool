"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { calcProgressPercent } from "@/lib/utils";

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

export function MembersClient() {
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", search],
    queryFn: () => fetch(`/api/members?search=${encodeURIComponent(search)}`).then((r) => r.json()),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks-all"],
    queryFn: () => fetch("/api/tasks?pageSize=100").then((r) => r.json()),
  });

  const users = usersData?.data ?? [];
  const allTasks: Array<Record<string, unknown>> = tasksData?.data ?? [];

  const workload = users.map((user: Record<string, string>) => {
    const userTasks = allTasks.filter((t) => t.assigneeId === user.id);
    const completed = userTasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = userTasks.filter(
      (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate as string) < new Date()
    ).length;
    return { ...user, total: userTasks.length, completed, pending: userTasks.length - completed, overdue };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">{users.length} members in your workspace</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loadingUsers ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No members found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workload.map((member: typeof workload[number]) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{member.name}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <Badge className={`shrink-0 text-xs ${ROLE_COLORS[member.role]}`} variant="secondary">
                    {ROLE_LABELS[member.role]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{member.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-500">{member.completed}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${member.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {member.overdue}
                    </p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
                {member.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{calcProgressPercent(member.completed, member.total)}%</span>
                    </div>
                    <Progress value={calcProgressPercent(member.completed, member.total)} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
