import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTaskSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const assigneeId = searchParams.get("assigneeId") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const overdue = searchParams.get("overdue") === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where = {
    AND: [
      {
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
      projectId ? { projectId } : {},
      status ? { status: status as "TODO" | "IN_PROGRESS" | "COMPLETED" } : {},
      priority ? { priority: priority as "HIGH" | "MEDIUM" | "LOW" } : {},
      assigneeId ? { assigneeId } : {},
      search ? { title: { contains: search, mode: "insensitive" as const } } : {},
      overdue ? { dueDate: { lt: new Date() }, status: { not: "COMPLETED" as const } } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const { title, description, assigneeId, dueDate, priority, status } = parsed.data;

  const existing = await prisma.task.findFirst({ where: { projectId, title } });
  if (existing) {
    return NextResponse.json({ error: "A task with this title already exists in the project" }, { status: 409 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      status,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "created task",
      entityType: "task",
      entityId: task.id,
      entityName: task.title,
      projectId,
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
