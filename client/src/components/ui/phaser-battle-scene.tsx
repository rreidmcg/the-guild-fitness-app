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
      // Set up error handling for missing sprites
      this.load.on('loaderror', (file: any) => {
        console.log('Failed to load:', file.src);
      });

      // Load custom player sprites for different actions
      this.load.image('custom-player', '/sprites/player.png');
      this.load.image('custom-player-attack', '/sprites/player-attack.png');
      this.load.image('custom-player-victory', '/sprites/player-victory.png');
      this.load.image('custom-player-hurt', '/sprites/player-hurt.png');
      this.load.image('custom-player-charge', '/sprites/player-charge.png');
      
      // Only try to load custom monster sprite if it might exist
      const monsterFileName = monster.name.toLowerCase().replace(/\s+/g, '-');
      this.load.image('custom-monster', `/sprites/monster-${monsterFileName}.png`);
      
      // Fallback: Create ultra-realistic generated sprites
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      
      // Advanced anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Determine realistic skin color values
      const skinTones = {
        light: { base: '#FFDBAC', shadow: '#E8C4A0', highlight: '#FFF2E8' },
        medium: { base: '#D4A574', shadow: '#C8956B', highlight: '#E8BF94' },
        dark: { base: '#8B6914', shadow: '#704E0A', highlight: '#A67C1A' }
      };
      const skin = skinTones[playerStats.skinColor as keyof typeof skinTones] || skinTones.light;
      
      // REALISTIC HEAD with proper proportions and gradients
      const headGradient = ctx.createRadialGradient(60, 30, 5, 60, 30, 18);
      headGradient.addColorStop(0, skin.highlight);
      headGradient.addColorStop(0.7, skin.base);
      headGradient.addColorStop(1, skin.shadow);
      
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.ellipse(60, 30, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Jaw line definition
      ctx.fillStyle = skin.shadow;
      ctx.beginPath();
      ctx.ellipse(60, 38, 12, 6, 0, 0, Math.PI);
      ctx.fill();
      
      // REALISTIC FACIAL FEATURES
      // Eyes with depth and detail
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(54, 26, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(66, 26, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Iris and pupils (default to brown if not specified)
      const eyeColor = '#8B4513'; // Brown eyes as default
      
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.ellipse(54, 26, 2.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(66, 26, 2.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(54, 26, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(66, 26, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye highlights for realism
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(55, 25, 0.8, 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(67, 25, 0.8, 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyebrows with individual hair strokes
      ctx.strokeStyle = playerStats.hairColor === 'blonde' ? '#D4AF37' : 
                       playerStats.hairColor === 'brown' ? '#654321' :
                       playerStats.hairColor === 'black' ? '#1C1C1C' : 
                       playerStats.hairColor === 'red' ? '#B22222' : '#654321';
      ctx.lineWidth = 0.8;
      
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(48 + i * 1.5, 20 - Math.sin(i * 0.3) * 0.5);
        ctx.lineTo(49 + i * 1.5, 18 - Math.sin(i * 0.3) * 0.5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(62 + i * 1.5, 20 - Math.sin(i * 0.3) * 0.5);
        ctx.lineTo(63 + i * 1.5, 18 - Math.sin(i * 0.3) * 0.5);
        ctx.stroke();
      }
      
      // Realistic nose with shading
      const noseGradient = ctx.createLinearGradient(58, 30, 62, 34);
      noseGradient.addColorStop(0, skin.highlight);
      noseGradient.addColorStop(1, skin.shadow);
      
      ctx.fillStyle = noseGradient;
      ctx.beginPath();
      ctx.moveTo(60, 30);
      ctx.lineTo(58, 34);
      ctx.lineTo(60, 36);
      ctx.lineTo(62, 34);
      ctx.closePath();
      ctx.fill();
      
      // Nostrils
      ctx.fillStyle = skin.shadow;
      ctx.beginPath();
      ctx.ellipse(58.5, 35, 0.8, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(61.5, 35, 0.8, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Realistic mouth with lips
      const lipGradient = ctx.createLinearGradient(60, 40, 60, 44);
      lipGradient.addColorStop(0, '#E8A5A5');
      lipGradient.addColorStop(1, '#D48888');
      
      ctx.fillStyle = lipGradient;
      ctx.beginPath();
      ctx.ellipse(60, 42, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Lip highlight
      ctx.fillStyle = '#F5C2C2';
      ctx.beginPath();
      ctx.ellipse(60, 41, 3, 1, 0, 0, Math.PI);
      ctx.fill();
      
      // REALISTIC HAIR with texture and volume
      const hairColor = playerStats.hairColor === 'blonde' ? '#FFD700' : 
                       playerStats.hairColor === 'brown' ? '#8B4513' :
                       playerStats.hairColor === 'black' ? '#2C1810' : 
                       playerStats.hairColor === 'red' ? '#B22222' : '#8B4513';
      
      // Helper function to darken color
      const darkenColor = (color: string, factor: number) => {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
        return `rgb(${r}, ${g}, ${b})`;
      };

      const hairGradient = ctx.createRadialGradient(60, 15, 5, 60, 15, 25);
      hairGradient.addColorStop(0, hairColor);
      hairGradient.addColorStop(1, darkenColor(hairColor, 0.7));
      
      ctx.fillStyle = hairGradient;
      ctx.beginPath();
      ctx.ellipse(60, 15, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair strands for texture
      ctx.strokeStyle = hairColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const startX = 60 + Math.cos(angle) * 15;
        const startY = 15 + Math.sin(angle) * 8;
        const endX = 60 + Math.cos(angle) * 22;
        const endY = 15 + Math.sin(angle) * 12;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      
      // REALISTIC NECK AND SHOULDERS
      const neckGradient = ctx.createLinearGradient(55, 46, 65, 46);
      neckGradient.addColorStop(0, skin.shadow);
      neckGradient.addColorStop(0.5, skin.base);
      neckGradient.addColorStop(1, skin.shadow);
      
      ctx.fillStyle = neckGradient;
      ctx.fillRect(55, 46, 10, 12);
      
      // REALISTIC TORSO with clothing texture
      const shirtColor = playerStats.strength > 2 ? '#4169E1' : '#8B4513';
      const torsoGradient = ctx.createLinearGradient(40, 58, 80, 58);
      torsoGradient.addColorStop(0, shirtColor);
      torsoGradient.addColorStop(1, darkenColor(shirtColor, 0.6));
      
      ctx.fillStyle = torsoGradient;
      ctx.fillRect(40, 58, 40, 35);
      
      // Clothing wrinkles and details
      ctx.strokeStyle = darkenColor(shirtColor, 0.4);
      ctx.lineWidth = 1;
      
      // Vertical wrinkles
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(45 + i * 10, 60);
        ctx.quadraticCurveTo(46 + i * 10, 75, 45 + i * 10, 90);
        ctx.stroke();
      }
      
      // REALISTIC ARMS with muscle definition
      const armGradient = ctx.createRadialGradient(30, 70, 3, 30, 70, 8);
      armGradient.addColorStop(0, skin.highlight);
      armGradient.addColorStop(1, skin.shadow);
      
      ctx.fillStyle = armGradient;
      // Left arm
      ctx.beginPath();
      ctx.ellipse(30, 70, 6, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(28, 85, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Right arm
      ctx.beginPath();
      ctx.ellipse(90, 70, 6, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(92, 85, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // REALISTIC LEGS with proper proportions
      const legGradient = ctx.createLinearGradient(50, 93, 70, 93);
      legGradient.addColorStop(0, '#2F4F4F');
      legGradient.addColorStop(1, '#1C3333');
      
      ctx.fillStyle = legGradient;
      ctx.fillRect(50, 93, 8, 30);
      ctx.fillRect(62, 93, 8, 30);
      
      // Generate texture from canvas
      const texture = this.textures.createCanvas('player-sprite-realistic', canvas.width, canvas.height);
      const canvasTexture = texture?.getSourceImage() as HTMLCanvasElement;
      if (canvasTexture) {
        const canvasCtx = canvasTexture.getContext('2d')!;
        canvasCtx.drawImage(canvas, 0, 0);
        texture?.refresh();
      }
      
      // Create ultra-realistic monster sprite using same advanced techniques
      const monsterCanvas = document.createElement('canvas');
      monsterCanvas.width = 140;
      monsterCanvas.height = 140;
      const mCtx = monsterCanvas.getContext('2d')!;
      
      mCtx.imageSmoothingEnabled = true;
      mCtx.imageSmoothingQuality = 'high';
      
      // Generate different realistic monsters based on type
      if (monster.name.toLowerCase().includes('slime')) {
        // Ultra-realistic slime with translucent effects
        const slimeGradient = mCtx.createRadialGradient(70, 70, 10, 70, 70, 50);
        slimeGradient.addColorStop(0, 'rgba(50, 205, 50, 0.9)');
        slimeGradient.addColorStop(0.7, 'rgba(34, 139, 34, 0.8)');
        slimeGradient.addColorStop(1, 'rgba(0, 100, 0, 0.6)');
        
        mCtx.fillStyle = slimeGradient;
        mCtx.beginPath();
        mCtx.ellipse(70, 80, 45, 35, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Slime highlights and bubbles
        mCtx.fillStyle = 'rgba(144, 238, 144, 0.7)';
        mCtx.beginPath();
        mCtx.ellipse(55, 65, 15, 12, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Multiple bubbles for texture
        for (let i = 0; i < 8; i++) {
          const x = 40 + Math.random() * 60;
          const y = 50 + Math.random() * 50;
          const size = 2 + Math.random() * 4;
          mCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          mCtx.beginPath();
          mCtx.ellipse(x, y, size, size, 0, 0, Math.PI * 2);
          mCtx.fill();
        }
        
        // Realistic eyes with depth
        mCtx.fillStyle = '#000000';
        mCtx.beginPath();
        mCtx.ellipse(60, 60, 6, 8, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.ellipse(80, 60, 6, 8, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        mCtx.fillStyle = '#FFFFFF';
        mCtx.beginPath();
        mCtx.ellipse(62, 58, 2, 2, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.ellipse(82, 58, 2, 2, 0, 0, Math.PI * 2);
        mCtx.fill();
        
      } else if (monster.name.toLowerCase().includes('goblin')) {
        // Ultra-realistic goblin with detailed features
        const goblinSkin = '#228B22';
        
        // Head with proper shading
        const headGradient = mCtx.createRadialGradient(70, 40, 5, 70, 40, 15);
        headGradient.addColorStop(0, '#32CD32');
        headGradient.addColorStop(0.7, goblinSkin);
        headGradient.addColorStop(1, '#006400');
        
        mCtx.fillStyle = headGradient;
        mCtx.beginPath();
        mCtx.ellipse(70, 40, 15, 13, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Large pointed ears
        mCtx.fillStyle = goblinSkin;
        mCtx.beginPath();
        mCtx.moveTo(50, 35);
        mCtx.lineTo(45, 25);
        mCtx.lineTo(55, 40);
        mCtx.closePath();
        mCtx.fill();
        
        mCtx.beginPath();
        mCtx.moveTo(90, 35);
        mCtx.lineTo(95, 25);
        mCtx.lineTo(85, 40);
        mCtx.closePath();
        mCtx.fill();
        
        // Body with muscular definition
        const bodyGradient = mCtx.createLinearGradient(60, 55, 80, 55);
        bodyGradient.addColorStop(0, '#8B4513');
        bodyGradient.addColorStop(1, '#654321');
        
        mCtx.fillStyle = bodyGradient;
        mCtx.fillRect(60, 55, 20, 25);
        
        // Arms
        mCtx.fillStyle = goblinSkin;
        mCtx.beginPath();
        mCtx.ellipse(50, 65, 6, 12, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.ellipse(90, 65, 6, 12, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Legs
        mCtx.fillStyle = '#2F4F4F';
        mCtx.fillRect(62, 80, 6, 18);
        mCtx.fillRect(72, 80, 6, 18);
        
        // Fierce red eyes
        mCtx.fillStyle = '#FF0000';
        mCtx.beginPath();
        mCtx.ellipse(65, 36, 3, 3, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.ellipse(75, 36, 3, 3, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Nasty grin with teeth
        mCtx.fillStyle = '#000000';
        mCtx.beginPath();
        mCtx.ellipse(70, 45, 6, 2, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        mCtx.fillStyle = '#FFFFFF';
        mCtx.beginPath();
        mCtx.moveTo(67, 44);
        mCtx.lineTo(65, 47);
        mCtx.lineTo(69, 47);
        mCtx.closePath();
        mCtx.fill();
        
        mCtx.beginPath();
        mCtx.moveTo(73, 44);
        mCtx.lineTo(71, 47);
        mCtx.lineTo(75, 47);
        mCtx.closePath();
        mCtx.fill();
        
      } else {
        // Ultra-realistic generic monster (demon-like)
        const demonRed = '#B22222';
        
        // Muscular body with proper anatomy
        const bodyGradient = mCtx.createRadialGradient(70, 70, 10, 70, 70, 30);
        bodyGradient.addColorStop(0, '#DC143C');
        bodyGradient.addColorStop(0.7, demonRed);
        bodyGradient.addColorStop(1, '#8B0000');
        
        mCtx.fillStyle = bodyGradient;
        mCtx.fillRect(55, 50, 30, 40);
        
        // Head
        mCtx.beginPath();
        mCtx.ellipse(70, 35, 18, 15, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Horns
        mCtx.fillStyle = '#654321';
        mCtx.beginPath();
        mCtx.moveTo(60, 25);
        mCtx.lineTo(58, 15);
        mCtx.lineTo(62, 25);
        mCtx.closePath();
        mCtx.fill();
        
        mCtx.beginPath();
        mCtx.moveTo(80, 25);
        mCtx.lineTo(82, 15);
        mCtx.lineTo(78, 25);
        mCtx.closePath();
        mCtx.fill();
        
        // Muscular arms
        mCtx.fillStyle = bodyGradient;
        mCtx.beginPath();
        mCtx.ellipse(45, 60, 8, 15, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.ellipse(95, 60, 8, 15, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Glowing yellow eyes
        mCtx.fillStyle = '#FFFF00';
        mCtx.beginPath();
        mCtx.ellipse(65, 30, 4, 4, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.ellipse(75, 30, 4, 4, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Black pupils
        mCtx.fillStyle = '#000000';
        mCtx.beginPath();
        mCtx.ellipse(65, 30, 2, 2, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.ellipse(75, 30, 2, 2, 0, 0, Math.PI * 2);
        mCtx.fill();
        
        // Fangs
        mCtx.fillStyle = '#FFFFFF';
        mCtx.beginPath();
        mCtx.moveTo(67, 40);
        mCtx.lineTo(65, 45);
        mCtx.lineTo(69, 45);
        mCtx.closePath();
        mCtx.fill();
        
        mCtx.beginPath();
        mCtx.moveTo(73, 40);
        mCtx.lineTo(71, 45);
        mCtx.lineTo(75, 45);
        mCtx.closePath();
        mCtx.fill();
      }
      
      // Generate monster texture from canvas
      const monsterTexture = this.textures.createCanvas('monster-sprite-realistic', monsterCanvas.width, monsterCanvas.height);
      const monsterCanvasTexture = monsterTexture?.getSourceImage() as HTMLCanvasElement;
      if (monsterCanvasTexture) {
        const monsterCanvasCtx = monsterCanvasTexture.getContext('2d')!;
        monsterCanvasCtx.drawImage(monsterCanvas, 0, 0);
        monsterTexture?.refresh();
      }
      
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
      
      // Try to use custom sprites first, fallback to generated ones
      let playerSpriteKey = 'player-sprite-realistic';
      let monsterSpriteKey = 'monster-sprite-realistic';
      
      // Check if custom sprites loaded successfully and have valid data
      if (this.textures.exists('custom-player') && this.textures.get('custom-player').source[0]) {
        playerSpriteKey = 'custom-player';
        console.log('Using custom player sprite');
      } else {
        console.log('Using generated player sprite');
      }
      
      if (this.textures.exists('custom-monster') && this.textures.get('custom-monster').source[0]) {
        monsterSpriteKey = 'custom-monster';
        console.log('Using custom monster sprite');
      } else {
        console.log('Using generated monster sprite');
      }
      
      // Create player sprite (left side) with idle animation
      const playerSprite = this.add.image(200, 300, playerSpriteKey)
        .setDisplaySize(120, 160) // Consistent dimensions
        .setData('type', 'player')
        .setData('originalX', 200)
        .setData('originalY', 300);
      
      // Enhanced idle animation - gentle floating with breathing scale
      this.tweens.add({
        targets: playerSprite,
        y: playerSprite.y - 8,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Subtle rotation sway for more life-like movement
      this.tweens.add({
        targets: playerSprite,
        rotation: 0.08,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Victory pose animation (triggered when monster dies)
      playerSprite.setData('victoryAnimation', () => {
        // Switch to victory sprite
        switchPlayerSprite('custom-player-victory', 2000);
        
        this.tweens.add({
          targets: playerSprite,
          scaleX: 1.2,
          scaleY: 1.2,
          y: playerSprite.y - 20,
          duration: 500,
          ease: 'Back.easeOut',
          onComplete: () => {
            // Add sparkle particles for victory
            const sparkles = this.add.particles(playerSprite.x, playerSprite.y, 'magic-particle', {
              scale: { start: 0.2, end: 0.5 },
              alpha: { start: 1, end: 0 },
              tint: [0xFFD700, 0xFFA500, 0xFFFFFF],
              lifespan: 1000,
              quantity: 20,
              speed: { min: 20, max: 100 }
            });
            
            this.time.delayedCall(1500, () => sparkles.destroy());
          }
        });
      });
      
      // Level up animation effect  
      playerSprite.setData('levelUpAnimation', () => {
        // Golden glow effect
        const glow = this.add.circle(playerSprite.x, playerSprite.y, 80, 0xFFD700, 0.3);
        this.tweens.add({
          targets: glow,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 1000,
          onComplete: () => glow.destroy()
        });
        
        // Player celebration bounce
        this.tweens.add({
          targets: playerSprite,
          y: playerSprite.y - 30,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 300,
          yoyo: true,
          repeat: 1,
          ease: 'Power2'
        });
      });
      
      // Create monster sprite (right side) with menacing presence
      const monsterSprite = this.add.image(600, 300, monsterSpriteKey)
        .setDisplaySize(140, 140) // Match the realistic monster dimensions
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
      
      // Helper function to switch player sprite
      const switchPlayerSprite = (newSpriteKey: string, duration: number = 500) => {
        if (this.textures.exists(newSpriteKey)) {
          playerSprite.setTexture(newSpriteKey);
          // Auto-return to idle after duration
          this.time.delayedCall(duration, () => {
            playerSprite.setTexture(playerSpriteKey);
          });
        }
      };

      // Store references for updates
      this.data.set('playerSprite', playerSprite);
      this.data.set('monsterSprite', monsterSprite);
      this.data.set('switchPlayerSprite', switchPlayerSprite);
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
        
        // Enhanced player attack with sprite switching
        const originalX = playerSprite.getData('originalX');
        const switchSprite = scene.data.get('switchPlayerSprite');
        
        // Step 1: Charge phase - switch to charge sprite
        switchSprite('custom-player-charge', 200);
        
        // Pre-attack charge effect (energy building up)
        const chargeAura = scene.add.circle(playerSprite.x, playerSprite.y, 50, 0x00FFFF, 0.4);
        scene.tweens.add({
          targets: chargeAura,
          scaleX: 0.5,
          scaleY: 0.5,
          alpha: 0,
          duration: 100,
          onComplete: () => chargeAura.destroy()
        });
        
        // Step 2: Attack phase - switch to attack sprite and lunge
        scene.time.delayedCall(150, () => {
          switchSprite('custom-player-attack', 400);
        });
        
        scene.tweens.add({
          targets: playerSprite,
          x: originalX + 80,
          duration: 150,
          delay: 150,
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
        
        // Player hit reaction with hurt sprite
        const playerOriginalX = playerSprite.getData('originalX');
        const switchSprite = scene.data.get('switchPlayerSprite');
        
        // Switch to hurt sprite during hit reaction
        switchSprite('custom-player-hurt', 600);
        
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
      
      // Player victory pose with victory sprite
      if (playerSprite) {
        const victoryAnimation = playerSprite.getData('victoryAnimation');
        if (victoryAnimation) {
          victoryAnimation();
        }
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