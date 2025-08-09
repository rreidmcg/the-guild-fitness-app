import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// No button icons needed anymore

interface XpPopupProps {
  amount: number;
  base?: number;
  multiplier?: number;
  onComplete?: () => void;
}

// XP Popup Component with animation
function XpPopup({ amount, base, multiplier, onComplete }: XpPopupProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1300);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed left-1/2 top-14 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 z-50 pointer-events-none animate-[rise-fade_1.2s_ease-out_forwards]">
      <div className="text-green-400 font-bold">+{Math.round(amount)} XP</div>
      {base && multiplier && (
        <div className="text-gray-400 text-sm mt-1">
          Base {base} × {multiplier.toFixed(2)}×
        </div>
      )}
    </div>
  );
}

// Time Confirmation Modal
interface TimeConfirmModalProps {
  actualMinutes: number;
  estimatedMinutes: number;
  isOpen: boolean;
  onConfirm: (finalMinutes: number) => void;
  onClose: () => void;
}

function TimeConfirmModal({ actualMinutes, estimatedMinutes, isOpen, onConfirm, onClose }: TimeConfirmModalProps) {
  const [editedMinutes, setEditedMinutes] = useState(Math.round(estimatedMinutes));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Did this take about {estimatedMinutes} minutes?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We recorded <strong>{actualMinutes.toFixed(1)} min</strong>, which is outside the normal range 
            (½×–2× your estimate).
          </p>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edited-minutes" className="text-right">
              Edit minutes:
            </Label>
            <Input
              id="edited-minutes"
              type="number"
              min="1"
              step="1"
              value={editedMinutes}
              onChange={(e) => setEditedMinutes(Math.max(1, Number(e.target.value)))}
              className="col-span-3"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { onConfirm(actualMinutes); onClose(); }}>
              Use {actualMinutes.toFixed(1)} min
            </Button>
            <Button variant="outline" onClick={() => { onConfirm(estimatedMinutes); onClose(); }}>
              Use {estimatedMinutes} min
            </Button>
            <Button onClick={() => { onConfirm(editedMinutes); onClose(); }}>
              Save edited
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EnhancedWorkoutTimerProps {
  estimatedMinutes?: number;
  onWorkoutComplete: (finalMinutes: number) => void;
  shouldStop?: boolean;
}

export function EnhancedWorkoutTimer({ 
  estimatedMinutes = 15, 
  onWorkoutComplete,
  shouldStop = false
}: EnhancedWorkoutTimerProps) {
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actualMinutes, setActualMinutes] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [isActive, setIsActive] = useState(true); // Auto-start the timer
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isActive) {
      if (!startTime) {
        setStartTime(new Date());
      }
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    const currentMinutes = time / 60;
    const progress = currentMinutes / estimatedMinutes;
    
    if (progress >= 0.9) return "text-red-400"; // Near target time
    if (progress >= 0.5) return "text-yellow-400"; // Approaching target time
    return "text-green-400"; // Still early
  };

  // Effect to handle external stop signal
  useEffect(() => {
    if (shouldStop && isActive && startTime) {
      setIsActive(false);
      const finalMinutes = Math.max(0.1, time / 60);
      const minOk = estimatedMinutes * 0.5;
      const maxOk = estimatedMinutes * 2;

      setActualMinutes(finalMinutes);

      if (finalMinutes < minOk || finalMinutes > maxOk) {
        setShowConfirmModal(true);
      } else {
        handleWorkoutComplete(finalMinutes);
      }
    }
  }, [shouldStop, isActive, startTime, time, estimatedMinutes]);

  const handleWorkoutComplete = async (finalMinutes: number) => {
    // Calculate and show XP reward
    const baseXp = Math.round(estimatedMinutes * 5); // 5 XP per estimated minute
    const streakMultiplier = 1.0; // Could be higher with streak bonuses
    const totalXp = baseXp * streakMultiplier;

    setShowXpPopup(true);

    // Call parent completion handler
    setTimeout(() => {
      onWorkoutComplete(finalMinutes);
      setTime(0);
      setStartTime(null);
    }, 1300); // Wait for XP popup animation
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Timer Display */}
      <div className={`text-6xl font-bold tracking-wider ${getTimerClass()} transition-colors duration-300`}>
        {formatTime(time)}
      </div>
      
      {/* Workout Status */}
      <div className="text-sm text-muted-foreground">
        {isActive ? "Workout in progress..." : `Estimated: ${estimatedMinutes} minutes`}
      </div>



      {/* Time Confirmation Modal */}
      <TimeConfirmModal
        actualMinutes={actualMinutes}
        estimatedMinutes={estimatedMinutes}
        isOpen={showConfirmModal}
        onConfirm={handleWorkoutComplete}
        onClose={() => setShowConfirmModal(false)}
      />

      {/* XP Popup */}
      {showXpPopup && (
        <XpPopup
          amount={Math.round(estimatedMinutes * 5)}
          base={Math.round(estimatedMinutes * 5)}
          multiplier={1.0}
          onComplete={() => setShowXpPopup(false)}
        />
      )}
    </div>
  );
}