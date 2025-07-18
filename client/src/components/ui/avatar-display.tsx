import { useRef, useEffect } from "react";
import { User } from "lucide-react";

export function AvatarDisplay() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // TODO: Initialize Three.js scene here
    // This is a placeholder for the 3D avatar implementation
    // In a real implementation, you would:
    // 1. Create a Three.js scene, camera, and renderer
    // 2. Load a 3D human model (e.g., from a .glb file)
    // 3. Add lighting and controls
    // 4. Render the scene to the mountRef element

    return () => {
      // Cleanup Three.js resources
    };
  }, []);

  return (
    <div className="avatar-container rounded-xl h-64 mb-6 flex items-center justify-center border border-gray-600">
      <div ref={mountRef} className="w-full h-full relative">
        {/* Placeholder for 3D avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-b from-game-primary to-game-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
            <p className="text-gray-400 text-sm">3D Avatar Model</p>
            <p className="text-xs text-gray-500">Three.js integration coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
