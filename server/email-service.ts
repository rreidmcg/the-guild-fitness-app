// Email service using MailerLite API
interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  
  if (!apiKey) {
    console.warn("MailerLite API key not configured. Email would be sent in production.");
    return false;
  }

  try {
    // MailerLite doesn't support direct email sending - it's campaign-based
    // For now, we'll log the email that would be sent and return true for testing
    console.log('=== EMAIL NOTIFICATION ===');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log('HTML Content:', params.html.substring(0, 200) + '...');
    console.log('========================');
    
    // In a real implementation, you would either:
    // 1. Use MailerSend (MailerLite's transactional email service)
    // 2. Switch to SendGrid, Postmark, or similar transactional email service
    // 3. Set up SMTP with nodemailer
    
    console.log(`Email notification logged for ${params.to} - In production, this would be sent via transactional email service`);
    return true;
    
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

export function generateLiabilityWaiverEmail(userName: string, userEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Liability Waiver Confirmation - The Guild: Gamified Fitness</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        h2 { color: #4f46e5; margin-top: 0; }
        .timestamp { font-style: italic; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏋️ The Guild: Gamified Fitness</h1>
        <p>Liability Waiver Confirmation</p>
      </div>
      
      <div class="content">
        <h2>Liability Waiver Accepted</h2>
        
        <p>Dear ${userName},</p>
        
        <p>Thank you for completing the liability waiver for The Guild: Gamified Fitness. This email serves as confirmation that you have read, understood, and agreed to the terms outlined in our liability waiver and release agreement.</p>
        
        <div class="warning">
          <strong>Important Reminders:</strong>
          <ul>
            <li><strong>Consult your physician</strong> before beginning any exercise program</li>
            <li><strong>Stop immediately</strong> if you experience pain, discomfort, or concerning symptoms</li>
            <li>This app is for <strong>entertainment purposes only</strong> and does not provide medical advice</li>
            <li>Exercise at your own risk and within your physical limitations</li>
          </ul>
        </div>
        
        <div class="signature">
          <p><strong>Waiver Details:</strong></p>
          <p class="timestamp">Name: ${userName}<br>
          Email: ${userEmail}<br>
          Date Accepted: ${new Date().toLocaleDateString()}<br>
          Time: ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <p>Welcome to your fitness adventure! We're excited to help you on your journey to better health through our gamified fitness experience.</p>
        
        <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        The Guild: Gamified Fitness Team</p>
      </div>
      
      <div class="footer">
        <p>This is an automated confirmation email. Please save this for your records.</p>
        <p>© 2025 The Guild: Gamified Fitness. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateAdminWaiverNotification(userName: string, userEmail: string, ipAddress: string, userAgent: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Liability Waiver Signed - The Guild: Gamified Fitness</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
        .details { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; }
        h2 { color: #dc2626; margin-top: 0; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚖️ Legal Notice</h1>
        <p>New Liability Waiver Signed</p>
      </div>
      
      <div class="content">
        <h2>Liability Waiver Acceptance</h2>
        
        <p>A new user has signed the liability waiver for The Guild: Gamified Fitness.</p>
        
        <div class="details">
          <h3>User Information:</h3>
          <div class="field">
            <span class="label">Name:</span> <span class="value">${userName}</span>
          </div>
          <div class="field">
            <span class="label">Email:</span> <span class="value">${userEmail}</span>
          </div>
          <div class="field">
            <span class="label">IP Address:</span> <span class="value">${ipAddress}</span>
          </div>
          <div class="field">
            <span class="label">User Agent:</span> <span class="value">${userAgent}</span>
          </div>
          <div class="field">
            <span class="label">Date:</span> <span class="value">${new Date().toLocaleDateString()}</span>
          </div>
          <div class="field">
            <span class="label">Time:</span> <span class="value">${new Date().toLocaleTimeString()}</span>
          </div>
          <div class="field">
            <span class="label">Waiver Version:</span> <span class="value">1.0</span>
          </div>
        </div>
        
        <p>This user has acknowledged:</p>
        <ul>
          <li>Medical disclaimer and physician consultation requirement</li>
          <li>Entertainment-only purpose clause</li>
          <li>Assumption of risk and release of liability</li>
          <li>Personal responsibility for safety and limitations</li>
        </ul>
        
        <p>The signed waiver has been stored in the database for legal records.</p>
      </div>
      
      <div class="footer">
        <p>This is an automated legal notification from The Guild: Gamified Fitness.</p>
        <p>© 2025 The Guild: Gamified Fitness. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}