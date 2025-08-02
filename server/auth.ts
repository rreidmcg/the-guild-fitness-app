import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from './email-service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 12;

export const authUtils = {
  // Password hashing
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  // Token generation
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  generateJWT(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
  },

  verifyJWT(token: string): { userId: number } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      return null;
    }
  },

  // Email sending
  async sendVerificationEmail(email: string, username: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Account - The Guild: Gamified Fitness</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
            .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background-color: #3730a3; }
            h2 { color: #4f46e5; margin-top: 0; }
            .link { word-break: break-all; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏋️ The Guild: Gamified Fitness</h1>
            <p>Account Verification</p>
          </div>
          
          <div class="content">
            <h2>Welcome to The Guild, ${username}!</h2>
            
            <p>Thank you for joining our fitness RPG community! To complete your registration and start your adventure, please verify your email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>Create and track workouts</li>
              <li>Level up your character with RPG stats</li>
              <li>Battle monsters and earn rewards</li>
              <li>Join the fitness adventure!</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated verification email from The Guild: Gamified Fitness.</p>
            <p>© 2025 The Guild: Gamified Fitness. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;
      
      return await sendEmail({
        to: email,
        subject: '🏋️ Verify Your Guild Account - Start Your Fitness Adventure!',
        html: emailHtml
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  },

  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset - The Guild: Gamified Fitness</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
            .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background-color: #b91c1c; }
            h2 { color: #dc2626; margin-top: 0; }
            .link { word-break: break-all; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 The Guild: Gamified Fitness</h1>
            <p>Password Reset Request</p>
          </div>
          
          <div class="content">
            <h2>Hello ${username},</h2>
            
            <p>We received a request to reset your Guild account password. If you didn't make this request, you can safely ignore this email.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                Reset Your Password
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour for your account security. If you didn't request this reset, please ignore this email.
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated security email from The Guild: Gamified Fitness.</p>
            <p>© 2025 The Guild: Gamified Fitness. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;
      
      return await sendEmail({
        to: email,
        subject: '🔐 Reset Your Guild Password - Security Request',
        html: emailHtml
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
};