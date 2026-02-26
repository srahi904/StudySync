// src/lib/email.ts
import nodemailer from 'nodemailer'

// ─── Transporter ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FROM = `StudySync AI <${process.env.SMTP_FROM}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ─── Base email wrapper ────────────────────────────────────
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background:#06080f; color:#e8ecf4; }
    .wrapper { max-width:600px; margin:40px auto; background:#0d1117; border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; }
    .header { padding:32px 40px; background:linear-gradient(135deg,#1a1f2e,#0d1117); border-bottom:1px solid rgba(255,255,255,0.07); }
    .logo { font-size:20px; font-weight:800; background:linear-gradient(135deg,#5b8eff,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .body { padding:40px; }
    h2 { font-size:22px; font-weight:700; margin-bottom:12px; }
    p { color:#9aa5bb; font-size:15px; line-height:1.7; margin-bottom:16px; }
    .btn { display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#5b8eff,#a855f7); color:#fff !important; font-weight:700; font-size:15px; text-decoration:none; border-radius:10px; margin:20px 0; }
    .divider { border:none; border-top:1px solid rgba(255,255,255,0.07); margin:24px 0; }
    .small { font-size:13px; color:#6b7a96 !important; }
    .footer { padding:24px 40px; border-top:1px solid rgba(255,255,255,0.07); text-align:center; }
    .footer p { font-size:12px; color:#6b7a96; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">⚡ StudySync AI</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StudySync AI · All rights reserved</p>
      <p style="margin-top:4px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// ─── Email: Verify Email (OTP) ─────────────────────────────
export async function sendVerificationEmail(name: string, email: string, otp: string) {
  const otpDigits = otp
    .split('')
    .map(
      (d) =>
        `<td style="width:48px;height:56px;text-align:center;font-size:28px;font-weight:800;color:#fff;background:#1a1f2e;border:2px solid rgba(91,142,255,0.3);border-radius:12px;font-family:'Segoe UI',system-ui,monospace;">${d}</td>`
    )
    .join('<td style="width:8px"></td>')

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your StudySync AI verification code',
    html: baseTemplate(`
      <h2>Hi ${name},</h2>
      <p>Thanks for signing up! Use the verification code below to confirm your email address.</p>
      <table cellpadding="0" cellspacing="0" style="margin:24px auto;">
        <tr>${otpDigits}</tr>
      </table>
      <p style="text-align:center;font-size:13px;color:#6b7a96;">This code expires in <strong>10 minutes</strong>.</p>
      <hr class="divider">
      <p class="small">If you didn't create a StudySync AI account, you can safely ignore this email.</p>
    `),
  })
}

// ─── Email: Password Reset ─────────────────────────────────
export async function sendPasswordResetEmail(name: string, email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset your StudySync AI password',
    html: baseTemplate(`
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <hr class="divider">
      <p class="small">This link expires in <strong>1 hour</strong>. If you didn't request a reset, no action is needed.</p>
      <p class="small" style="word-break:break-all">${resetUrl}</p>
    `),
  })
}

// ─── Email: Welcome ───────────────────────────────────────
export async function sendWelcomeEmail(name: string, email: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Welcome to StudySync AI, ${name}! 🎉`,
    html: baseTemplate(`
      <h2>Welcome aboard, ${name}!</h2>
      <p>Your email is verified and your account is ready. Here's what you can do on StudySync AI:</p>
      <ul style="color:#9aa5bb; font-size:15px; line-height:2; padding-left:20px; margin-bottom:16px">
        <li>🧠 Chat with your AI study assistant</li>
        <li>📚 Upload and organize study materials</li>
        <li>👥 Join or create study groups</li>
        <li>🏆 Take AI-generated quizzes</li>
        <li>📈 Track your progress with analytics</li>
      </ul>
      <a href="${APP_URL}/dashboard" class="btn">Get Started →</a>
    `),
  })
}
