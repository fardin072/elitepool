"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  task: Record<string, unknown> | null;
  projectId?: string;
}

export function TaskDialog({ open, onClose, task, projectId }: Props) {
  const qc = useQueryClient();
  const isEdit = !!task;
  const pid = (task?.projectId as string) ?? projectId;

  const { data: membersData } = useQuery({
    queryKey: ["members", pid],
    queryFn: () => fetch(`/api/members?projectId=${pid}`).then((r) => r.json()),
    enabled: !!pid,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<CreateTaskInput>({
      resolver: zodResolver(createTaskSchema),
      defaultValues: { priority: "MEDIUM", status: "TODO", title: "", description: "", assigneeId: "" },
    });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title as string,
        description: (task.description as string) ?? "",
        assigneeId: (task.assigneeId as string) ?? "",
        dueDate: task.dueDate
          ? new Date(task.dueDate as string).toISOString().split("T")[0]
          : "",
        priority: task.priority as "HIGH" | "MEDIUM" | "LOW",
        status: task.status as "TODO" | "IN_PROGRESS" | "COMPLETED",
      });
    } else {
      reset({ priority: "MEDIUM", status: "TODO", title: "", description: "", assigneeId: "" });
    }
  }, [task, reset]);

  const members = membersData?.data ?? [];

  const onSubmit = async (data: CreateTaskInput) => {
    const targetProjectId = pid;
    const url = isEdit ? `/api/tasks/${task!.id}` : `/api/tasks?projectId=${targetProjectId}`;
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Request failed");
      return;
    }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    toast.success(isEdit ? "Task updated" : "Task created");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Task Title *</Label>
            <Input placeholder="Describe the task..." {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="Additional details..." rows={3} {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={watch("priority")}
                onValueChange={(v) => v && setValue("priority", v as "HIGH" | "MEDIUM" | "LOW")}
              >
                <SelectTrigger>
                  <SelectValue>{{ HIGH: "High", MEDIUM: "Medium", LOW: "Low" }[watch("priority") ?? ""]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => v && setValue("status", v as "TODO" | "IN_PROGRESS" | "COMPLETED")}
              >
                <SelectTrigger>
                  <SelectValue>{{ TODO: "To Do", IN_PROGRESS: "In Progress", COMPLETED: "Completed" }[watch("status") ?? ""]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select
                value={watch("assigneeId") ?? ""}
                onValueChange={(v) => setValue("assigneeId", v ?? "")}
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {members.map((m: Record<string, unknown>) => {
                    const user = (m.user ?? m) as Record<string, string>;
                    return (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
