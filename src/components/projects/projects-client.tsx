"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, Folder, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDialog } from "./project-dialog";
import { formatDate, calcProgressPercent } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-600 dark:text-green-400",
  COMPLETED: "bg-primary/15 text-primary",
  ON_HOLD: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
};

type ProjectRow = {
  id: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  tasks?: Array<{ status: string }>;
  _count?: { tasks: number };
};

export function ProjectsClient() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Record<string, unknown> | null>(null);

  const params = new URLSearchParams({ search });
  if (status !== "ALL") params.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search, status],
    queryFn: () => fetch(`/api/projects?${params}`).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
  });

  const projects: ProjectRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} projects total</p>
        </div>
        <Button onClick={() => { setEditProject(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "ALL")}>
          <SelectTrigger className="w-36">
            <SelectValue>
              {{ ALL: "All Status", ACTIVE: "Active", COMPLETED: "Completed", ON_HOLD: "On Hold" }[status]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Folder className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No projects found. Create your first project to get started.</p>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const total = project._count?.tasks ?? project.tasks?.length ?? 0;
            const completed = project.tasks?.filter((t) => t.status === "COMPLETED").length ?? 0;
            const progress = calcProgressPercent(completed, total);

            return (
              <Card key={project.id} className="group relative transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/projects/${project.id}`} className="flex-1 hover:underline">
                      <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditProject(project as unknown as Record<string, unknown>); setDialogOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteMutation.mutate(project.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge className={`w-fit text-xs ${STATUS_COLORS[project.status]}`} variant="secondary">
                    {project.status.replace("_", " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{total} tasks</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(project.deadline)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        project={editProject}
      />
    </div>
  );
}
