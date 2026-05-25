type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // In development, log emails to console
  if (process.env.NODE_ENV === "development") {
    console.log("📧 Email Service (Dev Mode)");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body preview: ${html.slice(0, 200)}...`);
    return { success: true };
  }

  // In production, use a real email service (Resend, SendGrid, etc.)
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@modernblog.com",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    return { success: true };
  } catch (error) {
    console.error("Email send failed:", error);
    // Don't throw - allow the app to continue even if email fails
    return { success: false };
  }
}

export function getVerificationEmailHtml(token: string): string {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 24px; }
    h1 { font-size: 24px; color: #111; margin: 0 0 12px; }
    p { color: #6b7280; line-height: 1.6; margin: 0 0 24px; }
    .button { display: inline-block; background: #111; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">ModernBlog</div>
      <h1>Verify your email address</h1>
      <p>Thanks for signing up! Please verify your email address by clicking the button below.</p>
      <a href="${verificationUrl}" class="button">Verify Email</a>
      <p style="margin-top: 24px; font-size: 14px;">Or copy this link: ${verificationUrl}</p>
    </div>
  </div>
</body>
</html>`;
}

export function getPasswordResetEmailHtml(token: string): string {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 24px; }
    h1 { font-size: 24px; color: #111; margin: 0 0 12px; }
    p { color: #6b7280; line-height: 1.6; margin: 0 0 24px; }
    .button { display: inline-block; background: #111; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .warning { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; color: #991b1b; font-size: 14px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">ModernBlog</div>
      <h1>Reset your password</h1>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p style="margin-top: 24px; font-size: 14px;">Or copy this link: ${resetUrl}</p>
      <div class="warning">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</div>
    </div>
  </div>
</body>
</html>`;
}