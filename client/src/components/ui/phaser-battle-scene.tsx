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
      // Create highly detailed player avatar based on stats and uploaded character style
      const playerGraphics = this.add.graphics();
      
      // Determine skin color
      const skinColor = playerStats.skinColor === 'light' ? 0xFFDBB5 : 
                       playerStats.skinColor === 'medium' ? 0xD4A574 :
                       playerStats.skinColor === 'dark' ? 0x8B6914 : 0xFFDBB5;
      
      // HEAD - More detailed with shading
      playerGraphics.fillStyle(skinColor);
      playerGraphics.fillEllipse(40, 22, 24, 22); // Main head shape
      
      // Head shading for depth
      playerGraphics.fillStyle(Phaser.Display.Color.GetColor32(
        Phaser.Display.Color.IntegerToRGB(skinColor).r * 0.8,
        Phaser.Display.Color.IntegerToRGB(skinColor).g * 0.8,
        Phaser.Display.Color.IntegerToRGB(skinColor).b * 0.8,
        255
      ));
      playerGraphics.fillEllipse(45, 25, 8, 6); // Right side shadow
      
      // FACIAL FEATURES
      playerGraphics.fillStyle(0x000000);
      playerGraphics.fillCircle(35, 20, 2); // Left eye
      playerGraphics.fillCircle(45, 20, 2); // Right eye
      playerGraphics.fillStyle(0xFFFFFF);
      playerGraphics.fillCircle(36, 19, 1); // Left eye highlight
      playerGraphics.fillCircle(46, 19, 1); // Right eye highlight
      
      // Nose and mouth
      playerGraphics.fillStyle(Phaser.Display.Color.GetColor32(
        Phaser.Display.Color.IntegerToRGB(skinColor).r * 0.9,
        Phaser.Display.Color.IntegerToRGB(skinColor).g * 0.9,
        Phaser.Display.Color.IntegerToRGB(skinColor).b * 0.9,
        255
      ));
      playerGraphics.fillCircle(40, 24, 1.5); // Nose
      playerGraphics.fillStyle(0x8B0000);
      playerGraphics.fillEllipse(40, 27, 4, 2); // Mouth
      
      // HAIR - More detailed and styled
      const hairColor = playerStats.hairColor === 'blonde' ? 0xFFD700 : 
                       playerStats.hairColor === 'brown' ? 0x8B4513 :
                       playerStats.hairColor === 'black' ? 0x2C1810 : 
                       playerStats.hairColor === 'red' ? 0xB22222 : 0x8B4513;
      
      playerGraphics.fillStyle(hairColor);
      // Multiple hair layers for volume and detail
      playerGraphics.fillEllipse(40, 12, 28, 16); // Main hair mass
      playerGraphics.fillEllipse(35, 10, 12, 8); // Left hair tuft
      playerGraphics.fillEllipse(45, 10, 12, 8); // Right hair tuft
      playerGraphics.fillEllipse(40, 8, 16, 6); // Top hair
      
      // Hair highlights
      const hairHighlight = Phaser.Display.Color.GetColor32(
        Math.min(255, Phaser.Display.Color.IntegerToRGB(hairColor).r * 1.3),
        Math.min(255, Phaser.Display.Color.IntegerToRGB(hairColor).g * 1.3),
        Math.min(255, Phaser.Display.Color.IntegerToRGB(hairColor).b * 1.3),
        255
      );
      playerGraphics.fillStyle(hairHighlight);
      playerGraphics.fillEllipse(38, 10, 8, 4); // Hair highlight
      playerGraphics.fillEllipse(42, 12, 6, 3); // Secondary highlight
      
      // NECK
      playerGraphics.fillStyle(skinColor);
      playerGraphics.fillRect(36, 32, 8, 6);
      
      // TORSO - Detailed with clothing
      // Base shirt/tunic
      const shirtColor = playerStats.strength > 2 ? 0x4169E1 : 0x8B4513; // Blue for warriors, brown for beginners
      playerGraphics.fillStyle(shirtColor);
      playerGraphics.fillRect(28, 38, 24, 28); // Main torso
      
      // Shirt details and shading
      playerGraphics.fillStyle(Phaser.Display.Color.GetColor32(
        Phaser.Display.Color.IntegerToRGB(shirtColor).r * 0.7,
        Phaser.Display.Color.IntegerToRGB(shirtColor).g * 0.7,
        Phaser.Display.Color.IntegerToRGB(shirtColor).b * 0.7,
        255
      ));
      playerGraphics.fillRect(46, 40, 6, 24); // Right side shadow
      playerGraphics.fillRect(30, 60, 20, 4); // Belt area
      
      // Belt
      playerGraphics.fillStyle(0x654321);
      playerGraphics.fillRect(30, 62, 20, 3);
      playerGraphics.fillStyle(0xFFD700);
      playerGraphics.fillRect(38, 61, 4, 5); // Belt buckle
      
      // ARMS - More anatomically correct
      playerGraphics.fillStyle(skinColor);
      // Left arm
      playerGraphics.fillEllipse(24, 45, 8, 16); // Upper arm
      playerGraphics.fillEllipse(22, 58, 6, 14); // Forearm
      playerGraphics.fillEllipse(20, 68, 8, 6); // Hand
      
      // Right arm  
      playerGraphics.fillEllipse(56, 45, 8, 16); // Upper arm
      playerGraphics.fillEllipse(58, 58, 6, 14); // Forearm
      playerGraphics.fillEllipse(60, 68, 8, 6); // Hand
      
      // Arm shading
      const armShadow = Phaser.Display.Color.GetColor32(
        Phaser.Display.Color.IntegerToRGB(skinColor).r * 0.8,
        Phaser.Display.Color.IntegerToRGB(skinColor).g * 0.8,
        Phaser.Display.Color.IntegerToRGB(skinColor).b * 0.8,
        255
      );
      playerGraphics.fillStyle(armShadow);
      playerGraphics.fillEllipse(26, 47, 4, 8); // Left arm shadow
      playerGraphics.fillEllipse(58, 47, 4, 8); // Right arm shadow
      
      // LEGS - Detailed with pants/leggings
      const pantsColor = 0x2F4F4F; // Dark slate gray
      playerGraphics.fillStyle(pantsColor);
      playerGraphics.fillRect(32, 66, 8, 22); // Left leg
      playerGraphics.fillRect(40, 66, 8, 22); // Right leg
      
      // Leg shading
      playerGraphics.fillStyle(Phaser.Display.Color.GetColor32(
        Phaser.Display.Color.IntegerToRGB(pantsColor).r * 0.7,
        Phaser.Display.Color.IntegerToRGB(pantsColor).g * 0.7,
        Phaser.Display.Color.IntegerToRGB(pantsColor).b * 0.7,
        255
      ));
      playerGraphics.fillRect(44, 68, 4, 18); // Right leg shadow
      
      // BOOTS
      playerGraphics.fillStyle(0x8B4513);
      playerGraphics.fillEllipse(36, 90, 12, 8); // Left boot
      playerGraphics.fillEllipse(44, 90, 12, 8); // Right boot
      
      // Boot details
      playerGraphics.fillStyle(0x654321);
      playerGraphics.fillRect(32, 88, 8, 2); // Left boot top
      playerGraphics.fillRect(40, 88, 8, 2); // Right boot top
      
      // EQUIPMENT based on stats
      if (playerStats.strength > 2) {
        // Detailed sword
        playerGraphics.fillStyle(0xC0C0C0); // Silver blade
        playerGraphics.fillRect(62, 35, 4, 20); // Blade
        playerGraphics.fillRect(63, 32, 2, 6); // Blade tip
        
        // Blade highlights
        playerGraphics.fillStyle(0xFFFFFF);
        playerGraphics.fillRect(62, 36, 1, 18); // Blade edge highlight
        
        // Crossguard
        playerGraphics.fillStyle(0x8B4513);
        playerGraphics.fillRect(60, 54, 8, 3);
        
        // Handle
        playerGraphics.fillStyle(0x654321);
        playerGraphics.fillRect(63, 56, 2, 8);
        
        // Pommel
        playerGraphics.fillStyle(0xFFD700);
        playerGraphics.fillCircle(64, 66, 3);
      }
      
      if (playerStats.agility > 2) {
        // Add a cape for agile characters
        playerGraphics.fillStyle(0x8B0000); // Dark red cape
        playerGraphics.fillEllipse(40, 42, 20, 24);
        
        // Cape shading
        playerGraphics.fillStyle(0x660000);
        playerGraphics.fillEllipse(45, 45, 12, 18);
      }
      
      playerGraphics.generateTexture('player-sprite', 80, 100);
      playerGraphics.destroy();
      
      // Create highly detailed dynamic monster sprite
      const monsterGraphics = this.add.graphics();
      
      // Different monster appearances based on name with enhanced detail
      if (monster.name.toLowerCase().includes('slime')) {
        // Enhanced Slime appearance
        const slimeColor = 0x32CD32; // Lime green
        const slimeShadow = 0x228B22; // Forest green
        
        // Main slime body with gradient effect
        monsterGraphics.fillStyle(slimeColor);
        monsterGraphics.fillEllipse(50, 45, 70, 50); // Main body
        
        // Slime shading and highlights
        monsterGraphics.fillStyle(slimeShadow);
        monsterGraphics.fillEllipse(60, 50, 40, 30); // Bottom shadow
        monsterGraphics.fillEllipse(55, 35, 20, 15); // Top shadow
        
        // Slime highlights
        monsterGraphics.fillStyle(0x90EE90); // Light green
        monsterGraphics.fillEllipse(40, 35, 25, 18); // Main highlight
        monsterGraphics.fillEllipse(35, 30, 12, 8); // Secondary highlight
        
        // Detailed eyes
        monsterGraphics.fillStyle(0x000000);
        monsterGraphics.fillEllipse(40, 30, 10, 12); // Left eye
        monsterGraphics.fillEllipse(60, 30, 10, 12); // Right eye
        
        // Eye highlights
        monsterGraphics.fillStyle(0xFFFFFF);
        monsterGraphics.fillCircle(42, 28, 3); // Left eye highlight
        monsterGraphics.fillCircle(62, 28, 3); // Right eye highlight
        
        // Mouth
        monsterGraphics.fillStyle(0x000000);
        monsterGraphics.fillEllipse(50, 42, 12, 6); // Mouth
        
        // Slime drips
        monsterGraphics.fillStyle(slimeColor);
        monsterGraphics.fillCircle(30, 65, 4); // Left drip
        monsterGraphics.fillCircle(70, 68, 3); // Right drip
        monsterGraphics.fillCircle(50, 70, 5); // Center drip
        
      } else if (monster.name.toLowerCase().includes('rat')) {
        // Enhanced Rat appearance
        const ratColor = 0x8B4513; // Saddle brown
        const ratShadow = 0x654321; // Dark brown
        
        // Main body
        monsterGraphics.fillStyle(ratColor);
        monsterGraphics.fillEllipse(55, 50, 60, 30); // Body
        monsterGraphics.fillEllipse(25, 40, 25, 20); // Head
        
        // Body shading
        monsterGraphics.fillStyle(ratShadow);
        monsterGraphics.fillEllipse(65, 55, 35, 18); // Body shadow
        monsterGraphics.fillEllipse(30, 45, 15, 12); // Head shadow
        
        // Detailed features
        monsterGraphics.fillStyle(0x000000);
        monsterGraphics.fillCircle(20, 35, 3); // Eye
        monsterGraphics.fillCircle(22, 45, 2); // Nose
        
        // Eye highlight
        monsterGraphics.fillStyle(0xFFFFFF);
        monsterGraphics.fillCircle(21, 34, 1); // Eye highlight
        
        // Ears
        monsterGraphics.fillStyle(ratColor);
        monsterGraphics.fillEllipse(15, 30, 8, 12); // Left ear
        monsterGraphics.fillEllipse(25, 28, 8, 12); // Right ear
        
        // Ear shadows
        monsterGraphics.fillStyle(ratShadow);
        monsterGraphics.fillEllipse(16, 32, 4, 6); // Left ear shadow
        monsterGraphics.fillEllipse(26, 30, 4, 6); // Right ear shadow
        
        // Detailed tail with segments
        monsterGraphics.fillStyle(ratColor);
        monsterGraphics.fillEllipse(85, 50, 15, 5); // Tail base
        monsterGraphics.fillEllipse(95, 48, 12, 4); // Tail middle
        monsterGraphics.fillEllipse(103, 46, 10, 3); // Tail tip
        
        // Whiskers
        monsterGraphics.lineStyle(1, 0x000000);
        monsterGraphics.beginPath();
        monsterGraphics.moveTo(15, 42);
        monsterGraphics.lineTo(5, 40);
        monsterGraphics.moveTo(15, 45);
        monsterGraphics.lineTo(5, 45);
        monsterGraphics.strokePath();
        
      } else if (monster.name.toLowerCase().includes('spider')) {
        // Enhanced Spider appearance
        const spiderColor = 0x2F2F2F; // Dark gray
        const spiderHighlight = 0x4F4F4F; // Light gray
        
        // Main body segments
        monsterGraphics.fillStyle(spiderColor);
        monsterGraphics.fillEllipse(50, 45, 45, 35); // Abdomen
        monsterGraphics.fillEllipse(50, 30, 30, 25); // Cephalothorax
        
        // Body shading and details
        monsterGraphics.fillStyle(spiderHighlight);
        monsterGraphics.fillEllipse(45, 35, 15, 12); // Cephalothorax highlight
        monsterGraphics.fillEllipse(40, 50, 20, 15); // Abdomen highlight
        
        // Detailed legs (8 legs)
        monsterGraphics.lineStyle(3, spiderColor);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 4) * Math.PI;
          const side = i < 4 ? -1 : 1;
          const legLength = 25 + (i % 2) * 5;
          const startX = 50 + side * 15;
          const startY = 35 + (i % 4) * 3;
          const endX = startX + Math.cos(angle) * legLength * side;
          const endY = startY + Math.sin(angle) * legLength;
          
          // Leg segments
          monsterGraphics.beginPath();
          monsterGraphics.moveTo(startX, startY);
          monsterGraphics.lineTo(startX + Math.cos(angle) * (legLength * 0.6) * side, startY + Math.sin(angle) * (legLength * 0.6));
          monsterGraphics.lineTo(endX, endY);
          monsterGraphics.strokePath();
        }
        
        // Multiple eyes
        monsterGraphics.fillStyle(0xFF0000); // Red eyes
        monsterGraphics.fillCircle(45, 25, 3); // Main left eye
        monsterGraphics.fillCircle(55, 25, 3); // Main right eye
        monsterGraphics.fillCircle(42, 28, 2); // Secondary left eye
        monsterGraphics.fillCircle(58, 28, 2); // Secondary right eye
        
        // Eye highlights
        monsterGraphics.fillStyle(0xFFFFFF);
        monsterGraphics.fillCircle(46, 24, 1);
        monsterGraphics.fillCircle(56, 24, 1);
        
        // Fangs
        monsterGraphics.fillStyle(0xFFFFFF);
        monsterGraphics.fillTriangle(48, 32, 46, 38, 50, 38); // Left fang
        monsterGraphics.fillTriangle(52, 32, 50, 38, 54, 38); // Right fang
        
      } else if (monster.name.toLowerCase().includes('goblin')) {
        // Enhanced Goblin appearance
        const goblinSkin = 0x228B22; // Forest green
        const goblinShadow = 0x006400; // Dark green
        
        // Head with proper shading
        monsterGraphics.fillStyle(goblinSkin);
        monsterGraphics.fillEllipse(50, 25, 20, 18); // Head
        
        // Head shading
        monsterGraphics.fillStyle(goblinShadow);
        monsterGraphics.fillEllipse(55, 28, 8, 6); // Head shadow
        
        // Large pointed ears
        monsterGraphics.fillStyle(goblinSkin);
        monsterGraphics.fillTriangle(35, 20, 30, 15, 35, 25); // Left ear
        monsterGraphics.fillTriangle(65, 20, 70, 15, 65, 25); // Right ear
        
        // Detailed torso
        monsterGraphics.fillStyle(0x8B4513); // Brown tunic
        monsterGraphics.fillRect(40, 35, 20, 30); // Torso
        
        // Torso shading
        monsterGraphics.fillStyle(0x654321);
        monsterGraphics.fillRect(55, 37, 5, 26); // Right side shadow
        
        // Arms with muscle definition
        monsterGraphics.fillStyle(goblinSkin);
        monsterGraphics.fillEllipse(32, 45, 12, 20); // Left arm
        monsterGraphics.fillEllipse(68, 45, 12, 20); // Right arm
        
        // Arm shading
        monsterGraphics.fillStyle(goblinShadow);
        monsterGraphics.fillEllipse(35, 48, 6, 12); // Left arm shadow
        monsterGraphics.fillEllipse(71, 48, 6, 12); // Right arm shadow
        
        // Legs
        monsterGraphics.fillStyle(0x2F4F4F); // Dark pants
        monsterGraphics.fillRect(42, 65, 7, 25); // Left leg
        monsterGraphics.fillRect(51, 65, 7, 25); // Right leg
        
        // Facial features
        monsterGraphics.fillStyle(0xFF0000); // Red eyes
        monsterGraphics.fillCircle(45, 22, 2); // Left eye
        monsterGraphics.fillCircle(55, 22, 2); // Right eye
        
        // Ugly goblin nose
        monsterGraphics.fillStyle(goblinShadow);
        monsterGraphics.fillTriangle(50, 25, 48, 30, 52, 30); // Nose
        
        // Nasty grin
        monsterGraphics.fillStyle(0x000000);
        monsterGraphics.fillEllipse(50, 32, 8, 3); // Mouth
        
        // Sharp teeth
        monsterGraphics.fillStyle(0xFFFFFF);
        monsterGraphics.fillTriangle(47, 32, 46, 35, 48, 35); // Left tooth
        monsterGraphics.fillTriangle(53, 32, 52, 35, 54, 35); // Right tooth
        
        // Detailed weapon (crude club)
        monsterGraphics.fillStyle(0x8B4513);
        monsterGraphics.fillRect(75, 40, 5, 25); // Handle
        monsterGraphics.fillEllipse(77, 35, 12, 10); // Club head
        
        // Weapon details
        monsterGraphics.fillStyle(0x654321);
        monsterGraphics.fillEllipse(79, 37, 6, 4); // Club shadow
        
      } else {
        // Enhanced Generic Monster (Orc-like creature)
        const monsterColor = 0xB22222; // Fire brick red
        const monsterShadow = 0x8B0000; // Dark red
        
        // Main body with muscle definition
        monsterGraphics.fillStyle(monsterColor);
        monsterGraphics.fillRect(35, 35, 30, 40); // Torso
        monsterGraphics.fillEllipse(50, 25, 25, 20); // Head
        
        // Body shading
        monsterGraphics.fillStyle(monsterShadow);
        monsterGraphics.fillRect(55, 37, 10, 36); // Torso shadow
        monsterGraphics.fillEllipse(57, 28, 8, 6); // Head shadow
        
        // Muscular arms
        monsterGraphics.fillStyle(monsterColor);
        monsterGraphics.fillEllipse(25, 45, 15, 25); // Left arm
        monsterGraphics.fillEllipse(75, 45, 15, 25); // Right arm
        
        // Arm shading
        monsterGraphics.fillStyle(monsterShadow);
        monsterGraphics.fillEllipse(28, 48, 8, 15); // Left arm shadow
        monsterGraphics.fillEllipse(78, 48, 8, 15); // Right arm shadow
        
        // Legs
        monsterGraphics.fillStyle(0x2F4F4F); // Dark pants
        monsterGraphics.fillRect(40, 75, 8, 25); // Left leg
        monsterGraphics.fillRect(52, 75, 8, 25); // Right leg
        
        // Fierce eyes
        monsterGraphics.fillStyle(0xFFFF00); // Glowing yellow eyes
        monsterGraphics.fillCircle(43, 22, 4); // Left eye
        monsterGraphics.fillCircle(57, 22, 4); // Right eye
        
        // Pupil
        monsterGraphics.fillStyle(0x000000);
        monsterGraphics.fillCircle(43, 22, 2); // Left pupil
        monsterGraphics.fillCircle(57, 22, 2); // Right pupil
        
        // Snarling mouth
        monsterGraphics.fillStyle(0x000000);
        monsterGraphics.fillEllipse(50, 32, 12, 6); // Mouth
        
        // Sharp fangs
        monsterGraphics.fillStyle(0xFFFFFF);
        monsterGraphics.fillTriangle(46, 32, 44, 38, 48, 38); // Left fang
        monsterGraphics.fillTriangle(54, 32, 52, 38, 56, 38); // Right fang
        
        // Horns
        monsterGraphics.fillStyle(0x654321);
        monsterGraphics.fillTriangle(42, 15, 40, 5, 44, 15); // Left horn
        monsterGraphics.fillTriangle(58, 15, 56, 5, 60, 15); // Right horn
      }
      
      monsterGraphics.generateTexture('monster-sprite', 120, 100);
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
      const playerSprite = this.add.image(200, 300, 'player-sprite')
        .setDisplaySize(100, 120) // Larger and properly proportioned
        .setData('type', 'player')
        .setData('originalX', 200)
        .setData('originalY', 300);
      
      // Add subtle idle animation to player
      this.tweens.add({
        targets: playerSprite,
        y: playerSprite.y - 8,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Create monster sprite (right side) with menacing presence
      const monsterSprite = this.add.image(600, 300, 'monster-sprite')
        .setDisplaySize(130, 110) // Larger and more imposing
        .setData('type', 'monster')
        .setData('originalX', 600)
        .setData('originalY', 300);
      
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
      
      // Enhanced HP bars with borders and gradients (repositioned for new sprite layout)
      const playerHpBg = this.add.rectangle(200, 380, 140, 16, 0x333333).setStrokeStyle(2, 0x666666);
      const playerHpBar = this.add.rectangle(200, 380, 136, 12, 0x00ff00);
      const playerMpBg = this.add.rectangle(200, 395, 140, 12, 0x333333).setStrokeStyle(2, 0x666666);
      const playerMpBar = this.add.rectangle(200, 395, 136, 8, 0x0066ff);
      
      // Monster HP bar (positioned above monster)
      const monsterHpBg = this.add.rectangle(600, 200, 140, 16, 0x333333).setStrokeStyle(2, 0x666666);
      const monsterHpBar = this.add.rectangle(600, 200, 136, 12, 0xff0000);
      
      // Enhanced labels with styling (repositioned)
      this.add.text(200, 410, `${playerStats.username || 'Hero'} (Lv.${Math.floor(playerStats.strength + playerStats.agility)})`, { 
        fontSize: '12px', 
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      this.add.text(600, 180, `${monster.name} (Lv.${monster.level || 1})`, { 
        fontSize: '12px', 
        color: '#ffaaaa',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // HP/MP text overlays (repositioned)
      const playerHpText = this.add.text(200, 380, `${playerStats.currentHp}/${playerStats.maxHp}`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      
      const playerMpText = this.add.text(200, 395, `${playerStats.currentMp}/${playerStats.maxMp}`, {
        fontSize: '8px',
        color: '#aaaaff',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      
      const monsterHpText = this.add.text(600, 200, `${monster.currentHp}/${monster.maxHp}`, {
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