import { ReactNode } from "react";

interface StatBarProps {
  icon: ReactNode;
  name: string;
  value: number;
  color: string;
  maxValue?: number;
}

export function StatBar({ icon, name, value, color, maxValue = 40 }: StatBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium text-gray-300">{name}</span>
        </div>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
