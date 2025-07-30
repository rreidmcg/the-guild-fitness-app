import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './button';

interface FloatingSpeakerProps {
  isPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function FloatingSpeaker({ isPlaying, isMuted, onToggleMute }: FloatingSpeakerProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMute}
        className="rounded-full bg-background/80 backdrop-blur-sm border-border hover:bg-background/90 transition-all duration-200"
      >
        {isMuted || !isPlaying ? (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Volume2 className="h-4 w-4 text-foreground" />
        )}
      </Button>
    </div>
  );
}