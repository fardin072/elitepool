import { PrismaClient, Role, ProjectStatus, Priority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Demo users ──────────────────────────────────────────────────────────
  const password = await bcrypt.hash("demo1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@elitepool.dev" },
    update: {},
    create: {
      name: "Alex Admin",
      email: "admin@elitepool.dev",
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@elitepool.dev" },
    update: {},
    create: {
      name: "Patricia Manager",
      email: "pm@elitepool.dev",
      passwordHash: password,
      role: Role.PROJECT_MANAGER,
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "dev1@elitepool.dev" },
    update: {},
    create: {
      name: "Sam Developer",
      email: "dev1@elitepool.dev",
      passwordHash: password,
      role: Role.TEAM_MEMBER,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "dev2@elitepool.dev" },
    update: {},
    create: {
      name: "Jordan Designer",
      email: "dev2@elitepool.dev",
      passwordHash: password,
      role: Role.TEAM_MEMBER,
    },
  });

  console.log("✅ Demo users created");

  // ── Sample project 1 ────────────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "ElitePool Platform v2",
      description: "Complete redesign of the core platform with new collaboration features and improved performance.",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: ProjectStatus.ACTIVE,
      ownerId: pm.id,
    },
  });

  await prisma.projectMember.createMany({
    skipDuplicates: true,
    data: [
      { projectId: project1.id, userId: admin.id, role: Role.ADMIN },
      { projectId: project1.id, userId: pm.id, role: Role.PROJECT_MANAGER },
      { projectId: project1.id, userId: member1.id, role: Role.TEAM_MEMBER },
      { projectId: project1.id, userId: member2.id, role: Role.TEAM_MEMBER },
    ],
  });

  // ── Sample project 2 ────────────────────────────────────────────────────
  const project2 = await prisma.project.upsert({
    where: { id: "seed-project-2" },
    update: {},
    create: {
      id: "seed-project-2",
      name: "Mobile App Launch",
      description: "iOS and Android app release with feature parity to the web platform.",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      status: ProjectStatus.ACTIVE,
      ownerId: admin.id,
    },
  });

  await prisma.projectMember.createMany({
    skipDuplicates: true,
    data: [
      { projectId: project2.id, userId: admin.id, role: Role.ADMIN },
      { projectId: project2.id, userId: pm.id, role: Role.PROJECT_MANAGER },
      { projectId: project2.id, userId: member1.id, role: Role.TEAM_MEMBER },
    ],
  });

  // ── Sample project 3 (completed) ─────────────────────────────────────────
  const project3 = await prisma.project.upsert({
    where: { id: "seed-project-3" },
    update: {},
    create: {
      id: "seed-project-3",
      name: "Q1 API Refactor",
      description: "Refactored all legacy API endpoints to RESTful standards with proper validation.",
      status: ProjectStatus.COMPLETED,
      ownerId: admin.id,
    },
  });

  await prisma.projectMember.createMany({
    skipDuplicates: true,
    data: [
      { projectId: project3.id, userId: admin.id, role: Role.ADMIN },
      { projectId: project3.id, userId: member1.id, role: Role.TEAM_MEMBER },
    ],
  });

  console.log("✅ Sample projects created");

  // ── Tasks for project 1 ──────────────────────────────────────────────────
  const tasks = [
    {
      id: "task-1",
      title: "Design new dashboard layout",
      description: "Create wireframes and high-fidelity mockups for the revamped dashboard.",
      projectId: project1.id,
      assigneeId: member2.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "task-2",
      title: "Implement authentication system",
      description: "NextAuth.js with role-based access control and demo login support.",
      projectId: project1.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.COMPLETED,
    },
    {
      id: "task-3",
      title: "Set up CI/CD pipeline",
      description: "GitHub Actions workflow for automated testing and SST deployment.",
      projectId: project1.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
    },
    {
      id: "task-4",
      title: "Write API documentation",
      description: "Document all REST endpoints with request/response examples.",
      projectId: project1.id,
      assigneeId: null,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      priority: Priority.LOW,
      status: TaskStatus.TODO,
    },
    {
      id: "task-5",
      title: "Performance audit and optimization",
      description: "Run Lighthouse audits, fix Core Web Vitals issues.",
      projectId: project1.id,
      assigneeId: member2.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  // ── Tasks for project 2 ──────────────────────────────────────────────────
  const tasks2 = [
    {
      id: "task-6",
      title: "Set up React Native project",
      description: "Initialize Expo project with navigation and state management.",
      projectId: project2.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "task-7",
      title: "Design onboarding screens",
      projectId: project2.id,
      assigneeId: member2.id,
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
    },
  ];

  for (const task of tasks2) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  console.log("✅ Sample tasks created");

  // ── Activity logs ────────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "activity-1",
        userId: pm.id,
        action: "created project",
        entityType: "project",
        entityId: project1.id,
        entityName: project1.name,
        projectId: project1.id,
      },
      {
        id: "activity-2",
        userId: member1.id,
        action: "completed task",
        entityType: "task",
        entityId: "task-2",
        entityName: "Implement authentication system",
        projectId: project1.id,
      },
      {
        id: "activity-3",
        userId: member2.id,
        action: "started task",
        entityType: "task",
        entityId: "task-1",
        entityName: "Design new dashboard layout",
        projectId: project1.id,
      },
      {
        id: "activity-4",
        userId: admin.id,
        action: "created project",
        entityType: "project",
        entityId: project2.id,
        entityName: project2.name,
        projectId: project2.id,
      },
      {
        id: "activity-5",
        userId: member1.id,
        action: "started task",
        entityType: "task",
        entityId: "task-6",
        entityName: "Set up React Native project",
        projectId: project2.id,
      },
    ],
  });

  console.log("✅ Activity logs created");
  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Demo credentials (password: demo1234):");
  console.log("  Admin:          admin@elitepool.dev");
  console.log("  Project Manager: pm@elitepool.dev");
  console.log("  Team Member:    dev1@elitepool.dev");
  console.log("  Team Member:    dev2@elitepool.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
