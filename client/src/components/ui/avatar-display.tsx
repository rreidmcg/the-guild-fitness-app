import { AvatarSelector } from "./avatar-selector";
import { useQuery } from "@tanstack/react-query";

export function AvatarDisplay() {
  const { data: userStats } = useQuery({ queryKey: ["/api/user/stats"] });

  return (
    <div className="avatar-container rounded-xl h-64 mb-6 flex items-center justify-center border border-gray-600">
      <AvatarSelector 
        user={userStats}
        size="lg"
        className="w-full h-full"
        showToggle={true}
        defaultMode="3d"
        interactive={true}
        showStats={true}
        animationState="idle"
      />
    </div>
  );
}
