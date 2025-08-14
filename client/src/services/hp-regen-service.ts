/**
 * HP Regeneration Service
 * Provides accurate timestamp-based HP regeneration at 1% max HP per minute
 * Only regenerates when NOT on dungeon pages
 */

// Constants
const MINUTE_MS = 60000;
const REGEN_PERCENT_PER_MIN = 1; // 1% of max per minute
const TICK_INTERVAL_MS = 5000; // Check every 5 seconds
const STORAGE_KEY = 'hp_regen_state';

interface HpRegenState {
  hp: number;
  maxHp: number;
  lastRegenMs: number;
}

class HpRegenerationService {
  private intervalId: number | null = null;
  private subscribers: Array<(state: HpRegenState) => void> = [];
  private state: HpRegenState = {
    hp: 0,
    maxHp: 0,
    lastRegenMs: Date.now()
  };

  constructor() {
    this.loadState();
    this.setupEventListeners();
    this.debug('HP Regen Service initialized');
  }

  private debug(...args: any[]) {
    if ((window as any).__DEBUG_REGEN__) {
      console.log('[HP Regen]', ...args);
    }
  }

  private isOnDungeonPage(): boolean {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Check for dungeon routes - covers /pve-dungeons, /dungeon-battle, etc.
    const isDungeonPath = path.includes('/pve-dungeons') || 
                         path.includes('/dungeon-battle') ||
                         hash.includes('#/pve-dungeons') || 
                         hash.includes('#/dungeon-battle');
    
    this.debug('Route check:', { path, hash, isDungeonPath });
    return isDungeonPath;
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        this.state = {
          hp: Math.max(0, parsedState.hp || 0),
          maxHp: Math.max(0, parsedState.maxHp || 0),
          lastRegenMs: parsedState.lastRegenMs || Date.now()
        };
        this.debug('Loaded state:', this.state);
      }
    } catch (error) {
      this.debug('Failed to load state:', error);
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notifyPlayerUpdate(this.state);
      this.debug('Saved state:', this.state);
    } catch (error) {
      this.debug('Failed to save state:', error);
    }
  }

  // Emit player update event for real-time UI updates
  private notifyPlayerUpdate(state: HpRegenState): void {
    try {
      window.dispatchEvent(new CustomEvent('player:update', {
        detail: { hp: state.hp, maxHp: state.maxHp, lastRegenMs: state.lastRegenMs }
      }));
    } catch (error) {
      // Silently fail in case window is not available
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.state });
      } catch (error) {
        this.debug('Subscriber error:', error);
      }
    });
  }

  private tick = () => {
    const now = Date.now();
    const isOnDungeon = this.isOnDungeonPage();
    
    this.debug('Tick:', {
      now,
      isOnDungeon,
      currentHp: this.state.hp,
      maxHp: this.state.maxHp,
      lastRegenMs: this.state.lastRegenMs
    });

    if (isOnDungeon) {
      // Reset regen clock while in dungeon - no accumulation
      this.state.lastRegenMs = now;
      this.saveState();
      this.notifySubscribers();
      return;
    }

    // Only regenerate if not at full HP
    if (this.state.hp >= this.state.maxHp || this.state.maxHp <= 0) {
      this.state.lastRegenMs = now;
      this.saveState();
      return;
    }

    const elapsedMs = now - this.state.lastRegenMs;
    if (elapsedMs > 0) {
      const regenPct = (elapsedMs / MINUTE_MS) * REGEN_PERCENT_PER_MIN;
      const gain = (regenPct / 100) * this.state.maxHp;
      const newHp = Math.min(this.state.maxHp, this.state.hp + gain);
      
      this.debug('Regeneration calc:', {
        elapsedMs,
        regenPct,
        gain,
        oldHp: this.state.hp,
        newHp
      });

      if (newHp > this.state.hp) {
        this.state.hp = newHp;
        this.state.lastRegenMs = now;
        this.saveState();
        this.notifySubscribers();
      }
    }
  };

  private setupEventListeners() {
    // Handle visibility changes (tab sleep/wake)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.debug('Tab became visible, triggering tick');
        this.tick();
      }
    });

    // Handle navigation events
    window.addEventListener('hashchange', () => {
      this.debug('Hash change detected');
      this.tick();
    });

    window.addEventListener('popstate', () => {
      this.debug('Popstate detected');
      this.tick();
    });

    // Monkey patch pushState and replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.debug('PushState detected');
      setTimeout(() => this.tick(), 100); // Small delay for route to update
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.debug('ReplaceState detected');
      setTimeout(() => this.tick(), 100);
    };

    // Add force regen tick event listener
    window.addEventListener('force:regenTick', () => {
      this.debug('Force regen tick requested');
      this.tick();
    });
  }

  // Public API
  start() {
    if (this.intervalId) {
      this.debug('Service already running');
      return;
    }

    this.intervalId = window.setInterval(this.tick, TICK_INTERVAL_MS);
    this.debug('Started HP regeneration service - interval created');
    
    // Initial tick to catch up from any time away
    this.tick();
    
    // Fire initial player update for late subscribers
    this.notifyPlayerUpdate(this.state);
    
    // Fire initial player update for late subscribers
    this.notifyPlayerUpdate(this.state);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.debug('Stopped HP regeneration service');
    }
  }

  updatePlayerState(hp: number, maxHp: number) {
    const changed = this.state.hp !== hp || this.state.maxHp !== maxHp;
    
    this.state.hp = Math.max(0, Math.min(hp, maxHp));
    this.state.maxHp = Math.max(0, maxHp);
    
    if (changed) {
      this.saveState();
      this.notifySubscribers();
      this.debug('Updated player state:', { hp: this.state.hp, maxHp: this.state.maxHp });
    }
  }

  getState(): HpRegenState {
    return { ...this.state };
  }

  subscribe(callback: (state: HpRegenState) => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Force an immediate regen calculation (for testing)
  forceRegen() {
    this.tick();
  }
}

// Global singleton instance
export const hpRegenService = new HpRegenerationService();

// Auto-start when module loads
hpRegenService.start();