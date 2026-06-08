import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

  const body = await req.json().catch(() => null);
  const { filename, contentType, size, taskId } = body ?? {};

  if (!filename || !contentType || !size || !taskId) {
    return NextResponse.json({ error: "filename, contentType, size, taskId are required" }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "File size exceeds 10 MB limit" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const s3Key = `attachments/${taskId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const s3 = new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
    // Disable automatic checksums — prevents x-amz-checksum-crc32 headers
    // being injected into presigned URLs, which break browser CORS preflight
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return NextResponse.json({ uploadUrl, s3Key });
}
