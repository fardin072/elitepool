import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));

  const data = await prisma.activityLog.findMany({
    where: {
      ...(projectId ? { projectId } : {
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json({ data });
}
