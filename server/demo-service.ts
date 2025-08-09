import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { db } from './db.js';
import { users, magicLinks } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

export class DemoService {
  // Create a demo user with sample data
  static async createDemoUser(): Promise<{ userId: number; user: any }> {
    const demoUsername = `demo_${nanoid(8)}`;
    const demoEmail = `demo+${nanoid(8)}@example.com`;
    const demoPassword = nanoid(16); // Random password user won't need
    
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    
    // Create demo user with pre-populated data
    const [newUser] = await db.insert(users).values({
      username: demoUsername,
      email: demoEmail,
      password: hashedPassword,
      isDemoAccount: true,
      hasCompletedOnboarding: true,
      // Give demo user some progress to showcase
      level: 3,
      experience: 45,
      strength: 2,
      stamina: 2,
      agility: 1,
      gold: 150,
      gems: 25,
      currentStreak: 5,
      currentTitle: "Warrior",
      lastActivityDate: new Date().toISOString().split('T')[0],
      // Pre-equip some basic gear
      equippedChest: "basic_tunic",
      equippedLegs: "basic_pants",
      equippedFeet: "basic_boots",
    }).returning();
    
    return { userId: newUser.id, user: newUser };
  }
  
  // Generate magic link for demo access
  static async generateMagicLink(description: string = "Demo Access"): Promise<{ token: string; url: string }> {
    // Create demo user
    const { userId } = await this.createDemoUser();
    
    // Generate unique token
    const token = nanoid(32);
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Store magic link
    await db.insert(magicLinks).values({
      token,
      userId,
      expiresAt,
      description,
    });
    
    // Return the magic link URL
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000';
    
    const url = `${baseUrl}/demo/${token}`;
    
    return { token, url };
  }
  
  // Validate and use magic link
  static async validateMagicLink(token: string): Promise<{ valid: boolean; userId?: number; expired?: boolean }> {
    const [link] = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.token, token))
      .limit(1);
    
    if (!link) {
      return { valid: false };
    }
    
    if (link.isUsed) {
      return { valid: false };
    }
    
    if (new Date() > link.expiresAt) {
      return { valid: false, expired: true };
    }
    
    // Mark link as used
    await db
      .update(magicLinks)
      .set({ isUsed: true })
      .where(eq(magicLinks.id, link.id));
    
    return { valid: true, userId: link.userId! };
  }
  
  // Clean up expired demo users and links
  static async cleanupExpiredDemo(): Promise<void> {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    // Get expired magic links
    const expiredLinks = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.expiresAt, oneDayAgo));
    
    // Delete associated demo users
    for (const link of expiredLinks) {
      if (link.userId) {
        await db.delete(users).where(eq(users.id, link.userId));
      }
    }
    
    // Delete expired magic links
    await db.delete(magicLinks).where(eq(magicLinks.expiresAt, oneDayAgo));
  }
}