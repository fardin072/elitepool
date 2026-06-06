import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: {
      id,
      project: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true, avatar: true } } },
      },
      attachments: true,
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: task });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: {
      id,
      project: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  // Prevent assigning to a completed task
  if (parsed.data.assigneeId && task.status === "COMPLETED") {
    return NextResponse.json({ error: "Cannot reassign a completed task" }, { status: 422 });
  }

  // Check for duplicate title in same project (if title is changing)
  if (parsed.data.title && parsed.data.title !== task.title) {
    const dup = await prisma.task.findFirst({
      where: { projectId: task.projectId, title: parsed.data.title, id: { not: id } },
    });
    if (dup) {
      return NextResponse.json({ error: "A task with this title already exists in the project" }, { status: 409 });
    }
  }

  const oldStatus = task.status;
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...parsed.data,
      assigneeId: parsed.data.assigneeId === "" ? null : parsed.data.assigneeId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  const statusChanged = parsed.data.status && parsed.data.status !== oldStatus;
  const action = statusChanged
    ? parsed.data.status === "COMPLETED"
      ? "completed task"
      : `updated task status to ${parsed.data.status?.toLowerCase().replace("_", " ")}`
    : "updated task";

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action,
      entityType: "task",
      entityId: id,
      entityName: updated.title,
      projectId: updated.projectId,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: {
      id,
      project: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ["ADMIN", "PROJECT_MANAGER"] } } } },
        ],
      },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ data: null });
}
