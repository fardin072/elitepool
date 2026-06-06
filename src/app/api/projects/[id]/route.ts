import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: { assignee: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: project });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id, role: { in: ["ADMIN", "PROJECT_MANAGER"] } } } }] },
  });
  if (!project) return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...parsed.data,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "updated project",
      entityType: "project",
      entityId: id,
      entityName: updated.name,
      projectId: id,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id, role: "ADMIN" } } }] },
  });
  if (!project) return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ data: null }, { status: 200 });
}
