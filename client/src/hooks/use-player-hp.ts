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
    // Load initial state from localStorage with proper number coercion
    const loadPlayerState = () => {
      try {
        const stored = localStorage.getItem('hp_regen_state');
        if (stored) {
          const state = JSON.parse(stored);
          // Coerce to numbers - handles strings like "11" → 11, NaN → defaults
          const hp = Number(state.hp);
          const maxHp = Number(state.maxHp);
          const lastRegenMs = Number(state.lastRegenMs);
          
          return {
            hp: Number.isFinite(hp) ? hp : 0,
            maxHp: Number.isFinite(maxHp) ? maxHp : 100,
            lastRegenMs: Number.isFinite(lastRegenMs) ? lastRegenMs : Date.now()
          };
        }
      } catch (error) {
        console.warn('Failed to load HP state:', error);
      }
      return { hp: 0, maxHp: 100, lastRegenMs: Date.now() };
    };

    // Set initial state
    const initialState = loadPlayerState();
    setHp(initialState.hp);
    setMaxHp(initialState.maxHp);
    setLastRegenMs(initialState.lastRegenMs);

    // Listen for real-time HP updates from the regeneration service
    const onPlayerUpdate = (e: CustomEvent) => {
      const { hp, maxHp, lastRegenMs } = e.detail || {};
      // Ensure numbers are properly coerced
      const numHp = Number(hp);
      const numMaxHp = Number(maxHp);
      const numLastRegen = Number(lastRegenMs);
      
      if (Number.isFinite(numHp)) setHp(numHp);
      if (Number.isFinite(numMaxHp)) setMaxHp(numMaxHp);
      if (Number.isFinite(numLastRegen)) setLastRegenMs(numLastRegen);
    };

    // Listen for localStorage changes (multi-tab sync)
    const onStorageChange = (e: StorageEvent) => {
      if (e.key !== 'hp_regen_state' || !e.newValue) return;
      try {
        const state = JSON.parse(e.newValue);
        // Use the same number coercion logic
        const hp = Number(state.hp);
        const maxHp = Number(state.maxHp);
        const lastRegenMs = Number(state.lastRegenMs);
        
        if (Number.isFinite(hp)) setHp(hp);
        if (Number.isFinite(maxHp)) setMaxHp(maxHp);
        if (Number.isFinite(lastRegenMs)) setLastRegenMs(lastRegenMs);
      } catch (error) {
        console.warn('Failed to sync HP state from storage:', error);
      }
    };

    // Force regen tick when page becomes visible or navigation occurs
    const onForceRegenTick = () => {
      window.dispatchEvent(new Event('force:regenTick'));
      // Also refresh from localStorage in case we missed an update
      const freshState = loadPlayerState();
      setHp(freshState.hp);
      setMaxHp(freshState.maxHp);
      setLastRegenMs(freshState.lastRegenMs);
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