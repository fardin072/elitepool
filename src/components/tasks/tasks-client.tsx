"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, CheckSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDialog } from "./task-dialog";
import { TaskDetailDialog } from "./task-detail-dialog";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/15 text-primary",
  COMPLETED: "bg-green-500/15 text-green-600 dark:text-green-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-destructive/15 text-destructive",
  MEDIUM: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  LOW: "bg-green-500/15 text-green-600 dark:text-green-400",
};

type TaskRow = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  assignee: { id: string; name: string; avatar?: string } | null;
  project: { id: string; name: string };
};

export function TasksClient({ projectId }: { projectId?: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [sort, setSort] = useState("updated_desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Record<string, unknown> | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const params = new URLSearchParams({ search, sort });
  if (status !== "ALL") params.set("status", status);
  if (priority !== "ALL") params.set("priority", priority);
  if (projectId) params.set("projectId", projectId);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", search, status, priority, sort, projectId],
    queryFn: () => fetch(`/api/tasks?${params}`).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const tasks: TaskRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      {!projectId && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} tasks total</p>
          </div>
        </div>
      )}

      {/* Filters + Sort */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "ALL")}>
          <SelectTrigger className="w-36">
            <SelectValue>
              {{ ALL: "All Status", TODO: "To Do", IN_PROGRESS: "In Progress", COMPLETED: "Completed" }[status]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v ?? "ALL")}>
          <SelectTrigger className="w-32">
            <SelectValue>
              {{ ALL: "All Priority", HIGH: "High", MEDIUM: "Medium", LOW: "Low" }[priority]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v ?? "updated_desc")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Recently Updated</SelectItem>
            <SelectItem value="created_desc">Latest Created</SelectItem>
            <SelectItem value="deadline_asc">Nearest Deadline</SelectItem>
            <SelectItem value="priority_desc">Highest Priority</SelectItem>
          </SelectContent>
        </Select>
        {projectId && (
          <Button onClick={() => { setEditTask(null); setDialogOpen(true); }} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No tasks found.</p>
          {projectId && (
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <Table className="min-w-160">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                {!projectId && <TableHead>Project</TableHead>}
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium max-w-48">
                    <button
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className="truncate text-left hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer w-full"
                    >
                      {task.title}
                    </button>
                  </TableCell>
                  {!projectId && (
                    <TableCell className="text-sm text-muted-foreground">
                      {task.project?.name}
                    </TableCell>
                  )}
                  <TableCell>
                    {task.assignee ? (
                      <span className="text-sm">{task.assignee.name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`} variant="secondary">
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={task.status}
                      onValueChange={(v) => v && statusMutation.mutate({ id: task.id, status: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue>
                          <Badge className={`text-xs ${STATUS_COLORS[task.status]}`} variant="secondary">
                            {{ TODO: "To Do", IN_PROGRESS: "In Progress", COMPLETED: "Completed" }[task.status]}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className={cn("text-sm", isOverdue(task.dueDate) ? "text-destructive" : "text-muted-foreground")}>
                    {formatDate(task.dueDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedTaskId(task.id)}>
                          <CheckSquare className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditTask(task as unknown as Record<string, unknown>); setDialogOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteMutation.mutate(task.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={editTask}
        projectId={projectId}
      />

      <TaskDetailDialog
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onEdit={(task) => {
          setSelectedTaskId(null);
          setEditTask(task);
          setDialogOpen(true);
        }}
      />
    </div>
  );
}
