/**
 * Email Notification Service with University Branded Templates
 */
export const sendEmailNotification = async ({ to, subject, templateType, data }) => {
  try {
    let bodyHtml = '';

    switch (templateType) {
      case 'attendance_warning':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #ef4444;">
            <h2 style="color: #ef4444; margin-bottom: 8px;">⚠️ Critical Attendance Threshold Warning</h2>
            <p>Dear ${data.studentName || 'Student'},</p>
            <p>Your recorded attendance in <strong>${data.courseCode} (${data.courseName})</strong> has dropped to <strong style="color: #ef4444;">${data.percentage}%</strong>, which is below the mandatory <strong>75%</strong> examination eligibility threshold.</p>
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
            <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleString()}</p>
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
            <p>Your office hour appointment with <strong>${data.facultyName}</strong> has been confirmed.</p>
            <p><strong>Date & Time:</strong> ${data.appointmentDate} at ${data.timeSlot}</p>
            <p><strong>Location/Channel:</strong> ${data.location}</p>
            <p><strong>Topic:</strong> ${data.purpose}</p>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">UniAssist AI &bull; Faculty Advisory Services</p>
          </div>
        `;
        break;

      default:
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc;">
            <h2>UniAssist AI Notification: ${subject}</h2>
            <p>${data.message || 'You have a new update in your student portal.'}</p>
          </div>
        `;
    }

    // In local/production environment: log the notification dispatch (simulated email gateway)
    console.log(`[Email Dispatcher] To: ${to} | Subject: "${subject}" | Template: ${templateType}`);
    
    return {
      success: true,
      deliveredAt: new Date().toISOString(),
      recipient: to,
      subject,
      preview: subject
    };
  } catch (err) {
    console.error('Email dispatch error:', err);
    return { success: false, error: err.message };
  }
};

export default { sendEmailNotification };
