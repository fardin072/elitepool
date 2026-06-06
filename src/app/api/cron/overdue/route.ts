import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: "COMPLETED" },
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { name: true } },
    },
  });

  // Log overdue task count
  console.log(`[cron] Found ${overdueTasks.length} overdue tasks`);

  return NextResponse.json({ data: { overdueTasks: overdueTasks.length } });
}
