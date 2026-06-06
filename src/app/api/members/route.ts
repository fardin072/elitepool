import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const search = searchParams.get("search") ?? "";

  if (projectId) {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    });
    return NextResponse.json({ data: members });
  }

  const users = await prisma.user.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" } }
      : undefined,
    select: { id: true, name: true, email: true, avatar: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id, role: { in: ["ADMIN", "PROJECT_MANAGER"] } } } },
      ],
    },
  });
  if (!project) return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { userId, role = "TEAM_MEMBER" } = body ?? {};
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, role },
    update: { role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  return NextResponse.json({ data: member }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");
  if (!projectId || !userId) return NextResponse.json({ error: "projectId and userId required" }, { status: 400 });

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  return NextResponse.json({ data: null });
}
