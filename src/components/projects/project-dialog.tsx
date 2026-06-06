"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  project: Record<string, unknown> | null;
}

export function ProjectDialog({ open, onClose, project }: Props) {
  const qc = useQueryClient();
  const isEdit = !!project;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<CreateProjectInput>({
      resolver: zodResolver(createProjectSchema),
      defaultValues: { status: "ACTIVE", name: "", description: "" },
    });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name as string,
        description: (project.description as string) ?? "",
        status: project.status as "ACTIVE" | "COMPLETED" | "ON_HOLD",
        deadline: project.deadline
          ? new Date(project.deadline as string).toISOString().split("T")[0]
          : "",
      });
    } else {
      reset({ status: "ACTIVE", name: "", description: "", deadline: "" });
    }
  }, [project, reset]);

  const mutation = useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const url = isEdit ? `/api/projects/${project!.id}` : "/api/projects";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Request failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isEdit ? "Project updated" : "Project created");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (data: CreateProjectInput) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project Name *</Label>
            <Input placeholder="My Awesome Project" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="What is this project about?" rows={3} {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => v && setValue("status", v as "ACTIVE" | "COMPLETED" | "ON_HOLD")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input type="date" {...register("deadline")} />
              {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
