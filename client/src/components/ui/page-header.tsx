import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Settings } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode; // For action buttons or other content
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-card border-b border-border px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {children}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/settings")}
              className="hover:bg-muted"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}