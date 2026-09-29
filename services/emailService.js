import nodemailer from 'nodemailer';

/**
 * Enterprise Email Notification Service with University Branded Templates & SMTP Integration
 */

let transporter = null;

// Initialize Transporter
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // Development Fallback: if no SMTP configured, use JSON transport to avoid crash
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });
  return transporter;
};

export const sendEmailNotification = async ({ to, subject, templateType, data = {} }) => {
  try {
    let bodyHtml = '';

    switch (templateType) {
      case 'password_reset':
        bodyHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px solid #6366f1;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #818cf8; margin: 0; font-size: 24px;">UniAssist AI &bull; Academic Portal</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Secure Identity & Access Management</p>
            </div>
            <div style="background: rgba(30, 41, 59, 0.7); padding: 24px; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.2);">
              <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">Password Reset Request</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Hello <strong>${data.name || 'User'}</strong>,
              </p>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                We received a request to reset your password for your UniAssist account. Use the secure link below to reset your credentials. This link expires in <strong>30 minutes</strong>.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.resetUrl}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                  Reset My Password
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
                If you did not request this change, you can safely ignore this email. Your account remains completely secure.
              </p>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #64748b; text-align: center;">UniAssist AI &bull; University Academic Office &bull; Do not reply to this email</p>
          </div>
        `;
        break;

      case 'attendance_warning':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #ef4444;">
            <h2 style="color: #ef4444; margin-bottom: 8px;">⚠️ Critical Attendance Threshold Warning</h2>
            <p>Dear ${data.studentName || 'Student'},</p>
            <p>Your recorded attendance in <strong>${data.courseCode} (${data.courseName || ''})</strong> has dropped to <strong style="color: #ef4444;">${data.percentage}%</strong>, which is below the mandatory <strong>75%</strong> examination eligibility threshold.</p>
            <p>Please log in to your UniAssist portal immediately to use the Attendance Predictor and view your recovery trajectory.</p>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">UniAssist AI &bull; Office of Academic Affairs</p>
          </div>
        `;
        break;

      case 'assignment_reminder':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #3b82f6;">
            <h2 style="color: #3b82f6; margin-bottom: 8px;">📝 Assignment Deadline Reminder</h2>
            <p>Dear ${data.studentName || 'Student'},</p>
            <p>This is an automated reminder for your pending deliverable: <strong>${data.title}</strong> for course <strong>${data.courseCode}</strong>.</p>
            <p><strong>Due Date:</strong> ${data.dueDate ? new Date(data.dueDate).toLocaleString() : 'Upcoming'}</p>
            <p>Ensure you upload your solution prior to the deadline to avoid late submission penalties.</p>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">UniAssist AI &bull; Academic Deliverables Management</p>
          </div>
        `;
        break;

      case 'appointment_confirmation':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #10b981;">
            <h2 style="color: #10b981; margin-bottom: 8px;">📅 Faculty Consultation Confirmed</h2>
            <p>Dear ${data.studentName || 'Student'},</p>
            <p>Your office hour appointment with <strong>${data.facultyName || 'Faculty'}</strong> has been confirmed.</p>
            <p><strong>Date & Time:</strong> ${data.appointmentDate || 'TBD'} at ${data.timeSlot || 'TBD'}</p>
            <p><strong>Location/Channel:</strong> ${data.location || 'Faculty Cabin'}</p>
            <p><strong>Topic:</strong> ${data.purpose || 'Academic Consultation'}</p>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">UniAssist AI &bull; Faculty Advisory Services</p>
          </div>
        `;
        break;

      case 'notice_alert':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #8b5cf6;">
            <h2 style="color: #a78bfa; margin-bottom: 8px;">📢 University Circular: ${data.title || subject}</h2>
            <p>Dear Student / Faculty Member,</p>
            <p>${data.content || data.message || 'A new official circular has been published on the university portal.'}</p>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">UniAssist AI &bull; Office of the Registrar</p>
          </div>
        `;
        break;

      default:
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2>UniAssist AI Notification: ${subject}</h2>
            <p>${data.message || 'You have a new update in your student portal.'}</p>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">UniAssist AI &bull; Student Support System</p>
          </div>
        `;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || '"UniAssist AI" <no-reply@uniassist.edu>',
      to,
      subject,
      html: bodyHtml
    };

    const mailer = await getTransporter();
    const info = await mailer.sendMail(mailOptions);

    console.log(`[Email Dispatcher] To: ${to} | Subject: "${subject}" | Template: ${templateType} | MessageId: ${info.messageId || 'simulated'}`);

    return {
      success: true,
      deliveredAt: new Date().toISOString(),
      recipient: to,
      subject,
      messageId: info.messageId || null
    };
  } catch (err) {
    console.error('[Email Dispatch Error]:', err.message);
    return { success: false, error: err.message };
  }
};

export default { sendEmailNotification };
