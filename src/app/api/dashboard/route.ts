import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectFilter = {
    OR: [
      { ownerId: session.user.id },
      { members: { some: { userId: session.user.id } } },
    ],
  };

  const taskFilter = { project: projectFilter };

  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    recentActivity,
    upcomingTasks,
    tasksByPriority,
    tasksByStatus,
  ] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.project.count({ where: { ...projectFilter, status: "ACTIVE" } }),
    prisma.task.count({ where: taskFilter }),
    prisma.task.count({ where: { ...taskFilter, status: "COMPLETED" } }),
    prisma.task.count({
      where: { ...taskFilter, dueDate: { lt: now }, status: { not: "COMPLETED" } },
    }),
    prisma.activityLog.findMany({
      where: {
        project: projectFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.task.findMany({
      where: {
        ...taskFilter,
        status: { not: "COMPLETED" },
        dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: taskFilter,
      _count: { priority: true },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: taskFilter,
      _count: { status: true },
    }),
  ]);

  return NextResponse.json({
    data: {
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
      },
      recentActivity,
      upcomingTasks,
      tasksByPriority,
      tasksByStatus,
    },
  });
}
