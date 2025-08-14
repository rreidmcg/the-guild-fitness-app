import { useEffect, useState } from 'react';

interface PlayerHpState {
  hp: number;
  maxHp: number;
  lastRegenMs: number;
}

/**
 * React hook that subscribes to real-time HP updates from the regeneration service
 * This ensures HP bars update immediately without requiring page reloads
 */
export function usePlayerHp() {
  const [hp, setHp] = useState(0);
  const [maxHp, setMaxHp] = useState(100);
  const [lastRegenMs, setLastRegenMs] = useState(Date.now());

  useEffect(() => {
    // Load initial state from localStorage
    try {
      const stored = localStorage.getItem('hp_regen_state');
      if (stored) {
        const state: PlayerHpState = JSON.parse(stored);
        if (typeof state.hp === 'number') setHp(state.hp);
        if (typeof state.maxHp === 'number') setMaxHp(state.maxHp);
        if (typeof state.lastRegenMs === 'number') setLastRegenMs(state.lastRegenMs);
      }
    } catch (error) {
      console.warn('Failed to load initial HP state:', error);
    }

    // Listen for real-time HP updates from the regeneration service
    const onPlayerUpdate = (e: CustomEvent) => {
      const { hp, maxHp, lastRegenMs } = e.detail || {};
      if (typeof hp === 'number') setHp(hp);
      if (typeof maxHp === 'number') setMaxHp(maxHp);
      if (typeof lastRegenMs === 'number') setLastRegenMs(lastRegenMs);
    };

    // Listen for localStorage changes (multi-tab sync)
    const onStorageChange = (e: StorageEvent) => {
      if (e.key !== 'hp_regen_state' || !e.newValue) return;
      try {
        const state: PlayerHpState = JSON.parse(e.newValue);
        if (typeof state.hp === 'number') setHp(state.hp);
        if (typeof state.maxHp === 'number') setMaxHp(state.maxHp);
        if (typeof state.lastRegenMs === 'number') setLastRegenMs(state.lastRegenMs);
      } catch (error) {
        console.warn('Failed to sync HP state from storage:', error);
      }
    };

    // Force regen tick when page becomes visible or navigation occurs
    const onForceRegenTick = () => {
      window.dispatchEvent(new Event('force:regenTick'));
    };

    // Set up event listeners
    window.addEventListener('player:update', onPlayerUpdate as EventListener);
    window.addEventListener('storage', onStorageChange);
    window.addEventListener('pageshow', onForceRegenTick);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) onForceRegenTick();
    });

    // Cleanup function
    return () => {
      window.removeEventListener('player:update', onPlayerUpdate as EventListener);
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('pageshow', onForceRegenTick);
      document.removeEventListener('visibilitychange', onForceRegenTick);
    };
  }, []);

  return { hp, maxHp, lastRegenMs };
}