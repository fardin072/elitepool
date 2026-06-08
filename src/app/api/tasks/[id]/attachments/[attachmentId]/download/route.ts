import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, attachmentId } = await params;

  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      taskId: id,
      task: {
        project: {
          OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
        },
      },
    },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!process.env.S3_BUCKET_NAME) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: attachment.s3Key,
      ResponseContentDisposition: `attachment; filename="${attachment.name}"`,
    }),
    { expiresIn: 60 }
  );

  return NextResponse.redirect(url);
}
