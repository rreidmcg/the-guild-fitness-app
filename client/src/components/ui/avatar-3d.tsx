import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
// Note: Using any for user type since it's defined in shared schema

interface Avatar3DProps {
  user?: any;
  playerStats?: any;
  size?: number | "sm" | "md" | "lg";
  className?: string;
  interactive?: boolean;
  showStats?: boolean;
  animationState?: 'idle' | 'victory' | 'attack' | 'level_up';
}

export function Avatar3D({ 
  user, 
  playerStats, 
  size = "md", 
  className = "", 
  interactive = false,
  showStats = false,
  animationState = 'idle'
}: Avatar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    character: THREE.Group;
    mixer?: THREE.AnimationMixer;
    clock: THREE.Clock;
    animationId?: number;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use playerStats if provided (for leaderboard), otherwise use user
  const playerData = playerStats || user;
  
  // Get dimensions based on size prop
  const getDimensions = useCallback(() => {
    if (typeof size === "number") {
      return { width: size, height: size };
    }
    
    const sizes = {
      sm: { width: 120, height: 120 },
      md: { width: 200, height: 200 },
      lg: { width: 300, height: 300 }
    };
    return sizes[size];
  }, [size]);

  // Create basic humanoid character mesh
  const createCharacterMesh = useCallback((playerData: any) => {
    const character = new THREE.Group();
    
    // Get character properties
    const level = playerData?.level || 1;
    const strength = playerData?.strength || 0;
    const stamina = playerData?.stamina || 0;
    const agility = playerData?.agility || 0;
    const skinColor = playerData?.skinColor || "#F5C6A0";
    const hairColor = playerData?.hairColor || "#8B4513";
    const gender = playerData?.gender || "male";

    // Create materials
    const skinMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
    const hairMaterial = new THREE.MeshLambertMaterial({ color: hairColor });
    const clothingMaterial = new THREE.MeshLambertMaterial({ color: "#4A5568" });
    
    // Adjust body proportions based on gender
    const bodyScale = gender === "female" ? 0.9 : 1.0;
    const shoulderWidth = gender === "female" ? 0.8 : 1.0;
    
    // Create head
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(0, 2.5, 0);
    head.scale.set(1, 1.1, 1);
    character.add(head);

    // Create hair
    const hairGeometry = new THREE.SphereGeometry(0.52, 16, 16);
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 2.7, 0);
    hair.scale.set(1, 0.6, 1);
    character.add(hair);

    // Create torso - scale based on strength
    const strengthScale = 1 + (strength * 0.02); // Slight increase with strength
    const torsoGeometry = new THREE.BoxGeometry(1.2 * shoulderWidth, 1.5, 0.6);
    const torso = new THREE.Mesh(torsoGeometry, clothingMaterial);
    torso.position.set(0, 1.5, 0);
    torso.scale.set(strengthScale, bodyScale, strengthScale);
    character.add(torso);

    // Create arms - scale based on strength
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2);
    
    const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
    leftArm.position.set(-0.8 * shoulderWidth * strengthScale, 1.8, 0);
    leftArm.scale.set(1 + strength * 0.01, 1, 1 + strength * 0.01);
    character.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
    rightArm.position.set(0.8 * shoulderWidth * strengthScale, 1.8, 0);
    rightArm.scale.set(1 + strength * 0.01, 1, 1 + strength * 0.01);
    character.add(rightArm);

    // Create legs - scale based on agility (longer legs = more agile)
    const legScale = 1 + (agility * 0.01);
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5 * legScale);
    
    const leftLeg = new THREE.Mesh(legGeometry, clothingMaterial);
    leftLeg.position.set(-0.3, 0.3, 0);
    character.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, clothingMaterial);
    rightLeg.position.set(0.3, 0.3, 0);
    character.add(rightLeg);

    // Add equipment/gear based on level and stats
    if (level >= 5) {
      // Add a simple weapon (sword) for higher level characters
      const swordGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.05);
      const swordMaterial = new THREE.MeshLambertMaterial({ color: "#C0C0C0" });
      const sword = new THREE.Mesh(swordGeometry, swordMaterial);
      sword.position.set(0.9 * shoulderWidth * strengthScale, 1.8, 0);
      sword.rotation.z = Math.PI / 6;
      character.add(sword);
    }

    if (level >= 10) {
      // Add armor pieces for even higher level characters
      const armorGeometry = new THREE.BoxGeometry(1.3 * shoulderWidth, 1.6, 0.65);
      const armorMaterial = new THREE.MeshLambertMaterial({ color: "#8B7355" });
      const armor = new THREE.Mesh(armorGeometry, armorMaterial);
      armor.position.set(0, 1.5, 0);
      armor.scale.set(strengthScale, bodyScale, strengthScale);
      character.add(armor);
    }

    // Add level-based glow effect
    if (level >= 20) {
      const glowGeometry = new THREE.SphereGeometry(2, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: "#FFD700", 
        transparent: true, 
        opacity: 0.1 
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(0, 1.5, 0);
      character.add(glow);
    }

    return character;
  }, []);

  // Animation functions
  const animateCharacter = useCallback((character: THREE.Group, animationState: string, deltaTime: number) => {
    const time = Date.now() * 0.001;
    
    switch (animationState) {
      case 'idle':
        // Gentle breathing animation
        character.scale.y = 1 + Math.sin(time * 2) * 0.02;
        character.rotation.y = Math.sin(time * 0.5) * 0.1;
        break;
        
      case 'victory':
        // Victory pose with arms raised
        character.rotation.y = Math.sin(time * 4) * 0.3;
        character.position.y = Math.sin(time * 6) * 0.1;
        break;
        
      case 'attack':
        // Attack animation with forward thrust
        const attackPhase = (Math.sin(time * 8) + 1) / 2;
        character.rotation.x = -attackPhase * 0.2;
        character.position.z = attackPhase * 0.3;
        break;
        
      case 'level_up':
        // Level up animation with spinning and glowing
        character.rotation.y = time * 2;
        character.scale.setScalar(1 + Math.sin(time * 10) * 0.1);
        break;
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;

    const { width, height } = getDimensions();
    
    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 2, 5);
      camera.lookAt(0, 1.5, 0);

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      mountRef.current.appendChild(renderer.domElement);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Create character
      const character = createCharacterMesh(playerData);
      scene.add(character);

      // Create clock for animations
      const clock = new THREE.Clock();

      // Store scene references
      sceneRef.current = {
        scene,
        camera,
        renderer,
        character,
        clock
      };

      setIsLoading(false);

    } catch (err) {
      console.error('Error initializing 3D avatar:', err);
      setError('Failed to load 3D avatar');
      setIsLoading(false);
    }
  }, [getDimensions, createCharacterMesh, playerData]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current) return;

    const animate = () => {
      if (!sceneRef.current) return;

      const { scene, camera, renderer, character, clock } = sceneRef.current;
      const deltaTime = clock.getDelta();

      // Animate character
      animateCharacter(character, animationState, deltaTime);

      // Render
      renderer.render(scene, camera);

      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
    };
  }, [animationState, animateCharacter]);

  // Handle mouse interactions
  useEffect(() => {
    if (!interactive || !sceneRef.current) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!sceneRef.current || !mountRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Rotate character to follow mouse
      sceneRef.current.character.rotation.y = x * 0.5;
      sceneRef.current.character.rotation.x = y * 0.2;
    };

    if (mountRef.current) {
      mountRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [interactive]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        const { renderer, scene } = sceneRef.current;
        
        // Dispose of geometries and materials
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        // Dispose of renderer
        renderer.dispose();
        
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        sceneRef.current = null;
      }
    };
  }, []);

  const { width, height } = getDimensions();

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-800 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-red-400">
          <div className="text-sm">3D Avatar Error</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mountRef} 
        className="rounded-lg overflow-hidden"
        style={{ width, height }}
      />
      
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg"
          style={{ width, height }}
        >
          <div className="text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm">Loading 3D Avatar...</div>
          </div>
        </div>
      )}

      {showStats && playerData && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
          <div className="text-xs text-center">
            <div>Level {playerData.level || 1}</div>
            <div className="flex justify-center space-x-2 mt-1">
              <span className="text-red-400">STR: {playerData.strength || 0}</span>
              <span className="text-green-400">STA: {playerData.stamina || 0}</span>
              <span className="text-blue-400">AGI: {playerData.agility || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}