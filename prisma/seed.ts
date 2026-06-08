import { PrismaClient, Role, ProjectStatus, Priority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Demo users ──────────────────────────────────────────────────────────
  const password = await bcrypt.hash("demo1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@fwstasks.dev" },
    update: {},
    create: {
      name: "Rahim Ahmed",
      email: "admin@fwstasks.dev",
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@fwstasks.dev" },
    update: {},
    create: {
      name: "Fatima Khan",
      email: "pm@fwstasks.dev",
      passwordHash: password,
      role: Role.PROJECT_MANAGER,
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "dev1@fwstasks.dev" },
    update: {},
    create: {
      name: "Karim Sarkar",
      email: "dev1@fwstasks.dev",
      passwordHash: password,
      role: Role.TEAM_MEMBER,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "dev2@fwstasks.dev" },
    update: {},
    create: {
      name: "Nazma Begum",
      email: "dev2@fwstasks.dev",
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
      name: "Dhaka Web Platform",
      description: "Complete redesign of the core platform with new collaboration features and improved performance for Bangladesh market.",
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
      name: "Bangladesh Mobile App Launch",
      description: "iOS and Android app release with feature parity to the web platform for users across Bangladesh.",
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
      description: "Refactored all legacy API endpoints to RESTful standards with proper validation and Bangladesh-specific localizations.",
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
      title: "Design Dashboard for Bangladesh Users",
      description: "Create wireframes and high-fidelity mockups optimized for mobile users in Bangladesh with local payment integration.",
      projectId: project1.id,
      assigneeId: member2.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "task-2",
      title: "Implement Authentication System",
      description: "NextAuth.js with role-based access control and support for Bangladesh mobile verification.",
      projectId: project1.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.COMPLETED,
    },
    {
      id: "task-3",
      title: "Setup CI/CD Pipeline on AWS Bangladesh Region",
      description: "GitHub Actions workflow for automated testing and deployment to AWS Asia Pacific region.",
      projectId: project1.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
    },
    {
      id: "task-4",
      title: "Write API Documentation",
      description: "Document all REST endpoints with examples for Bangladesh-specific features like BDT payments and Bangla language support.",
      projectId: project1.id,
      assigneeId: null,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      priority: Priority.LOW,
      status: TaskStatus.TODO,
    },
    {
      id: "task-5",
      title: "Performance Audit and Optimization",
      description: "Run Lighthouse audits, optimize for slow networks common in Bangladesh, fix Core Web Vitals issues.",
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
      title: "Setup React Native Project for Bangladesh",
      description: "Initialize Expo project with navigation and state management for Android-first audience in Bangladesh.",
      projectId: project2.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "task-7",
      title: "Design Onboarding Screens with Bangla Support",
      description: "Create user-friendly onboarding screens with Bangla language and local payment methods.",
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
        entityName: "Implement Authentication System",
        projectId: project1.id,
      },
      {
        id: "activity-3",
        userId: member2.id,
        action: "started task",
        entityType: "task",
        entityId: "task-1",
        entityName: "Design Dashboard for Bangladesh Users",
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
        entityName: "Setup React Native Project for Bangladesh",
        projectId: project2.id,
      },
    ],
  });

  console.log("✅ Activity logs created");
  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Demo credentials (password: demo1234):");
  console.log("  Admin:          admin@fwstasks.dev");
  console.log("  Project Manager: pm@fwstasks.dev");
  console.log("  Team Member:    dev1@fwstasks.dev");
  console.log("  Team Member:    dev2@fwstasks.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
