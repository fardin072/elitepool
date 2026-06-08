import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const taskScope = (userId: string) => ({
  project: {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  },
});

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findFirst({ where: { id, ...taskScope(session.user.id) } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { s3Key, name, size, mimeType } = body ?? {};
  if (!s3Key || !name || !size || !mimeType) {
    return NextResponse.json({ error: "s3Key, name, size, mimeType are required" }, { status: 400 });
  }

  const attachment = await prisma.attachment.create({
    data: { taskId: id, s3Key, name, size, mimeType },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "attached a file to",
      entityType: "task",
      entityId: id,
      entityName: task.title,
      projectId: task.projectId,
    },
  });

  return NextResponse.json({ data: attachment }, { status: 201 });
}
