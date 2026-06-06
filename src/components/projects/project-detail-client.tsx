"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksClient } from "@/components/tasks/tasks-client";
import { formatDate, calcProgressPercent } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-600 dark:text-green-400",
  COMPLETED: "bg-primary/15 text-primary",
  ON_HOLD: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "PM",
  TEAM_MEMBER: "Member",
};

export function ProjectDetailClient({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetch(`/api/projects/${id}`).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const project = data?.data;
  if (!project) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-muted-foreground">Project not found.</p>
        <Link href="/projects"><Button variant="outline">Back to Projects</Button></Link>
      </div>
    );
  }

  const total = project._count?.tasks ?? project.tasks?.length ?? 0;
  const completed = project.tasks?.filter((t: Record<string, string>) => t.status === "COMPLETED").length ?? 0;
  const progress = calcProgressPercent(completed, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={`text-xs ${STATUS_COLORS[project.status]}`} variant="secondary">
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{progress}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{completed}/{total} tasks done</p>
                <Progress value={progress} className="mt-2 h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{formatDate(project.deadline)}</p>
                <p className="text-xs text-muted-foreground">Deadline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{project.members?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Team members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({total})</TabsTrigger>
          <TabsTrigger value="members">Members ({project.members?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4">
          <TasksClient projectId={id} />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(project.members ?? []).map((m: Record<string, unknown>) => {
              const user = m.user as Record<string, string>;
              return (
                <Card key={m.userId as string}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge className="shrink-0 text-xs" variant="outline">
                        {ROLE_LABELS[m.role as string]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
