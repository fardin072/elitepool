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
      name: "রহিম আহমেদ",
      email: "admin@fwstasks.dev",
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@fwstasks.dev" },
    update: {},
    create: {
      name: "ফাতিমা খান",
      email: "pm@fwstasks.dev",
      passwordHash: password,
      role: Role.PROJECT_MANAGER,
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "dev1@fwstasks.dev" },
    update: {},
    create: {
      name: "করিম সরকার",
      email: "dev1@fwstasks.dev",
      passwordHash: password,
      role: Role.TEAM_MEMBER,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "dev2@fwstasks.dev" },
    update: {},
    create: {
      name: "নাজমা বেগম",
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
      name: "ঢাকা ওয়েব প্ল্যাটফর্ম",
      description: "নতুন সহযোগিতা বৈশিষ্ট্য এবং উন্নত কর্মক্ষমতা সহ মূল প্ল্যাটফর্ম পুনর্নির্মাণ।",
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
      name: "মোবাইল অ্যাপ লঞ্চ",
      description: "ওয়েব প্ল্যাটফর্মের সমান বৈশিষ্ট্য সহ iOS এবং Android অ্যাপ রিলিজ।",
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
      name: "প্রথম ত্রৈমাসিক API পুনর্গঠন",
      description: "সমস্ত উত্তরাধিকার API এন্ডপয়েন্টগুলি RESTful মান এবং সঠিক যাচাইকরণের সাথে পুনর্গঠন করা হয়েছে।",
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
      title: "নতুন ড্যাশবোর্ড লেআউট ডিজাইন করুন",
      description: "সংস্কারিত ড্যাশবোর্ডের জন্য ওয়্যারফ্রেম এবং উচ্চ-বিশ্বস্ততা মকআপ তৈরি করুন।",
      projectId: project1.id,
      assigneeId: member2.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "task-2",
      title: "প্রমাণীকরণ সিস্টেম প্রয়োগ করুন",
      description: "ভূমিকা-ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ এবং ডেমো লগইন সহায়তা সহ NextAuth.js।",
      projectId: project1.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.COMPLETED,
    },
    {
      id: "task-3",
      title: "CI/CD পাইপলাইন সেট আপ করুন",
      description: "স্বয়ংক্রিয় পরীক্ষা এবং স্থাপনার জন্য GitHub Actions ওয়ার্কফ্লো।",
      projectId: project1.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
    },
    {
      id: "task-4",
      title: "API ডকুমেন্টেশন লিখুন",
      description: "অনুরোধ/প্রতিক্রিয়া উদাহরণ সহ সমস্ত REST এন্ডপয়েন্ট নথিভুক্ত করুন।",
      projectId: project1.id,
      assigneeId: null,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      priority: Priority.LOW,
      status: TaskStatus.TODO,
    },
    {
      id: "task-5",
      title: "পারফরম্যান্স অডিট এবং অপ্টিমাইজেশান",
      description: "Lighthouse অডিট চালান, Core Web Vitals সমস্যা ঠিক করুন।",
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
      title: "React Native প্রকল্প সেট আপ করুন",
      description: "নেভিগেশন এবং স্টেট ম্যানেজমেন্ট সহ Expo প্রকল্প শুরু করুন।",
      projectId: project2.id,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "task-7",
      title: "অনবোর্ডিং স্ক্রিন ডিজাইন করুন",
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
        action: "প্রকল্প তৈরি করেছে",
        entityType: "project",
        entityId: project1.id,
        entityName: project1.name,
        projectId: project1.id,
      },
      {
        id: "activity-2",
        userId: member1.id,
        action: "কাজ সম্পন্ন করেছে",
        entityType: "task",
        entityId: "task-2",
        entityName: "প্রমাণীকরণ সিস্টেম প্রয়োগ করুন",
        projectId: project1.id,
      },
      {
        id: "activity-3",
        userId: member2.id,
        action: "কাজ শুরু করেছে",
        entityType: "task",
        entityId: "task-1",
        entityName: "নতুন ড্যাশবোর্ড লেআউট ডিজাইন করুন",
        projectId: project1.id,
      },
      {
        id: "activity-4",
        userId: admin.id,
        action: "প্রকল্প তৈরি করেছে",
        entityType: "project",
        entityId: project2.id,
        entityName: project2.name,
        projectId: project2.id,
      },
      {
        id: "activity-5",
        userId: member1.id,
        action: "কাজ শুরু করেছে",
        entityType: "task",
        entityId: "task-6",
        entityName: "React Native প্রকল্প সেট আপ করুন",
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
