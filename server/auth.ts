import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 12;

// Email configuration
const createTransporter = () => {
  // For development, use ethereal.email test account
  // In production, configure with real SMTP settings
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.EMAIL_PASS || 'ethereal.pass'
    }
  });
};

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
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
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
      const transporter = createTransporter();
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
      
      await transporter.sendMail({
        from: '"The Guild: Gamified Fitness" <noreply@theguild.app>',
        to: email,
        subject: 'Verify Your The Guild Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to The Guild: Gamified Fitness, ${username}!</h2>
            <p>Thank you for joining our fitness RPG community. To complete your registration, please verify your email address.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
          </div>
        `
      });
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  },

  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
    try {
      const transporter = createTransporter();
      const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      await transporter.sendMail({
        from: '"The Guild: Gamified Fitness" <noreply@theguild.app>',
        to: email,
        subject: 'Reset Your The Guild Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Password Reset Request</h2>
            <p>Hello ${username},</p>
            <p>We received a request to reset your The Guild: Gamified Fitness account password. If you didn't make this request, you can ignore this email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
          </div>
        `
      });
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
};