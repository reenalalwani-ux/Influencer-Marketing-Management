import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node.js to resolve IPv4 addresses first on cloud environments like Render
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if unsupported in Node version
}

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || 'reena.lalwani@ad2ship.com';
  const pass = process.env.SMTP_PASS || 'gzolidmmbhnmdnrq';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendOTPEmail = async (toEmail: string, otpCode: string, userName: string = 'Team Member'): Promise<boolean> => {
  const fromAddress = (process.env.FROM_EMAIL || process.env.SMTP_USER || 'reena.lalwani@ad2ship.com').trim();
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

  // 1. Primary: SMTP via Nodemailer
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: `"${appName}" <${fromAddress}>`,
        to: toEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`[SMTP Success] Security OTP email delivered to ${toEmail} (MessageId: ${info.messageId})`);
      return true;
    } catch (smtpErr: any) {
      console.error(`[SMTP Error sending OTP to ${toEmail}]:`, smtpErr?.message || smtpErr);
    }
  }

  // 2. Secondary Webhook Fallback (if script.google.com webhook configured)
  const webhookUrl = (process.env.GMAIL_WEBHOOK_URL || '').trim();
  if (webhookUrl && webhookUrl.includes('script.google.com')) {
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        body: JSON.stringify({
          to: toEmail,
          subject: subject,
          text: textContent,
          html: htmlContent
        })
      });

      if (webhookRes.ok || webhookRes.status === 200 || webhookRes.status === 302) {
        console.log(`[Webhook Success] OTP Email delivered to ${toEmail}`);
        return true;
      }
    } catch (webhookErr: any) {
      console.error(`[Webhook Error]`, webhookErr?.message || webhookErr);
    }
  }

  // Fallback Console Log
  console.log(`\n=================================================`);
  console.log(`[SECURITY OTP FALLBACK] EMAIL: ${toEmail} | CODE: ${otpCode}`);
  console.log(`=================================================\n`);
  return true;
};

export const sendManagerApprovalEmail = async (
  managerEmails: string[],
  newUser: { name: string; email: string; phone?: string; department?: string }
): Promise<boolean> => {
  const appName = (process.env.APP_NAME || 'Influencer Marketing Operation').trim();
  const fromAddress = (process.env.FROM_EMAIL || process.env.SMTP_USER || 'reena.lalwani@ad2ship.com').trim();
  const subject = `[ACTION REQUIRED] New User Registration Request - Manager Approval Required: ${newUser.name}`;
  
  const textContent = `Hello Manager,\n\nA new user account has verified their email address and is requesting access to ${appName}.\n\nUser Details:\n- Name: ${newUser.name}\n- Work Email: ${newUser.email}\n- Phone: ${newUser.phone || 'N/A'}\n- Department: ${newUser.department || 'Influencer Marketing'}\n\nPlease log in to the Influencer Marketing Operation portal and go to Members Directory to approve or assign their system role.\n\nRegards,\n${appName} Automation System`;

  const portalUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
  const membersDirectoryUrl = `${portalUrl}/#/employees`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .badge { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 12px; letter-spacing: 1px; text-transform: uppercase; }
        .title { color: #0f172a; font-size: 20px; font-weight: 800; margin-top: 16px; margin-bottom: 8px; }
        .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
        .info-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; font-size: 13px; color: #334155; }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .info-label { font-weight: 700; color: #64748b; }
        .info-val { font-weight: 800; color: #0f172a; }
        .approve-btn { display: block; width: fit-content; margin: 24px auto 0; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 36px; border-radius: 14px; text-align: center; letter-spacing: 0.3px; }
        .steps { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 16px 20px; margin: 20px 0; font-size: 13px; color: #166534; }
        .steps ol { margin: 8px 0 0 0; padding-left: 20px; line-height: 2; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">MANAGER APPROVAL REQUIRED</div>
        <div class="title">New Account Registration Request</div>
        <div class="subtitle">A new team member has verified their email address and is requesting access to <strong>${appName}</strong>.</div>

        <div class="info-card">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #9333ea; margin-bottom: 10px;">User Registration Details</div>
          <div class="info-row"><span class="info-label">Full Name:</span><span class="info-val">${newUser.name}</span></div>
          <div class="info-row"><span class="info-label">Work Email:</span><span class="info-val">${newUser.email}</span></div>
          <div class="info-row"><span class="info-label">Phone Number:</span><span class="info-val">${newUser.phone || 'N/A'}</span></div>
          <div class="info-row" style="border-bottom: none;"><span class="info-label">Department:</span><span class="info-val">${newUser.department || 'Influencer Marketing'}</span></div>
        </div>

        <div class="steps">
          <strong>How to approve this request:</strong>
          <ol>
            <li>Click the button below to open the portal</li>
            <li>Log in with your manager account</li>
            <li>In <strong>Members Directory</strong>, find the pending request at the top</li>
            <li>Click <strong>Approve</strong> and assign the employee role</li>
          </ol>
        </div>

        <a href="${membersDirectoryUrl}" class="approve-btn">Open Portal &amp; Approve Request &rarr;</a>

        <div class="footer">
          &copy; ${new Date().getFullYear()} ${appName}. Automated Notification.<br>
          <span style="font-size:11px;">Portal URL: <a href="${membersDirectoryUrl}">${membersDirectoryUrl}</a></span>
        </div>
      </div>
    </body>
    </html>
  `;

  for (const managerEmail of managerEmails) {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"${appName}" <${fromAddress}>`,
          to: managerEmail,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[SMTP Success] Delivered Manager Approval Email to: ${managerEmail}`);
        continue;
      } catch (smtpErr: any) {
        console.error(`[SMTP Error sending manager approval email to ${managerEmail}]:`, smtpErr?.message || smtpErr);
      }
    }

    console.log(`[MANAGER EMAIL NOTIFICATION] Manager: ${managerEmail} | New User: ${newUser.name} (${newUser.email})`);
  }

  return true;
};
