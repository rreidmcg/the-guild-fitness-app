/**
 * Effekseer-style Visual Effects System
 * Professional particle effects for battle animations
 */

export interface EffectHandle {
  id: string;
  isPlaying: boolean;
  destroy: () => void;
  setLocation: (x: number, y: number, z?: number) => void;
  setScale: (scale: number) => void;
  setRotation: (rotation: number) => void;
}

export class EffekseerSystem {
  private scene: Phaser.Scene;
  private activeEffects: Map<string, EffectHandle> = new Map();
  private effectCounter = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Professional spell casting effect
  createSpellCast(x: number, y: number, color: number = 0x00FFFF): EffectHandle {
    const id = `spell_${this.effectCounter++}`;
    
    // Energy gathering particles
    const energyParticles = this.scene.add.particles(x, y, 'magic-particle', {
      scale: { start: 0.1, end: 0.4 },
      alpha: { start: 1, end: 0 },
      tint: [color, 0xFFFFFF],
      lifespan: 800,
      quantity: 3,
      frequency: 50,
      speed: { min: 10, max: 30 },
      gravityY: -20,
      blendMode: 'ADD'
    });

    // Central energy core
    const energyCore = this.scene.add.circle(x, y, 5, color, 0.8);
    energyCore.setBlendMode(Phaser.BlendModes.ADD);

    // Pulsing animation
    this.scene.tweens.add({
      targets: energyCore,
      scaleX: 2,
      scaleY: 2,
      alpha: 0.3,
      duration: 400,
      yoyo: true,
      repeat: 2
    });

    // Magic circle effect
    const magicCircle = this.scene.add.graphics();
    magicCircle.lineStyle(2, color, 0.8);
    magicCircle.strokeCircle(0, 0, 30);
    magicCircle.x = x;
    magicCircle.y = y;
    magicCircle.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: magicCircle,
      rotation: Math.PI * 2,
      duration: 1200,
      ease: 'Linear'
    });

    const handle: EffectHandle = {
      id,
      isPlaying: true,
      destroy: () => {
        energyParticles.destroy();
        energyCore.destroy();
        magicCircle.destroy();
        this.activeEffects.delete(id);
      },
      setLocation: (newX: number, newY: number) => {
        energyParticles.x = newX;
        energyParticles.y = newY;
        energyCore.x = newX;
        energyCore.y = newY;
        magicCircle.x = newX;
        magicCircle.y = newY;
      },
      setScale: (scale: number) => {
        energyParticles.setScale(scale);
        energyCore.setScale(scale);
        magicCircle.setScale(scale);
      },
      setRotation: (rotation: number) => {
        magicCircle.rotation = rotation;
      }
    };

    // Auto-cleanup after effect duration
    this.scene.time.delayedCall(1500, () => {
      if (this.activeEffects.has(id)) {
        handle.destroy();
      }
    });

    this.activeEffects.set(id, handle);
    return handle;
  }

  // Devastating explosion effect
  createExplosion(x: number, y: number, intensity: number = 1): EffectHandle {
    const id = `explosion_${this.effectCounter++}`;
    const baseSize = 50 * intensity;

    // Initial flash
    const flash = this.scene.add.circle(x, y, baseSize * 2, 0xFFFFFF, 1);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy()
    });

    // Core explosion
    const explosionCore = this.scene.add.circle(x, y, 10, 0xFF4400, 0.9);
    explosionCore.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: explosionCore,
      scaleX: intensity * 4,
      scaleY: intensity * 4,
      alpha: 0,
      duration: 400,
      ease: 'Power2'
    });

    // Explosion particles
    const explosionParticles = this.scene.add.particles(x, y, 'fire-particle', {
      scale: { start: 0.3 * intensity, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xFF0000, 0xFF4400, 0xFF8800, 0xFFAA00],
      lifespan: 600,
      quantity: Math.floor(15 * intensity),
      speed: { min: 50 * intensity, max: 150 * intensity },
      blendMode: 'ADD'
    });

    // Shockwave ring
    const shockwave = this.scene.add.graphics();
    shockwave.lineStyle(3, 0xFFFFFF, 0.8);
    shockwave.strokeCircle(0, 0, 5);
    shockwave.x = x;
    shockwave.y = y;
    shockwave.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: shockwave,
      scaleX: intensity * 6,
      scaleY: intensity * 6,
      alpha: 0,
      duration: 500,
      ease: 'Power2'
    });

    const handle: EffectHandle = {
      id,
      isPlaying: true,
      destroy: () => {
        explosionCore.destroy();
        explosionParticles.destroy();
        shockwave.destroy();
        this.activeEffects.delete(id);
      },
      setLocation: (newX: number, newY: number) => {
        explosionCore.x = newX;
        explosionCore.y = newY;
        explosionParticles.x = newX;
        explosionParticles.y = newY;
        shockwave.x = newX;
        shockwave.y = newY;
      },
      setScale: (scale: number) => {
        explosionCore.setScale(scale);
        explosionParticles.setScale(scale);
        shockwave.setScale(scale);
      },
      setRotation: () => {} // Explosions don't need rotation
    };

    // Auto-cleanup
    this.scene.time.delayedCall(1000, () => {
      if (this.activeEffects.has(id)) {
        handle.destroy();
      }
    });

    this.activeEffects.set(id, handle);
    return handle;
  }

  // Healing light effect
  createHealingLight(x: number, y: number): EffectHandle {
    const id = `heal_${this.effectCounter++}`;

    // Healing orbs rising up
    const healingParticles = this.scene.add.particles(x, y + 20, 'light-particle', {
      scale: { start: 0.2, end: 0.5 },
      alpha: { start: 1, end: 0 },
      tint: [0x00FF00, 0x88FF88, 0xFFFFFF],
      lifespan: 1200,
      quantity: 2,
      frequency: 100,
      speed: { min: 20, max: 40 },
      gravityY: -30,
      blendMode: 'ADD'
    });

    // Gentle glow
    const healingGlow = this.scene.add.circle(x, y, 30, 0x00FF88, 0.3);
    healingGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: healingGlow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.easeOut'
    });

    const handle: EffectHandle = {
      id,
      isPlaying: true,
      destroy: () => {
        healingParticles.destroy();
        healingGlow.destroy();
        this.activeEffects.delete(id);
      },
      setLocation: (newX: number, newY: number) => {
        healingParticles.x = newX;
        healingParticles.y = newY + 20;
        healingGlow.x = newX;
        healingGlow.y = newY;
      },
      setScale: (scale: number) => {
        healingParticles.setScale(scale);
        healingGlow.setScale(scale);
      },
      setRotation: () => {} // Healing effects don't need rotation
    };

    this.scene.time.delayedCall(1500, () => {
      if (this.activeEffects.has(id)) {
        handle.destroy();
      }
    });

    this.activeEffects.set(id, handle);
    return handle;
  }

  // Lightning strike effect
  createLightningStrike(x: number, y: number): EffectHandle {
    const id = `lightning_${this.effectCounter++}`;

    // Lightning bolt graphic
    const lightning = this.scene.add.graphics();
    lightning.lineStyle(4, 0xFFFFFF, 1);
    
    // Draw jagged lightning bolt
    const points = [];
    for (let i = 0; i < 8; i++) {
      points.push({
        x: (Math.random() - 0.5) * 20,
        y: i * -15
      });
    }
    
    lightning.beginPath();
    lightning.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      lightning.lineTo(points[i].x, points[i].y);
    }
    lightning.strokePath();
    
    lightning.x = x;
    lightning.y = y + 60;
    lightning.setBlendMode(Phaser.BlendModes.ADD);

    // Lightning flash
    const flash = this.scene.add.rectangle(x, y, 100, 120, 0xCCCCFF, 0.6);
    flash.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: [lightning, flash],
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });

    // Electric sparks
    const sparks = this.scene.add.particles(x, y, 'electric-particle', {
      scale: { start: 0.1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      tint: [0xFFFFFF, 0xCCCCFF, 0x8888FF],
      lifespan: 300,
      quantity: 8,
      speed: { min: 30, max: 80 },
      blendMode: 'ADD'
    });

    const handle: EffectHandle = {
      id,
      isPlaying: true,
      destroy: () => {
        lightning.destroy();
        flash.destroy();
        sparks.destroy();
        this.activeEffects.delete(id);
      },
      setLocation: (newX: number, newY: number) => {
        lightning.x = newX;
        lightning.y = newY + 60;
        flash.x = newX;
        flash.y = newY;
        sparks.x = newX;
        sparks.y = newY;
      },
      setScale: (scale: number) => {
        lightning.setScale(scale);
        flash.setScale(scale);
        sparks.setScale(scale);
      },
      setRotation: (rotation: number) => {
        lightning.rotation = rotation;
      }
    };

    this.scene.time.delayedCall(500, () => {
      if (this.activeEffects.has(id)) {
        handle.destroy();
      }
    });

    this.activeEffects.set(id, handle);
    return handle;
  }

  // Clean up all effects
  destroyAllEffects(): void {
    Array.from(this.activeEffects.values()).forEach(effect => {
      effect.destroy();
    });
    this.activeEffects.clear();
  }

  // Get number of active effects
  getActiveEffectCount(): number {
    return this.activeEffects.size;
  }
}