import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, attachmentId } = await params;

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, taskId: id },
    include: {
      task: {
        include: {
          project: { select: { ownerId: true } },
        },
      },
    },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isProjectOwner = attachment.task.project.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const isPM = session.user.role === "PROJECT_MANAGER";
  if (!isProjectOwner && !isAdmin && !isPM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.S3_BUCKET_NAME) {
    const s3 = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: attachment.s3Key })).catch(() => null);
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ success: true });
}
