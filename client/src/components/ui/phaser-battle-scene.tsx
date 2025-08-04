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
  };
  monster: {
    name: string;
    currentHp: number;
    maxHp: number;
    image?: string;
  };
  onBattleAction?: (action: 'attack' | 'flee') => void;
  battleEvents?: {
    playerAttack?: { damage: number; critical?: boolean };
    monsterAttack?: { damage: number };
    victory?: boolean;
    defeat?: boolean;
  };
}

export function PhaserBattleScene({ 
  isActive, 
  playerStats, 
  monster, 
  onBattleAction, 
  battleEvents 
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
      backgroundColor: '#1a1a2e',
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
      // Create colored rectangles for player and monster
      this.add.rectangle(0, 0, 10, 10, 0x00ff00); // For generating textures
      
      // Generate simple colored sprites
      this.add.graphics()
        .fillStyle(0x4a9eff)
        .fillRect(0, 0, 80, 80)
        .generateTexture('player-sprite', 80, 80);
        
      this.add.graphics()
        .fillStyle(0xff4a4a)
        .fillRect(0, 0, 100, 80)
        .generateTexture('monster-sprite', 100, 80);
    }

    function create(this: Phaser.Scene) {
      sceneRef.current = this;
      
      // Create battle arena background
      const bg = this.add.rectangle(400, 200, 800, 400, 0x2a2a3e);
      
      // Create player sprite (left side)
      const playerSprite = this.add.image(200, 250, 'player-sprite')
        .setDisplaySize(60, 60)
        .setData('type', 'player');
      
      // Create monster sprite (right side)  
      const monsterSprite = this.add.image(600, 230, 'monster-sprite')
        .setDisplaySize(80, 60)
        .setData('type', 'monster');
      
      // Player HP bar
      const playerHpBg = this.add.rectangle(200, 320, 120, 12, 0x333333);
      const playerHpBar = this.add.rectangle(200, 320, 120, 8, 0x00ff00);
      
      // Monster HP bar  
      const monsterHpBg = this.add.rectangle(600, 160, 120, 12, 0x333333);
      const monsterHpBar = this.add.rectangle(600, 160, 120, 8, 0xff0000);
      
      // Labels
      this.add.text(200, 340, 'Player', { 
        fontSize: '14px', 
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
      
      this.add.text(600, 140, monster.name, { 
        fontSize: '14px', 
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
      
      // Store references for updates
      this.data.set('playerSprite', playerSprite);
      this.data.set('monsterSprite', monsterSprite);
      this.data.set('playerHpBar', playerHpBar);
      this.data.set('monsterHpBar', monsterHpBar);
      
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
      
      if (playerHpBar) {
        const playerHpPercent = playerStats.currentHp / playerStats.maxHp;
        playerHpBar.setScale(playerHpPercent, 1);
        // Change color based on HP percentage using fillColor for rectangles
        const healthColor = playerHpPercent > 0.5 ? 0x00ff00 : (playerHpPercent > 0.25 ? 0xffaa00 : 0xff0000);
        playerHpBar.setFillStyle(healthColor);
      }
      
      if (monsterHpBar) {
        const monsterHpPercent = monster.currentHp / monster.maxHp;
        monsterHpBar.setScale(monsterHpPercent, 1);
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
      // Player attack animation
      const playerSprite = scene.data.get('playerSprite');
      const monsterSprite = scene.data.get('monsterSprite');
      
      if (playerSprite && monsterSprite) {
        // Flash attack animation
        scene.tweens.add({
          targets: playerSprite,
          x: playerSprite.x + 50,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        });
        
        // Monster hit flash
        scene.tweens.add({
          targets: monsterSprite,
          tint: 0xff0000,
          duration: 100,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            monsterSprite.clearTint();
          }
        });
        
        // Damage number
        showDamageNumber(scene, 600, 200, battleEvents.playerAttack.damage, battleEvents.playerAttack.critical);
      }
    }
    
    if (battleEvents.monsterAttack) {
      // Monster attack animation
      const playerSprite = scene.data.get('playerSprite');
      const monsterSprite = scene.data.get('monsterSprite');
      
      if (playerSprite && monsterSprite) {
        // Monster attack animation
        scene.tweens.add({
          targets: monsterSprite,
          x: monsterSprite.x - 50,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        });
        
        // Player hit flash
        scene.tweens.add({
          targets: playerSprite,
          tint: 0xff0000,
          duration: 100,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            playerSprite.clearTint();
          }
        });
        
        // Damage number
        showDamageNumber(scene, 200, 220, battleEvents.monsterAttack.damage);
      }
    }
    
    if (battleEvents.victory) {
      // Victory particles
      const particles = scene.add.particles(400, 200, 'player-sprite', {
        scale: { start: 0.1, end: 0 },
        tint: [0xffd700, 0xffff00, 0xff8800],
        lifespan: 1000,
        quantity: 5,
        frequency: 50
      });
      
      scene.time.delayedCall(2000, () => {
        particles.destroy();
      });
    }
    
  }, [battleEvents]);

  function showDamageNumber(scene: Phaser.Scene, x: number, y: number, damage: number, critical?: boolean) {
    const color = critical ? '#ffff00' : '#ffffff';
    const fontSize = critical ? '24px' : '18px';
    const text = critical ? `CRIT! ${damage}` : damage.toString();
    
    const damageText = scene.add.text(x, y, text, {
      fontSize,
      color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Animate damage number
    scene.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
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
      
      {/* Battle Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button
          onClick={() => onBattleAction?.('attack')}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          ⚔️ Attack
        </button>
        <button
          onClick={() => onBattleAction?.('flee')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          🏃 Flee
        </button>
      </div>
    </div>
  );
}