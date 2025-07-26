import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOffline;
}

// Offline storage for workout sessions
export function useOfflineWorkouts() {
  const [offlineWorkouts, setOfflineWorkouts] = useState<any[]>([]);
  
  useEffect(() => {
    // Load offline workouts from localStorage
    const stored = localStorage.getItem('offline-workouts');
    if (stored) {
      try {
        setOfflineWorkouts(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse offline workouts:', error);
      }
    }
  }, []);
  
  const saveOfflineWorkout = (workout: any) => {
    const updated = [...offlineWorkouts, { ...workout, offlineTimestamp: Date.now() }];
    setOfflineWorkouts(updated);
    localStorage.setItem('offline-workouts', JSON.stringify(updated));
  };
  
  const clearOfflineWorkouts = () => {
    setOfflineWorkouts([]);
    localStorage.removeItem('offline-workouts');
  };
  
  const syncOfflineWorkouts = async () => {
    if (offlineWorkouts.length === 0) return;
    
    const synced = [];
    const failed = [];
    
    for (const workout of offlineWorkouts) {
      try {
        const response = await fetch('/api/workout-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workout)
        });
        
        if (response.ok) {
          synced.push(workout);
        } else {
          failed.push(workout);
        }
      } catch (error) {
        failed.push(workout);
      }
    }
    
    // Keep only failed workouts
    setOfflineWorkouts(failed);
    localStorage.setItem('offline-workouts', JSON.stringify(failed));
    
    return { synced: synced.length, failed: failed.length };
  };
  
  return {
    offlineWorkouts,
    saveOfflineWorkout,
    clearOfflineWorkouts,
    syncOfflineWorkouts,
    hasOfflineWorkouts: offlineWorkouts.length > 0
  };
}

// PWA installation prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
      return true;
    }
    
    return false;
  };
  
  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
}