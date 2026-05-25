import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

// ─── Email Configuration ─────────────────────────────────────────────────────

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@modernblog.com",
    fromName: process.env.EMAIL_FROM_NAME || "ModernBlog",
  };
}

// ─── Email Sending ───────────────────────────────────────────────────────────

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const config = getEmailConfig();

  // In development, log emails instead of sending
  if (process.env.NODE_ENV === "development") {
    console.log("📧 Email would be sent:", {
      to: params.to,
      subject: params.subject,
      from: `${config.fromName} <${config.from}>`,
    });
    return true;
  }

  try {
    // Dynamic import of nodemailer
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to: params.to,
      subject: params.subject,
      text: params.text || "",
      html: params.html,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export function wrapEmailTemplate(
  content: string,
  title: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const appName = "ModernBlog";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${appName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 12px; color: #71717a; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0;">
                      You're receiving this email because you have an account with ${appName}.
                    </p>
                    <p style="margin: 0;">
                      <a href="${appUrl}/settings/notifications" style="color: #6366f1; text-decoration: underline;">Manage notification preferences</a>
                      &nbsp;·&nbsp;
                      <a href="${appUrl}/unsubscribe?email={{email}}" style="color: #71717a; text-decoration: underline;">Unsubscribe</a>
                    </p>
                    <p style="margin: 8px 0 0 0; color: #a1a1aa;">
                      © ${new Date().getFullYear()} ${appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Specific Email Templates ────────────────────────────────────────────────

export function newCommentEmail(params: {
  recipientName: string;
  commenterName: string;
  postTitle: string;
  commentContent: string;
  postUrl: string;
}): string {
  const { recipientName, commenterName, postTitle, commentContent, postUrl } =
    params;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #18181b;">New Comment on Your Post</h2>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      Hi <strong>${recipientName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      <strong>${commenterName}</strong> left a comment on your post "<strong>${postTitle}</strong>":
    </p>
    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 3px solid #6366f1;">
      <p style="margin: 0; color: #3f3f46; font-size: 14px; line-height: 1.6; font-style: italic;">
        "${commentContent}"
      </p>
    </div>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: #6366f1; border-radius: 8px; padding: 12px 24px;">
          <a href="${postUrl}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">View Comment</a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailTemplate(content, "New Comment");
}

export function commentReplyEmail(params: {
  recipientName: string;
  replierName: string;
  postTitle: string;
  replyContent: string;
  postUrl: string;
}): string {
  const { recipientName, replierName, postTitle, replyContent, postUrl } = params;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #18181b;">Reply to Your Comment</h2>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      Hi <strong>${recipientName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      <strong>${replierName}</strong> replied to your comment on "<strong>${postTitle}</strong>":
    </p>
    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 3px solid #6366f1;">
      <p style="margin: 0; color: #3f3f46; font-size: 14px; line-height: 1.6; font-style: italic;">
        "${replyContent}"
      </p>
    </div>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: #6366f1; border-radius: 8px; padding: 12px 24px;">
          <a href="${postUrl}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">View Reply</a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailTemplate(content, "Comment Reply");
}

export function newLikeEmail(params: {
  recipientName: string;
  likerName: string;
  postTitle: string;
  postUrl: string;
}): string {
  const { recipientName, likerName, postTitle, postUrl } = params;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #18181b;">Your Post Got a Like! ❤️</h2>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      Hi <strong>${recipientName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      <strong>${likerName}</strong> liked your post "<strong>${postTitle}</strong>".
    </p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: #6366f1; border-radius: 8px; padding: 12px 24px;">
          <a href="${postUrl}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">View Post</a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailTemplate(content, "New Like");
}

export function newFollowerEmail(params: {
  recipientName: string;
  followerName: string;
  followerUrl: string;
}): string {
  const { recipientName, followerName, followerUrl } = params;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #18181b;">New Follower! 🎉</h2>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      Hi <strong>${recipientName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      <strong>${followerName}</strong> started following you on ModernBlog!
    </p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: #6366f1; border-radius: 8px; padding: 12px 24px;">
          <a href="${followerUrl}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">View Profile</a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailTemplate(content, "New Follower");
}

export function weeklyDigestEmail(params: {
  recipientName: string;
  posts: Array<{
    title: string;
    excerpt: string | null;
    slug: string;
    authorName: string | null;
    readTime: number | null;
    publishedAt: Date;
  }>;
  topCommenter?: string;
  totalLikes?: number;
  totalComments?: number;
}): string {
  const { recipientName, posts, topCommenter, totalLikes, totalComments } =
    params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const postsHtml = posts
    .map(
      (post) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #18181b;">
                <a href="${appUrl}/posts/${post.slug}" style="color: #18181b; text-decoration: none;">${post.title}</a>
              </h3>
              <p style="margin: 0 0 4px 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                ${post.excerpt || ""}
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                By ${post.authorName || "Unknown"} · ${post.readTime || 5} min read
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join("");

  const content = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #18181b;">Your Weekly Digest 📬</h2>
    <p style="margin: 0 0 24px 0; color: #52525b; font-size: 14px; line-height: 1.6;">
      Hi <strong>${recipientName}</strong>, here's what you missed this week on ModernBlog.
    </p>

    ${
      totalLikes !== undefined || totalComments !== undefined
        ? `
    <div style="background: linear-gradient(135deg, #f4f4f5, #e4e4e7); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${totalLikes !== undefined ? `
          <td align="center" style="padding: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #6366f1;">${totalLikes}</div>
            <div style="font-size: 12px; color: #71717a;">Likes Received</div>
          </td>` : ""}
          ${totalComments !== undefined ? `
          <td align="center" style="padding: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #6366f1;">${totalComments}</div>
            <div style="font-size: 12px; color: #71717a;">New Comments</div>
          </td>` : ""}
          <td align="center" style="padding: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #6366f1;">${posts.length}</div>
            <div style="font-size: 12px; color: #71717a;">New Posts</div>
          </td>
        </tr>
      </table>
    </div>
    `
        : ""
    }

    ${
      topCommenter
        ? `
    <p style="margin: 0 0 16px 0; color: #52525b; font-size: 13px;">
      🏆 Top commenter this week: <strong>${topCommenter}</strong>
    </p>
    `
        : ""
    }

    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #18181b;">Latest Posts</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${postsHtml}
    </table>

    <table cellpadding="0" cellspacing="0" style="margin-top: 24px;">
      <tr>
        <td style="background-color: #6366f1; border-radius: 8px; padding: 12px 24px;">
          <a href="${appUrl}/posts" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">View All Posts</a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailTemplate(content, "Weekly Digest");
}

// ─── Send Notification Email ─────────────────────────────────────────────────

export async function sendNotificationEmail(params: {
  userId: string;
  type: string;
  data: Record<string, any>;
}): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true },
  });

  if (!user?.email) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  switch (params.type) {
    case "NEW_COMMENT":
      return sendEmail({
        to: user.email,
        subject: "New Comment on Your Post - ModernBlog",
        html: newCommentEmail({
          recipientName: user.name || "there",
          commenterName: params.data.commenterName || "Someone",
          postTitle: params.data.postTitle || "",
          commentContent: params.data.commentContent || "",
          postUrl: `${appUrl}/posts/${params.data.postSlug}`,
        }),
      });

    case "COMMENT_REPLY":
      return sendEmail({
        to: user.email,
        subject: "Reply to Your Comment - ModernBlog",
        html: commentReplyEmail({
          recipientName: user.name || "there",
          replierName: params.data.replierName || "Someone",
          postTitle: params.data.postTitle || "",
          replyContent: params.data.replyContent || "",
          postUrl: `${appUrl}/posts/${params.data.postSlug}`,
        }),
      });

    case "POST_LIKE":
      return sendEmail({
        to: user.email,
        subject: "Your Post Got a Like! - ModernBlog",
        html: newLikeEmail({
          recipientName: user.name || "there",
          likerName: params.data.likerName || "Someone",
          postTitle: params.data.postTitle || "",
          postUrl: `${appUrl}/posts/${params.data.postSlug}`,
        }),
      });

    case "NEW_FOLLOWER":
      return sendEmail({
        to: user.email,
        subject: "New Follower - ModernBlog",
        html: newFollowerEmail({
          recipientName: user.name || "there",
          followerName: params.data.followerName || "Someone",
          followerUrl: `${appUrl}/profile`,
        }),
      });

    default:
      return false;
  }
}
