import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Sparkles, 
  Dumbbell, 
  Trophy, 
  Shield, 
  Users, 
  Crown,
  Target,
  Gift,
  Zap,
  Heart,
  Calendar,
  Star,
  Sword,
  ShoppingCart,
  Settings,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const faqData: FAQItem[] = [
  {
    id: "xp-basics",
    question: "How do I earn XP and level up?",
    answer: "You earn XP by completing workouts (10-50 XP per exercise), finishing daily quests like hydration and sleep (5 XP each), and unlocking achievements (25-100 XP). The more intense your workout, the more XP you gain!",
    category: "XP & Leveling",
    icon: Sparkles
  },
  {
    id: "character-stats",
    question: "What do Strength, Stamina, and Agility do?",
    answer: "These stats grow based on your workouts: Strength increases with weight training and resistance exercises, Stamina grows with cardio and endurance training, and Agility improves with flexibility, balance, and agility exercises. Higher stats make you stronger in battles!",
    category: "Character",
    icon: Shield
  },
  {
    id: "daily-quests",
    question: "What are daily quests and how do they work?",
    answer: "Daily quests are simple health habits: drinking water (hydration), taking steps, eating protein, and getting good sleep. Complete 2 out of 4 quests OR do one workout to maintain your streak and earn bonus XP. They reset every day at midnight in your timezone.",
    category: "Daily System",
    icon: Target
  },
  {
    id: "streak-system",
    question: "How does the streak system work?",
    answer: "Maintain your streak by completing 2+ daily quests OR 1 workout each day. Streaks give XP multipliers (1.5x at 3+ days) and unlock special rewards. You get streak freezes to protect your progress during rest days or busy periods.",
    category: "Streaks",
    icon: Calendar
  },
  {
    id: "atrophy-system",
    question: "Will I lose progress if I don't exercise?",
    answer: "After 2 consecutive days of complete inactivity (no workouts AND less than 2 daily quests), you'll start losing 1% XP and stats daily. New players get protection for their first week. Use streak freezes or complete minimal daily quests to prevent this.",
    category: "Progress Protection",
    icon: Heart
  },
  {
    id: "future-dungeons",
    question: "What are the future dungeons feature?",
    answer: "Epic Dungeons will be massive multi-level adventures where your workout consistency unlocks new floors and boss battles. Your character stats will determine combat success, and dungeons will provide exclusive rewards, gear, and story content.",
    category: "Coming Soon",
    icon: Trophy
  },
  {
    id: "future-pvp",
    question: "How will player duels work?",
    answer: "Player vs Player duels will let you challenge friends to fitness competitions. Your character level, stats, and recent workout consistency will determine battle outcomes. Win duels to earn exclusive PvP rewards and climb leaderboards.",
    category: "Coming Soon",
    icon: Users
  },
  {
    id: "gold-system",
    question: "How do I earn and spend gold?",
    answer: "Earn gold by winning battles against monsters in the Battle section. Spend gold in the Shop on healing potions, mana potions, cosmetic items, and future equipment. Gold is your primary in-game currency for purchases.",
    category: "Economy",
    icon: ShoppingCart
  },
  {
    id: "battle-system",
    question: "How does combat work?",
    answer: "Battle monsters using your character stats. Strength affects damage, Stamina determines HP/MP, and Agility influences dodge chance. Use potions strategically and level up your stats through workouts to defeat stronger enemies.",
    category: "Combat",
    icon: Sword
  },
  {
    id: "workout-tracking",
    question: "How are my workouts tracked and scored?",
    answer: "Create custom workouts or use templates, then log your sets, reps, and weights during workout sessions. XP is calculated based on exercise intensity, duration, and your effort level. The app tracks your progression over time.",
    category: "Workouts",
    icon: Dumbbell
  },
  {
    id: "achievements",
    question: "What achievements can I unlock?",
    answer: "Achievements reward major milestones like first workout, level-ups, streak records, battle victories, and boss defeats. Each achievement gives XP bonuses and unlocks special titles you can display on your profile.",
    category: "Achievements",
    icon: Crown
  },
  {
    id: "profile-customization",
    question: "Can I customize my character?",
    answer: "Yes! Visit the Wardrobe to change your character's appearance, including gender, skin color, hair color, and cosmetic items purchased from the Shop. More customization options are being added regularly.",
    category: "Customization",
    icon: Star
  },
  {
    id: "data-privacy",
    question: "Is my fitness data private and secure?",
    answer: "Absolutely. Your workout data, health information, and personal details are encrypted and stored securely. We never share your personal fitness data with third parties. You own your data and can export or delete it anytime.",
    category: "Privacy & Security",
    icon: Shield
  },
  {
    id: "getting-started",
    question: "I'm new - where should I start?",
    answer: "Start with the Stats page to see your character, then visit Workouts to log your first exercise session. Complete some daily quests, try a battle against a weak monster, and explore the Shop. The onboarding tour covers all the basics!",
    category: "Getting Started",
    icon: BookOpen
  },
  {
    id: "technical-issues",
    question: "I'm experiencing technical problems. What should I do?",
    answer: "Try refreshing the page first. If issues persist, check your internet connection. For persistent problems, visit Settings > Help & Feedback to report the issue with details about what you were doing when it occurred.",
    category: "Technical Support",
    icon: Settings
  }
];

const categories = [
  "All",
  "Getting Started", 
  "XP & Leveling",
  "Character",
  "Workouts",
  "Daily System",
  "Streaks",
  "Combat",
  "Economy",
  "Coming Soon",
  "Technical Support"
];

export function HelpFAQ() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredFAQs = selectedCategory === "All" 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Help & FAQ</h2>
        </div>
        <p className="text-muted-foreground">
          Everything you need to know about The Guild: Gamified Fitness
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="text-xs"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {filteredFAQs.map((item) => {
          const isOpen = openItems.includes(item.id);
          
          return (
            <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleItem(item.id)}>
              <Card className="bg-card border-border">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center space-x-3">
                        {React.createElement(item.icon, { className: "w-5 h-5 text-blue-500" })}
                        <span>{item.question}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {filteredFAQs.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category or search for specific topics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Gift className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Still Need Help?</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}