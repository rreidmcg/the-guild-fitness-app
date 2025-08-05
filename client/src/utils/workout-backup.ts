// Workout backup and recovery utilities
import { toast } from "@/hooks/use-toast";

export interface WorkoutBackup {
  sessionData: any;
  timestamp: number;
  userId: number;
  workoutId: string | null;
  attempts: number;
}

export class WorkoutBackupManager {
  private static BACKUP_PREFIX = 'workout_backup_';
  private static MAX_BACKUP_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private static MAX_ATTEMPTS = 3;

  static saveBackup(sessionData: any): string {
    const backupKey = `${this.BACKUP_PREFIX}${Date.now()}`;
    const backup: WorkoutBackup = {
      sessionData,
      timestamp: Date.now(),
      userId: sessionData.userId,
      workoutId: sessionData.workoutId,
      attempts: 0
    };

    try {
      localStorage.setItem(backupKey, JSON.stringify(backup));
      console.log("Workout backup saved:", backupKey);
      return backupKey;
    } catch (error) {
      console.error("Failed to save workout backup:", error);
      return '';
    }
  }

  static getAllBackups(): WorkoutBackup[] {
    const backups: WorkoutBackup[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.BACKUP_PREFIX)) {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backup = JSON.parse(backupData);
            // Only include recent backups
            if (Date.now() - backup.timestamp < this.MAX_BACKUP_AGE) {
              backups.push(backup);
            } else {
              // Clean up old backups
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to retrieve workout backups:", error);
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  static getMostRecentBackup(): WorkoutBackup | null {
    const backups = this.getAllBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  static incrementAttempts(backupKey: string): boolean {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        const backup: WorkoutBackup = JSON.parse(backupData);
        backup.attempts = (backup.attempts || 0) + 1;
        
        if (backup.attempts >= this.MAX_ATTEMPTS) {
          // Move to failed backups for manual recovery
          const failedKey = `workout_failed_${Date.now()}`;
          localStorage.setItem(failedKey, JSON.stringify(backup));
          localStorage.removeItem(backupKey);
          
          toast({
            title: "Workout Save Failed",
            description: "Your workout has been saved for manual recovery. Please contact support if this continues.",
            variant: "destructive",
          });
          
          return false;
        } else {
          localStorage.setItem(backupKey, JSON.stringify(backup));
          return true;
        }
      }
    } catch (error) {
      console.error("Failed to increment backup attempts:", error);
    }
    
    return false;
  }

  static removeBackup(backupKey: string): void {
    try {
      localStorage.removeItem(backupKey);
      console.log("Workout backup removed:", backupKey);
    } catch (error) {
      console.error("Failed to remove workout backup:", error);
    }
  }

  static cleanupOldBackups(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.BACKUP_PREFIX)) {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backup = JSON.parse(backupData);
            if (Date.now() - backup.timestamp > this.MAX_BACKUP_AGE) {
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old workout backups`);
      }
    } catch (error) {
      console.error("Failed to cleanup old backups:", error);
    }
  }

  static getFailedWorkouts(): WorkoutBackup[] {
    const failedWorkouts: WorkoutBackup[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('workout_failed_')) {
          const workoutData = localStorage.getItem(key);
          if (workoutData) {
            failedWorkouts.push(JSON.parse(workoutData));
          }
        }
      }
    } catch (error) {
      console.error("Failed to retrieve failed workouts:", error);
    }

    return failedWorkouts.sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Initialize cleanup on module load
WorkoutBackupManager.cleanupOldBackups();