import { TurnBasedBattle } from "@/components/ui/turn-based-battle";
import { useNavigate } from "@/hooks/use-navigate";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function BattleDemo() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <TurnBasedBattle
      dungeonId="demo"
      onBattleComplete={(result) => {
        if (result === 'victory') {
          toast({
            title: "Victory!",
            description: "You defeated the Cave Slime! This was a demo battle.",
          });
        } else {
          toast({
            title: "Defeat",
            description: "The Cave Slime was too strong. Train harder!",
            variant: "destructive"
          });
        }
        navigate("/battle");
      }}
      onBack={() => navigate("/battle")}
    />
  );
}