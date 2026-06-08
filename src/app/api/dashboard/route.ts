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

  // Resolve project IDs once for member workload scoping
  const accessibleProjects = await prisma.project.findMany({
    where: projectFilter,
    select: { id: true },
  });
  const projectIds = accessibleProjects.map((p) => p.id);

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
    highPriorityTasks,
    memberWorkloadRaw,
  ] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.project.count({ where: { ...projectFilter, status: "ACTIVE" } }),
    prisma.task.count({ where: taskFilter }),
    prisma.task.count({ where: { ...taskFilter, status: "COMPLETED" } }),
    prisma.task.count({
      where: { ...taskFilter, dueDate: { lt: now }, status: { not: "COMPLETED" } },
    }),
    prisma.activityLog.findMany({
      where: { project: projectFilter },
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
    prisma.task.groupBy({ by: ["priority"], where: taskFilter, _count: { priority: true } }),
    prisma.task.groupBy({ by: ["status"], where: taskFilter, _count: { status: true } }),
    prisma.task.findMany({
      where: { ...taskFilter, priority: "HIGH", status: { not: "COMPLETED" } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { ownedProjects: { some: { id: { in: projectIds } } } },
          { memberships: { some: { projectId: { in: projectIds } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        assignedTasks: {
          where: { projectId: { in: projectIds } },
          select: { status: true, dueDate: true },
        },
      },
      take: 6,
    }),
  ]);

  const memberWorkload = memberWorkloadRaw.map((u) => {
    const total = u.assignedTasks.length;
    const completed = u.assignedTasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = u.assignedTasks.filter(
      (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < now
    ).length;
    return { id: u.id, name: u.name, avatar: u.avatar, role: u.role, total, completed, pending: total - completed, overdue };
  });

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
      highPriorityTasks,
      memberWorkload,
    },
  });
}
