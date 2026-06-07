import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FROM = process.env.AWS_SES_FROM_EMAIL ?? "noreply@fwstasks.app";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<void> {
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: html, Charset: "UTF-8" },
            ...(text && { Text: { Data: text, Charset: "UTF-8" } }),
          },
        },
      },
    })
  );
}

export async function sendTaskAssignedEmail(
  to: string,
  assigneeName: string,
  taskTitle: string,
  projectName: string,
  appUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `You've been assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">New Task Assignment</h2>
        <p>Hi ${assigneeName},</p>
        <p>You have been assigned a new task in <strong>${projectName}</strong>:</p>
        <div style="background: #f5f3ff; border-left: 4px solid #7C3AED; padding: 16px; border-radius: 8px;">
          <strong>${taskTitle}</strong>
        </div>
        <a href="${appUrl}" style="display:inline-block;margin-top:16px;background:#7C3AED;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">
          View Task
        </a>
      </div>
    `,
  });
}
