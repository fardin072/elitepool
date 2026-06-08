import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip", "application/x-zip-compressed",
  "text/plain", "text/csv",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const taskId = formData.get("taskId") as string | null;

  if (!file || !taskId) {
    return NextResponse.json({ error: "file and taskId are required" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File size exceeds 10 MB limit" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const s3Key = `attachments/${taskId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const s3 = new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: file.type,
    ContentLength: file.size,
  }));

  return NextResponse.json({
    s3Key,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  });
}
