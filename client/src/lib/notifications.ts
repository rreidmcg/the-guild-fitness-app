// Push notification utilities
export class NotificationManager {
  private static instance: NotificationManager;
  private vapidPublicKey = 'BP8rVFJOhZJ_7Y7D_YYD5QXJyZBJyJJ5c6Y3m5vK_vDzX5d3sY7bN8xJ6kQ4B6wL2H1R3cT9F8d2qY7aJ6x3Y5'; // Replace with actual VAPID key
  
  static getInstance() {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging not supported');
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }
  
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const successful = await subscription.unsubscribe();
        if (successful) {
          // Notify server of unsubscription
          await this.removeSubscriptionFromServer(subscription);
        }
        return successful;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }
  
  showLocalNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      });
    }
  }
  
  // Schedule daily quest reminders
  scheduleDailyReminders() {
    // Quest reminder at 6 PM
    this.scheduleNotification(
      'Daily Quest Reminder',
      'Complete your daily quests before midnight!',
      18, 0 // 6:00 PM
    );
    
    // Atrophy warning at 10 PM
    this.scheduleNotification(
      'Atrophy Warning', 
      'Work out today or lose stats at midnight!',
      22, 0 // 10:00 PM
    );
  }
  
  private scheduleNotification(title: string, body: string, hour: number, minute: number) {
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hour, minute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    const delay = scheduled.getTime() - now.getTime();
    
    setTimeout(() => {
      this.showLocalNotification(title, { body });
      
      // Schedule next day
      this.scheduleNotification(title, body, hour, minute);
    }, delay);
  }
  
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }
  
  private async removeSubscriptionFromServer(subscription: PushSubscription) {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }
  
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Usage hooks
export function useNotifications() {
  const manager = NotificationManager.getInstance();
  
  return {
    requestPermission: () => manager.requestPermission(),
    subscribeToPush: () => manager.subscribeToPush(),
    unsubscribeFromPush: () => manager.unsubscribeFromPush(),
    showNotification: (title: string, options?: NotificationOptions) => 
      manager.showLocalNotification(title, options),
    scheduleDailyReminders: () => manager.scheduleDailyReminders(),
    hasPermission: Notification.permission === 'granted',
    isSupported: 'Notification' in window
  };
}