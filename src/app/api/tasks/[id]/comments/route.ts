import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCommentSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

const taskScope = (userId: string) => ({
  project: {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  },
});

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findFirst({ where: { id, ...taskScope(session.user.id) } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { taskId: id },
    include: { author: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: comments });
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findFirst({ where: { id, ...taskScope(session.user.id) } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const comment = await prisma.comment.create({
    data: { taskId: id, authorId: session.user.id, body: parsed.data.body },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "commented on",
      entityType: "task",
      entityId: id,
      entityName: task.title,
      projectId: task.projectId,
    },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}
