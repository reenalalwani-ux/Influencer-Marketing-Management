import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node.js to resolve IPv4 addresses first on cloud environments like Render
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if unsupported in Node version
}

export const sendOTPEmail = async (toEmail: string, otpCode: string, userName: string = 'Team Member'): Promise<boolean> => {
  const user = (process.env.SMTP_USER || 'reena.lalwani@ad2ship.com').trim();
  const pass = (process.env.SMTP_PASS || 'gzolidmmbhnmdnrq').trim();
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const fromAddress = (process.env.FROM_EMAIL || 'reena.lalwani@ad2ship.com').trim();
  const appName = (process.env.APP_NAME || 'Influencer Marketing Operation').trim();

  const subject = `Your ${appName} security code is ${otpCode}`;
  const textContent = `Hello ${userName},\n\nYour ${appName} security verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this verification code, please ignore this email.\n\nRegards,\n${appName} Security Team`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .badge { display: inline-block; background: linear-gradient(135deg, #9333ea, #4f46e5); color: #ffffff; font-weight: 800; font-size: 13px; padding: 6px 16px; border-radius: 12px; letter-spacing: 1px; }
        .title { color: #0f172a; font-size: 22px; font-weight: 800; margin-top: 20px; margin-bottom: 8px; }
        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        .otp-card { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 14px; text-align: center; padding: 20px; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #7c3aed; }
        .footer { font-size: 12px; color: #94a3b8; border-t: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">${appName.toUpperCase()}</div>
        <div class="title">Security Verification Code</div>
        <div class="subtitle">Hello <strong>${userName}</strong>, please use the following 6-digit code to complete your login authentication for <strong>${appName}</strong>.</div>

        <div class="otp-card">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px;">Security Verification Code</div>
          <div class="otp-code">${otpCode}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for <strong>10 minutes</strong></div>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          If you did not request this verification code, please ignore this email or contact system administration immediately.
        </p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} ${appName}. Security & Operations Portal.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: `"${appName}" <${fromAddress}>`,
      to: toEmail,
      replyTo: fromAddress,
      subject: subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated'
      }
    });

    console.log(`[Google SMTP Success] OTP Email sent to ${toEmail}. MessageID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Google SMTP Error] Failed to send OTP email to ${toEmail}:`, error?.message || error);
    console.log(`\n=================================================`);
    console.log(`[SECURITY OTP FALLBACK] EMAIL: ${toEmail} | CODE: ${otpCode}`);
    console.log(`=================================================\n`);
    return true;
  }
};
