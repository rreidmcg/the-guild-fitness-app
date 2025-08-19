// Email service using ActiveCampaign and Postmark for transactional emails
import nodemailer from 'nodemailer';
import * as postmark from "postmark";
const ActiveCampaign = require("activecampaign");

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ActiveCampaign client initialization
let activeCampaignClient: any = null;

function createActiveCampaignClient() {
  if (activeCampaignClient) return activeCampaignClient;
  
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;
  
  if (!apiUrl || !apiKey) {
    console.warn('ActiveCampaign credentials not configured');
    return null;
  }
  
  activeCampaignClient = new ActiveCampaign(apiUrl, apiKey);
  console.log('✅ ActiveCampaign client created');
  return activeCampaignClient;
}

// Postmark client initialization
let postmarkClient: postmark.ServerClient | null = null;

function createPostmarkClient() {
  if (postmarkClient) return postmarkClient;
  
  const serverToken = process.env.POSTMARK_SERVER_TOKEN;
  
  if (!serverToken) {
    console.warn('Postmark server token not configured');
    return null;
  }
  
  postmarkClient = new postmark.ServerClient(serverToken);
  console.log('✅ Postmark client created');
  return postmarkClient;
}

// Nodemailer transporter for Gmail SMTP (legacy fallback)
let nodemailerTransporter: nodemailer.Transporter | null = null;

function createNodemailerTransporter() {
  if (nodemailerTransporter) return nodemailerTransporter;
  
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  
  if (!gmailUser || !gmailPass) {
    console.warn('Gmail credentials not configured for Nodemailer');
    return null;
  }
  
  nodemailerTransporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass // This should be an App Password, not your regular password
    }
  });
  
  console.log('✅ Nodemailer transporter created for Gmail SMTP');
  return nodemailerTransporter;
}

// Send email via Nodemailer (Gmail SMTP)
async function sendEmailViaNodemailer(params: EmailParams): Promise<boolean> {
  const transporter = createNodemailerTransporter();
  if (!transporter) return false;
  
  try {
    const info = await transporter.sendMail({
      from: `"The Guild: Gamified Fitness" <${process.env.GMAIL_USER}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });
    
    console.log(`✅ Email sent successfully to ${params.to} via Nodemailer/Gmail:`, info.messageId);
    return true;
  } catch (error) {
    console.error('Nodemailer/Gmail error:', error);
    return false;
  }
}

// Send email via Postmark
async function sendEmailViaPostmark(params: EmailParams): Promise<boolean> {
  const client = createPostmarkClient();
  if (!client) return false;
  
  try {
    const result = await client.sendEmail({
      "From": "noreply@theguildfitness.com", // Replace with your verified domain
      "To": params.to,
      "Subject": params.subject,
      "HtmlBody": params.html,
      "TextBody": params.text || params.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      "MessageStream": "outbound"
    });
    
    console.log(`✅ Email sent successfully to ${params.to} via Postmark:`, result.MessageID);
    return true;
  } catch (error) {
    console.error('Postmark error:', error);
    return false;
  }
}

// Sync contact with ActiveCampaign
async function syncContactWithActiveCampaign(email: string, firstName?: string, lastName?: string): Promise<boolean> {
  const client = createActiveCampaignClient();
  if (!client) return false;
  
  try {
    const contactData: any = { email };
    if (firstName) contactData.firstName = firstName;
    if (lastName) contactData.lastName = lastName;
    
    const result = await client.api("contact/sync", contactData);
    
    if (result.success) {
      console.log(`✅ Contact synced with ActiveCampaign: ${email}`);
      return true;
    } else {
      console.warn('ActiveCampaign contact sync failed:', result);
      return false;
    }
  } catch (error) {
    console.error('ActiveCampaign sync error:', error);
    return false;
  }
}

// Main email sending function with fallback support
export async function sendEmail(params: EmailParams, contactInfo?: { firstName?: string, lastName?: string }): Promise<boolean> {
  console.log(`📧 Attempting to send email to: ${params.to}`);
  
  // Sync contact with ActiveCampaign for marketing and CRM (non-blocking)
  if (contactInfo) {
    syncContactWithActiveCampaign(params.to, contactInfo.firstName, contactInfo.lastName)
      .catch(error => console.warn('ActiveCampaign sync failed (non-blocking):', error));
  }
  
  // Try Postmark first (best for transactional emails)
  const postmarkSuccess = await sendEmailViaPostmark(params);
  if (postmarkSuccess) {
    return true;
  }
  
  console.log('⚠️ Postmark failed, trying Nodemailer (Gmail)...');
  
  // Fallback to Nodemailer
  const nodemailerSuccess = await sendEmailViaNodemailer(params);
  if (nodemailerSuccess) {
    return true;
  }
  
  console.log('❌ All email services failed, logging notification instead');
  logEmailNotification(params);
  return false;
}

// Utility function to send welcome email with ActiveCampaign integration
export async function sendWelcomeEmail(email: string, firstName: string, lastName?: string): Promise<boolean> {
  const welcomeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to The Guild: Gamified Fitness</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
        h2 { color: #4f46e5; margin-top: 0; }
        .cta { background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚔️ Welcome to The Guild!</h1>
      </div>
      
      <div class="content">
        <h2>Hey ${firstName}!</h2>
        
        <p>Welcome to <strong>The Guild: Gamified Fitness</strong> - where your workout routine becomes an epic adventure!</p>
        
        <p>Your journey begins now:</p>
        <ul>
          <li>🎮 <strong>Level up</strong> by completing workouts and earning XP</li>
          <li>⚔️ <strong>Battle monsters</strong> to test your growing strength</li>
          <li>🏆 <strong>Unlock achievements</strong> and climb the leaderboards</li>
          <li>💪 <strong>Track your progress</strong> with RPG-style character stats</li>
        </ul>
        
        <p>Ready to start your fitness adventure?</p>
        <a href="${process.env.VITE_API_BASE_URL || 'https://theguildfitness.com'}" class="cta">Start Your Journey</a>
      </div>
      
      <div class="footer">
        <p>The Guild: Gamified Fitness | Transform Your Workouts Into Adventures</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "⚔️ Welcome to The Guild: Your Fitness Adventure Begins!",
    html: welcomeHtml
  }, { firstName, lastName });
}

function logEmailNotification(params: EmailParams) {
  console.log('\n📧 EMAIL NOTIFICATION LOGGED:');
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  console.log(`Preview: ${params.html.replace(/<[^>]*>/g, '').substring(0, 150)}...`);
  console.log('═══════════════════════════════════════════════════════════\n');
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
// Send admin notification about new liability waiver
export async function sendAdminNotification(userName: string, userEmail: string, ipAddress: string, userAgent: string): Promise<boolean> {
  const adminHtml = generateAdminWaiverNotification(userName, userEmail, ipAddress, userAgent);
  
  return await sendEmail({
    to: "guildmasterreid@gmail.com", // Dedicated business email for all admin notifications
    subject: `🔔 New Liability Waiver Signed - ${userName}`,
    html: adminHtml
  });
}

// Send liability waiver confirmation to new user
export async function sendLiabilityWaiverConfirmation(userData: { username: string, email: string }, ip: string, userAgent: string): Promise<void> {
  try {
    // Send user confirmation email
    const userHtml = generateLiabilityWaiverEmail(userData.username, userData.email);
    await sendEmail({
      to: userData.email,
      subject: "✅ Liability Waiver Confirmation - The Guild: Gamified Fitness",
      html: userHtml
    });

    // Send admin notification to dedicated business email
    await sendAdminNotification(userData.username, userData.email, ip, userAgent);
    
    console.log(`📧 Liability waiver emails processed for user: ${userData.username}`);
  } catch (error) {
    console.error("Failed to send liability waiver emails:", error);
    throw error;
  }
}
