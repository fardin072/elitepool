import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") as string | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where = {
    AND: [
      {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      search ? { name: { contains: search, mode: "insensitive" as const } } : {},
      status ? { status: status as "ACTIVE" | "COMPLETED" | "ON_HOLD" } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { tasks: true, members: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { name, description, deadline, status } = parsed.data;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      deadline: deadline ? new Date(deadline) : null,
      status,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: session.user.role },
      },
    },
    include: { owner: { select: { id: true, name: true } } },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "created project",
      entityType: "project",
      entityId: project.id,
      entityName: project.name,
      projectId: project.id,
    },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
