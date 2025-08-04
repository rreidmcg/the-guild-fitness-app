import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface PhaserBattleSceneProps {
  isActive: boolean;
  playerStats: {
    currentHp: number;
    maxHp: number;
    currentMp: number;
    maxMp: number;
    strength: number;
    agility: number;
    username?: string;
    skinColor?: string;
    hairColor?: string;
    gender?: string;
  };
  monster: {
    name: string;
    currentHp: number;
    maxHp: number;
    image?: string;
    level?: number;
  };
  onBattleAction?: (action: 'attack' | 'flee') => void;
  battleEvents?: {
    playerAttack?: { damage: number; critical?: boolean };
    monsterAttack?: { damage: number };
    victory?: boolean;
    defeat?: boolean;
  };
  battleBackground?: string;
}

export function PhaserBattleScene({ 
  isActive, 
  playerStats, 
  monster, 
  onBattleAction, 
  battleEvents,
  battleBackground 
}: PhaserBattleSceneProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<Phaser.Scene | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 400,
      parent: 'phaser-battle-container',
      backgroundColor: battleBackground || '#1a2e1a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    gameRef.current = new Phaser.Game(config);

    function preload(this: Phaser.Scene) {
      // Create advanced player avatar based on stats
      const playerGraphics = this.add.graphics();
      
      // Create player avatar with body, head, and equipment
      playerGraphics.fillStyle(0x8B4513); // Brown skin tone
      playerGraphics.fillCircle(40, 20, 12); // Head
      playerGraphics.fillRect(32, 32, 16, 24); // Body
      playerGraphics.fillRect(28, 40, 8, 16); // Left arm
      playerGraphics.fillRect(44, 40, 8, 16); // Right arm
      playerGraphics.fillRect(34, 56, 6, 20); // Left leg
      playerGraphics.fillRect(40, 56, 6, 20); // Right leg
      
      // Add equipment based on level/stats
      if (playerStats.strength > 2) {
        playerGraphics.fillStyle(0x666666); // Sword
        playerGraphics.fillRect(50, 35, 3, 15);
        playerGraphics.fillStyle(0x8B4513); // Handle
        playerGraphics.fillRect(49, 50, 5, 6);
      }
      
      // Hair color
      const hairColor = playerStats.hairColor === 'blonde' ? 0xFFD700 : 
                       playerStats.hairColor === 'brown' ? 0x8B4513 :
                       playerStats.hairColor === 'black' ? 0x000000 : 0x8B4513;
      playerGraphics.fillStyle(hairColor);
      playerGraphics.fillRect(32, 8, 16, 8); // Hair
      
      playerGraphics.generateTexture('player-sprite', 80, 80);
      playerGraphics.destroy();
      
      // Create dynamic monster sprite
      const monsterGraphics = this.add.graphics();
      
      // Different monster appearances based on name
      if (monster.name.toLowerCase().includes('slime')) {
        // Slime appearance
        monsterGraphics.fillStyle(0x00ff00);
        monsterGraphics.fillEllipse(50, 40, 60, 40);
        monsterGraphics.fillStyle(0x008800);
        monsterGraphics.fillEllipse(35, 25, 8, 8); // Left eye
        monsterGraphics.fillEllipse(65, 25, 8, 8); // Right eye
      } else if (monster.name.toLowerCase().includes('rat')) {
        // Rat appearance
        monsterGraphics.fillStyle(0x8B4513);
        monsterGraphics.fillEllipse(50, 45, 50, 25); // Body
        monsterGraphics.fillEllipse(30, 35, 20, 15); // Head
        monsterGraphics.fillStyle(0x000000);
        monsterGraphics.fillCircle(25, 30, 2); // Eye
        monsterGraphics.fillCircle(25, 40, 1); // Nose
        // Tail
        monsterGraphics.fillStyle(0x8B4513);
        monsterGraphics.fillRect(75, 45, 15, 3);
      } else if (monster.name.toLowerCase().includes('spider')) {
        // Spider appearance
        monsterGraphics.fillStyle(0x333333);
        monsterGraphics.fillEllipse(50, 40, 40, 30); // Body
        // Legs
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const legX = 50 + Math.cos(angle) * 25;
          const legY = 40 + Math.sin(angle) * 20;
          monsterGraphics.fillRect(legX, legY, 2, 15);
        }
        monsterGraphics.fillStyle(0xff0000);
        monsterGraphics.fillCircle(45, 35, 2); // Eyes
        monsterGraphics.fillCircle(55, 35, 2);
      } else if (monster.name.toLowerCase().includes('goblin')) {
        // Goblin appearance
        monsterGraphics.fillStyle(0x228B22); // Green skin
        monsterGraphics.fillCircle(50, 25, 12); // Head
        monsterGraphics.fillRect(42, 37, 16, 24); // Body
        monsterGraphics.fillRect(38, 45, 8, 16); // Arms
        monsterGraphics.fillRect(54, 45, 8, 16);
        monsterGraphics.fillRect(44, 61, 6, 20); // Legs
        monsterGraphics.fillRect(50, 61, 6, 20);
        // Weapon
        monsterGraphics.fillStyle(0x666666);
        monsterGraphics.fillRect(65, 40, 3, 12);
      } else {
        // Generic monster
        monsterGraphics.fillStyle(0xff4a4a);
        monsterGraphics.fillRect(25, 25, 50, 50);
        monsterGraphics.fillStyle(0xffffff);
        monsterGraphics.fillCircle(40, 40, 3); // Eyes
        monsterGraphics.fillCircle(60, 40, 3);
      }
      
      monsterGraphics.generateTexture('monster-sprite', 100, 80);
      monsterGraphics.destroy();
      
      // Create particle textures
      this.add.graphics().fillStyle(0xffd700).fillCircle(5, 5, 5).generateTexture('gold-particle', 10, 10);
      this.add.graphics().fillStyle(0xff0000).fillCircle(3, 3, 3).generateTexture('blood-particle', 6, 6);
      this.add.graphics().fillStyle(0x00ffff).fillCircle(4, 4, 4).generateTexture('magic-particle', 8, 8);
      
      // Create background elements
      const bgGraphics = this.add.graphics();
      bgGraphics.fillStyle(0x2a4a2a);
      bgGraphics.fillRect(0, 0, 800, 400);
      
      // Add environment details
      if (battleBackground?.includes('forest') || monster.name.toLowerCase().includes('spider')) {
        // Forest background with trees
        bgGraphics.fillStyle(0x4a4a2a);
        for (let i = 0; i < 5; i++) {
          const x = i * 160 + 80;
          bgGraphics.fillRect(x, 300, 20, 100); // Tree trunk
          bgGraphics.fillStyle(0x228B22);
          bgGraphics.fillCircle(x + 10, 280, 30); // Tree leaves
          bgGraphics.fillStyle(0x4a4a2a);
        }
      } else if (monster.name.toLowerCase().includes('rat')) {
        // Cave background
        bgGraphics.fillStyle(0x333333);
        bgGraphics.fillEllipse(400, 200, 600, 300);
        bgGraphics.fillStyle(0x222222);
        bgGraphics.fillEllipse(400, 250, 500, 200);
      } else if (monster.name.toLowerCase().includes('slime')) {
        // Cavern with stalactites
        bgGraphics.fillStyle(0x4a4a4a);
        for (let i = 0; i < 8; i++) {
          const x = i * 100 + 50;
          bgGraphics.fillTriangle(x, 0, x - 15, 80, x + 15, 80);
        }
      }
      
      bgGraphics.generateTexture('battle-bg', 800, 400);
      bgGraphics.destroy();
    }

    function create(this: Phaser.Scene) {
      sceneRef.current = this;
      
      // Create battle arena background
      const bg = this.add.image(400, 200, 'battle-bg');
      
      // Add atmospheric particles
      const atmosphereParticles = this.add.particles(0, 0, 'magic-particle', {
        x: { min: 0, max: 800 },
        y: { min: 0, max: 400 },
        scale: { start: 0.1, end: 0.3 },
        alpha: { start: 0.3, end: 0 },
        lifespan: 3000,
        frequency: 500,
        quantity: 1
      });
      
      // Create player sprite (left side) with idle animation
      const playerSprite = this.add.image(200, 280, 'player-sprite')
        .setDisplaySize(80, 80)
        .setData('type', 'player')
        .setData('originalX', 200)
        .setData('originalY', 280);
      
      // Add subtle idle animation to player
      this.tweens.add({
        targets: playerSprite,
        y: playerSprite.y - 5,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Create monster sprite (right side) with menacing presence
      const monsterSprite = this.add.image(600, 280, 'monster-sprite')
        .setDisplaySize(100, 80)
        .setData('type', 'monster')
        .setData('originalX', 600)
        .setData('originalY', 280);
      
      // Add menacing idle animation to monster
      this.tweens.add({
        targets: monsterSprite,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Power2'
      });
      
      // Enhanced HP bars with borders and gradients
      const playerHpBg = this.add.rectangle(200, 340, 140, 16, 0x333333).setStrokeStyle(2, 0x666666);
      const playerHpBar = this.add.rectangle(200, 340, 136, 12, 0x00ff00);
      const playerMpBg = this.add.rectangle(200, 360, 140, 12, 0x333333).setStrokeStyle(2, 0x666666);
      const playerMpBar = this.add.rectangle(200, 360, 136, 8, 0x0066ff);
      
      // Monster HP bar
      const monsterHpBg = this.add.rectangle(600, 180, 140, 16, 0x333333).setStrokeStyle(2, 0x666666);
      const monsterHpBar = this.add.rectangle(600, 180, 136, 12, 0xff0000);
      
      // Enhanced labels with styling
      this.add.text(200, 380, `${playerStats.username || 'Hero'} (Lv.${Math.floor(playerStats.strength + playerStats.agility)})`, { 
        fontSize: '12px', 
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      this.add.text(600, 160, `${monster.name} (Lv.${monster.level || 1})`, { 
        fontSize: '12px', 
        color: '#ffaaaa',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // HP/MP text overlays
      const playerHpText = this.add.text(200, 340, `${playerStats.currentHp}/${playerStats.maxHp}`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      
      const playerMpText = this.add.text(200, 360, `${playerStats.currentMp}/${playerStats.maxMp}`, {
        fontSize: '8px',
        color: '#aaaaff',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      
      const monsterHpText = this.add.text(600, 180, `${monster.currentHp}/${monster.maxHp}`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      
      // Store references for updates
      this.data.set('playerSprite', playerSprite);
      this.data.set('monsterSprite', monsterSprite);
      this.data.set('playerHpBar', playerHpBar);
      this.data.set('monsterHpBar', monsterHpBar);
      this.data.set('playerMpBar', playerMpBar);
      this.data.set('playerHpText', playerHpText);
      this.data.set('playerMpText', playerMpText);
      this.data.set('monsterHpText', monsterHpText);
      this.data.set('atmosphereParticles', atmosphereParticles);
      
      // Update HP bars initially
      updateHpBars.call(this);
    }

    function update(this: Phaser.Scene) {
      // Update HP bars if stats changed
      updateHpBars.call(this);
    }
    
    function updateHpBars(this: Phaser.Scene) {
      const playerHpBar = this.data.get('playerHpBar');
      const monsterHpBar = this.data.get('monsterHpBar');
      const playerMpBar = this.data.get('playerMpBar');
      const playerHpText = this.data.get('playerHpText');
      const playerMpText = this.data.get('playerMpText');
      const monsterHpText = this.data.get('monsterHpText');
      
      if (playerHpBar && playerHpText) {
        const playerHpPercent = Math.max(0, playerStats.currentHp / playerStats.maxHp);
        playerHpBar.setScale(playerHpPercent, 1);
        
        // Dynamic HP color based on percentage
        const healthColor = playerHpPercent > 0.6 ? 0x00ff00 : 
                           playerHpPercent > 0.3 ? 0xffaa00 : 0xff0000;
        playerHpBar.setFillStyle(healthColor);
        playerHpText.setText(`${playerStats.currentHp}/${playerStats.maxHp}`);
      }
      
      if (playerMpBar && playerMpText) {
        const playerMpPercent = Math.max(0, playerStats.currentMp / playerStats.maxMp);
        playerMpBar.setScale(playerMpPercent, 1);
        playerMpText.setText(`${playerStats.currentMp}/${playerStats.maxMp}`);
      }
      
      if (monsterHpBar && monsterHpText) {
        const monsterHpPercent = Math.max(0, monster.currentHp / monster.maxHp);
        monsterHpBar.setScale(monsterHpPercent, 1);
        monsterHpText.setText(`${monster.currentHp}/${monster.maxHp}`);
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isActive]);

  // Handle battle events (animations)
  useEffect(() => {
    if (!sceneRef.current || !battleEvents) return;

    const scene = sceneRef.current;
    
    if (battleEvents.playerAttack) {
      // Player attack animation with weapon effects
      const playerSprite = scene.data.get('playerSprite');
      const monsterSprite = scene.data.get('monsterSprite');
      
      if (playerSprite && monsterSprite) {
        // Camera shake for impact
        scene.cameras.main.shake(200, 0.01);
        
        // Player lunge attack animation
        const originalX = playerSprite.getData('originalX');
        scene.tweens.add({
          targets: playerSprite,
          x: originalX + 80,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            // Weapon slash effect
            createSlashEffect(scene, monsterSprite.x - 30, monsterSprite.y);
            
            // Return to position
            scene.tweens.add({
              targets: playerSprite,
              x: originalX,
              scaleX: 1,
              scaleY: 1,
              duration: 200,
              ease: 'Power2'
            });
          }
        });
        
        // Monster hit reaction - stagger and flash
        scene.tweens.add({
          targets: monsterSprite,
          x: monsterSprite.getData('originalX') + 20,
          tint: 0xff0000,
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            monsterSprite.clearTint();
            monsterSprite.x = monsterSprite.getData('originalX');
          }
        });
        
        // Blood particles on hit
        const bloodParticles = scene.add.particles(monsterSprite.x, monsterSprite.y, 'blood-particle', {
          scale: { start: 0.5, end: 0 },
          speed: { min: 50, max: 150 },
          lifespan: 800,
          quantity: battleEvents.playerAttack.critical ? 15 : 8,
          alpha: { start: 0.8, end: 0 }
        });
        
        scene.time.delayedCall(1000, () => {
          bloodParticles.destroy();
        });
        
        // Enhanced damage number with critical effects
        showDamageNumber(scene, monsterSprite.x, monsterSprite.y - 40, battleEvents.playerAttack.damage, battleEvents.playerAttack.critical);
        
        // Critical hit effects
        if (battleEvents.playerAttack.critical) {
          // Screen flash for critical
          const flash = scene.add.rectangle(400, 200, 800, 400, 0xffff00, 0.3);
          scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
          });
          
          // Critical text
          const critText = scene.add.text(400, 100, 'CRITICAL HIT!', {
            fontSize: '32px',
            color: '#ffff00',
            fontStyle: 'bold',
            stroke: '#ff0000',
            strokeThickness: 3
          }).setOrigin(0.5);
          
          scene.tweens.add({
            targets: critText,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            y: critText.y - 50,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => critText.destroy()
          });
        }
      }
    }
    
    if (battleEvents.monsterAttack) {
      // Monster attack animation with special effects
      const playerSprite = scene.data.get('playerSprite');
      const monsterSprite = scene.data.get('monsterSprite');
      
      if (playerSprite && monsterSprite) {
        // Monster attack windup
        const originalX = monsterSprite.getData('originalX');
        scene.tweens.add({
          targets: monsterSprite,
          scaleX: 1.3,
          scaleY: 0.8,
          duration: 100,
          onComplete: () => {
            // Monster lunge
            scene.tweens.add({
              targets: monsterSprite,
              x: originalX - 80,
              scaleX: 1.5,
              scaleY: 1.5,
              duration: 200,
              ease: 'Power3',
              onComplete: () => {
                // Return to position
                scene.tweens.add({
                  targets: monsterSprite,
                  x: originalX,
                  scaleX: 1,
                  scaleY: 1,
                  duration: 300,
                  ease: 'Bounce'
                });
              }
            });
          }
        });
        
        // Player hit reaction
        const playerOriginalX = playerSprite.getData('originalX');
        scene.tweens.add({
          targets: playerSprite,
          x: playerOriginalX - 15,
          tint: 0xff4444,
          duration: 150,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            playerSprite.clearTint();
            playerSprite.x = playerOriginalX;
          }
        });
        
        // Impact particles
        const impactParticles = scene.add.particles(playerSprite.x, playerSprite.y, 'blood-particle', {
          scale: { start: 0.3, end: 0 },
          speed: { min: 30, max: 100 },
          lifespan: 600,
          quantity: 6,
          alpha: { start: 0.6, end: 0 }
        });
        
        scene.time.delayedCall(800, () => {
          impactParticles.destroy();
        });
        
        // Damage number
        showDamageNumber(scene, playerSprite.x, playerSprite.y - 30, battleEvents.monsterAttack.damage);
      }
    }
    
    if (battleEvents.victory) {
      // Epic victory celebration
      const playerSprite = scene.data.get('playerSprite');
      const monsterSprite = scene.data.get('monsterSprite');
      
      // Monster defeat animation
      if (monsterSprite) {
        scene.tweens.add({
          targets: monsterSprite,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          rotation: Math.PI,
          duration: 1000,
          ease: 'Power2'
        });
      }
      
      // Player victory pose
      if (playerSprite) {
        scene.tweens.add({
          targets: playerSprite,
          scaleX: 1.2,
          scaleY: 1.2,
          y: playerSprite.y - 20,
          duration: 1000,
          ease: 'Bounce'
        });
      }
      
      // Victory particles explosion
      const victoryParticles = scene.add.particles(400, 200, 'gold-particle', {
        scale: { start: 0.8, end: 0 },
        tint: [0xffd700, 0xffff00, 0xff8800, 0xffffff],
        speed: { min: 100, max: 300 },
        lifespan: 2000,
        quantity: 20,
        frequency: 100,
        alpha: { start: 1, end: 0 }
      });
      
      // Victory text
      const victoryText = scene.add.text(400, 150, 'VICTORY!', {
        fontSize: '48px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      scene.tweens.add({
        targets: victoryText,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        y: victoryText.y - 100,
        duration: 3000,
        ease: 'Power2'
      });
      
      scene.time.delayedCall(3000, () => {
        victoryParticles.destroy();
        victoryText.destroy();
      });
    }
    
    if (battleEvents.defeat) {
      // Player defeat animation
      const playerSprite = scene.data.get('playerSprite');
      
      if (playerSprite) {
        scene.tweens.add({
          targets: playerSprite,
          alpha: 0.5,
          scaleX: 0.8,
          scaleY: 0.8,
          tint: 0x666666,
          duration: 1500,
          ease: 'Power2'
        });
      }
      
      // Defeat text
      const defeatText = scene.add.text(400, 150, 'DEFEAT...', {
        fontSize: '36px',
        color: '#ff4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      scene.tweens.add({
        targets: defeatText,
        alpha: 0,
        y: defeatText.y + 50,
        duration: 2000,
        ease: 'Power2'
      });
    }
    
  }, [battleEvents]);

  function createSlashEffect(scene: Phaser.Scene, x: number, y: number) {
    // Create a slash line effect
    const slash = scene.add.graphics();
    slash.lineStyle(4, 0xffffff, 0.8);
    slash.beginPath();
    slash.moveTo(x - 20, y - 20);
    slash.lineTo(x + 20, y + 20);
    slash.strokePath();
    
    // Animate slash
    scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => slash.destroy()
    });
  }

  function showDamageNumber(scene: Phaser.Scene, x: number, y: number, damage: number, critical?: boolean) {
    const color = critical ? '#ffff00' : '#ffffff';
    const fontSize = critical ? '28px' : '20px';
    const text = critical ? `CRIT! ${damage}` : `-${damage}`;
    
    const damageText = scene.add.text(x, y, text, {
      fontSize,
      color,
      fontStyle: 'bold',
      stroke: critical ? '#ff0000' : '#000000',
      strokeThickness: critical ? 4 : 2
    }).setOrigin(0.5);
    
    // Enhanced damage number animation
    const targetY = y - (critical ? 80 : 60);
    const targetX = x + (Math.random() - 0.5) * 40; // Random horizontal drift
    
    scene.tweens.add({
      targets: damageText,
      x: targetX,
      y: targetY,
      scaleX: critical ? 1.5 : 1.2,
      scaleY: critical ? 1.5 : 1.2,
      alpha: 0,
      duration: critical ? 1500 : 1200,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
    });
    
    // Add bouncy scale effect
    scene.tweens.add({
      targets: damageText,
      scaleX: critical ? 1.8 : 1.4,
      scaleY: critical ? 1.8 : 1.4,
      duration: 150,
      yoyo: true,
      ease: 'Back'
    });
  }

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full">
      <div 
        id="phaser-battle-container" 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Enhanced Battle Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-6">
        <button
          onClick={() => onBattleAction?.('attack')}
          className="relative bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-red-400"
          style={{ 
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
          }}
        >
          <span className="flex items-center gap-2">
            ⚔️ <span className="font-mono">ATTACK</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-20 rounded-xl"></div>
        </button>
        
        <button
          onClick={() => onBattleAction?.('flee')}
          className="relative bg-gradient-to-b from-gray-500 to-gray-700 hover:from-gray-400 hover:to-gray-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-gray-400"
          style={{ 
            boxShadow: '0 0 20px rgba(107, 114, 128, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
          }}
        >
          <span className="flex items-center gap-2">
            🏃 <span className="font-mono">FLEE</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-20 rounded-xl"></div>
        </button>
      </div>
      
      {/* Battle Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-black bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-600">
          <p className="text-white text-sm font-mono">
            🎮 <span className="text-yellow-400">ENHANCED BATTLE MODE</span> 🎮
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Experience epic animations and visual effects!
          </p>
        </div>
      </div>
    </div>
  );
}