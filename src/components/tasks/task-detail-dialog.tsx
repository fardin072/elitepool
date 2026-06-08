"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Pencil, Paperclip, Trash2, Download, Loader2,
  MessageSquare, FileText, Image as ImageIcon, File,
  Calendar, User, Folder,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate, formatRelativeTime, formatFileSize, getInitials, isOverdue } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/15 text-primary",
  COMPLETED: "bg-green-500/15 text-green-600 dark:text-green-400",
};
const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", COMPLETED: "Completed",
};
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-destructive/15 text-destructive",
  MEDIUM: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  LOW: "bg-green-500/15 text-green-600 dark:text-green-400",
};

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-400" />;
  if (mimeType === "application/pdf") return <FileText className="h-4 w-4 text-red-400" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

interface TaskFull {
  id: string; title: string; description: string | null;
  status: string; priority: string; dueDate: string | null;
  project: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  comments: Array<{ id: string; body: string; createdAt: string; author: { id: string; name: string; avatar: string | null } }>;
  attachments: Array<{ id: string; name: string; size: number; mimeType: string; createdAt: string }>;
}

interface Props {
  taskId: string | null;
  onClose: () => void;
  onEdit: (task: Record<string, unknown>) => void;
}

export function TaskDetailDialog({ taskId, onClose, onEdit }: Props) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const [commentBody, setCommentBody] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingName, setUploadingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: taskData, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetch(`/api/tasks/${taskId}`).then((r) => r.json()),
    enabled: !!taskId,
  });
  const task: TaskFull | undefined = taskData?.data;

  const addComment = useMutation({
    mutationFn: (body: string) =>
      fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task", taskId] }); setCommentBody(""); },
    onError: () => toast.error("Failed to post comment"),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task", taskId] }),
    onError: () => toast.error("Failed to delete comment"),
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task", taskId] }),
    onError: () => toast.error("Failed to delete attachment"),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;
    e.target.value = "";

    setIsUploading(true);
    setUploadingName(file.name);
    try {
      // Upload via server proxy — avoids S3 CORS entirely
      const form = new FormData();
      form.append("file", file);
      form.append("taskId", taskId);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) { toast.error((await res.json()).error ?? "Upload failed"); return; }
      const { s3Key, name, size, mimeType } = await res.json();

      const record = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key, name, size, mimeType }),
      });
      if (!record.ok) { toast.error("Failed to record attachment"); return; }

      qc.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("File attached");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      setUploadingName("");
    }
  };

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton
        className="sm:max-w-2xl max-h-[88vh] overflow-y-auto p-0"
      >
        {isLoading || !task ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-4 pr-12">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-bold leading-snug">{task.title}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => { onEdit(task as unknown as Record<string, unknown>); }}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={`text-xs ${STATUS_COLORS[task.status]}`} variant="secondary">
                  {STATUS_LABELS[task.status]}
                </Badge>
                <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`} variant="secondary">
                  {task.priority}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  {task.project.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {task.assignee?.name ?? "Unassigned"}
                </span>
                {task.dueDate && (
                  <span className={cn("flex items-center gap-1.5", isOverdue(task.dueDate) && "text-destructive font-medium")}>
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(task.dueDate)}
                    {isOverdue(task.dueDate) && " (overdue)"}
                  </span>
                )}
              </div>
            </div>

            {task.description && (
              <>
                <Separator />
                <div className="px-6 py-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Attachments */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                  {task.attachments.length > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">({task.attachments.length})</span>
                  )}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Uploading…</>
                  ) : (
                    <><Paperclip className="mr-1.5 h-3.5 w-3.5" />Attach file</>
                  )}
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading {uploadingName}…
                </div>
              )}

              {task.attachments.length === 0 && !isUploading && (
                <p className="text-xs text-muted-foreground">No attachments yet.</p>
              )}

              <div className="space-y-2">
                {task.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2">
                    {fileIcon(att.mimeType)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`/api/tasks/${task.id}/attachments/${att.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteAttachment.mutate(att.id)}
                        disabled={deleteAttachment.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Comments */}
            <div className="px-6 py-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
                {task.comments.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">({task.comments.length})</span>
                )}
              </h3>

              {task.comments.length === 0 && (
                <p className="text-xs text-muted-foreground">No comments yet. Be the first to comment.</p>
              )}

              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Avatar size="sm" className="shrink-0 mt-0.5">
                      <AvatarFallback className="text-[10px] gradient-brand text-white">
                        {getInitials(comment.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        {(comment.author.id === session?.user?.id || session?.user?.role === "ADMIN") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteComment.mutate(comment.id)}
                            disabled={deleteComment.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <div className="space-y-2 pt-2">
                <Textarea
                  placeholder="Write a comment…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  className="min-h-20 resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && commentBody.trim()) {
                      addComment.mutate(commentBody.trim());
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">⌘ + Enter to post</span>
                  <Button
                    size="sm"
                    onClick={() => addComment.mutate(commentBody.trim())}
                    disabled={!commentBody.trim() || addComment.isPending}
                  >
                    {addComment.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
