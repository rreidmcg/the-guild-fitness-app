import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@/hooks/use-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Progress component will be styled manually since it might not exist
import { useToast } from "@/hooks/use-toast";
import { 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  Trophy,
  ArrowLeft,
  Skull,
  ChevronDown,
  ChevronRight,
  Coins,
  X,
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";
import greenSlimeImage from "@assets/IMG_3665_1753055571089.png";
import caveRatImage from "@assets/IMG_3670_1753151064629.png";
import wildGoblinImage from "@assets/0F1ED511-7E0E-4062-A429-FB8B7BC6B4FE_1753151490494.png";
import forestSpiderImage from "@assets/1B395958-75E1-4297-8F5E-27BED5DC1608_1753196270170.png";
import battlePlayerImage from "@assets/IMG_3682_1753213695174.png";
import forestBackgroundImage from "@assets/AD897CD2-5CB0-475D-B782-E09FD8D98DF7_1753153903824.png";
import { Avatar2D } from "@/components/ui/avatar-2d";

import { useBackgroundMusic } from "@/contexts/background-music-context";
import { queryClient } from "@/lib/queryClient";


// User stats type to match the API response
interface UserStats {
  level: number;
  experience: number;
  strength: number;
  stamina: number;
  agility: number;
  gold: number;
  battlesWon: number;
  currentTier: string;
  currentTitle: string;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  username: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  skinColor?: string;
  hairColor?: string;
  gender?: string;
  measurementUnit?: string;
}

interface Monster {
  id: number;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  goldReward: number;
  description: string;
  image?: string;
  lastDefeatedAt?: number; // Timestamp when monster was last defeated
}

interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  monster: Monster;
  battleLog: string[];
  isPlayerTurn: boolean;
  battleResult: 'ongoing' | 'victory' | 'defeat';
  remainingMonsters: Monster[];
  currentMonsterIndex: number;
  totalMonsters: number;
}

// Story-driven E-rank Dungeon Zones with progression
interface DungeonZone {
  id: string;
  name: string;
  description: string;
  background: string;
  monsters: Monster[];
  storyIntro: string;
  completionStory: string;
}

const ERANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "slime_caverns",
    name: "The Slime Caverns",
    description: "Dark, damp caves where gelatinous creatures multiply in the shadows",
    background: "#1a2b3d",
    storyIntro: "You enter the murky depths of the Slime Caverns. The air is thick with moisture and the sound of dripping echoes through the tunnels. Strange, luminescent slimes block your path...",
    completionStory: "The caverns grow quiet as the last slime dissolves. Ancient runes on the walls begin to glow, revealing the path forward to deeper mysteries.",
    monsters: [
      { id: 1, name: "Tiny Slime", level: 1, maxHp: 8, currentHp: 8, attack: 2, goldReward: 1, description: "A small, translucent blob that quivers nervously", image: greenSlimeImage },
      { id: 2, name: "Green Slime", level: 1, maxHp: 10, currentHp: 10, attack: 2, goldReward: 1, description: "A larger, more aggressive gelatinous creature", image: greenSlimeImage },
      { id: 3, name: "Acidic Slime", level: 1, maxHp: 12, currentHp: 12, attack: 3, goldReward: 2, description: "A corrosive slime that burns through metal", image: greenSlimeImage },
      { id: 4, name: "Bouncing Slime", level: 2, maxHp: 14, currentHp: 14, attack: 3, goldReward: 2, description: "An energetic slime that ricochets off walls", image: greenSlimeImage },
      { id: 5, name: "Elder Slime", level: 2, maxHp: 16, currentHp: 16, attack: 4, goldReward: 3, description: "An ancient slime with crystalline formations", image: greenSlimeImage },
      { id: 6, name: "Slime King", level: 2, maxHp: 20, currentHp: 20, attack: 4, goldReward: 5, description: "🏆 MINI-BOSS: The ruler of the slime caverns, pulsing with ancient power" }
    ]
  },
  {
    id: "rat_warrens",
    name: "The Rat Warrens",
    description: "A maze of tunnels infested with oversized rodents and their corrupted kin",
    background: "#2d1810",
    storyIntro: "The narrow tunnels stretch endlessly before you, filled with the chittering of countless rats. Their red eyes gleam in the darkness as they sense an intruder in their domain...",
    completionStory: "The warren falls silent. In the distance, you hear the echo of larger threats stirring in the depths, drawn by the commotion.",
    monsters: [
      { id: 7, name: "Sewer Rat", level: 2, maxHp: 12, currentHp: 12, attack: 3, goldReward: 2, description: "A disease-ridden rodent with yellowed fangs", image: caveRatImage },
      { id: 8, name: "Cave Rat", level: 2, maxHp: 14, currentHp: 14, attack: 3, goldReward: 2, description: "A larger rat adapted to cave life", image: caveRatImage },
      { id: 9, name: "Plague Rat", level: 2, maxHp: 16, currentHp: 16, attack: 4, goldReward: 3, description: "A sickly rat spreading corruption", image: caveRatImage },
      { id: 10, name: "Giant Rat", level: 3, maxHp: 18, currentHp: 18, attack: 4, goldReward: 3, description: "An oversized rodent with massive claws", image: caveRatImage },
      { id: 11, name: "War Rat", level: 3, maxHp: 20, currentHp: 20, attack: 5, goldReward: 4, description: "A battle-scarred rat veteran", image: caveRatImage },
      { id: 12, name: "Rat Chieftain", level: 3, maxHp: 26, currentHp: 26, attack: 5, goldReward: 6, description: "🏆 MINI-BOSS: A massive rat wearing crude armor, leading its pack" }
    ]
  },
  {
    id: "goblin_outpost",
    name: "The Goblin Outpost",
    description: "A ramshackle camp where mischievous goblins plot their next raid",
    background: "#1f2b1a",
    storyIntro: "Crude wooden spikes and torn banners mark the goblin territory. The air smells of smoke and rotting food. Cackling voices grow louder as the goblins spot your approach...",
    completionStory: "The outpost burns as the last goblin falls. Among the ashes, you find a crude map pointing to darker territories beyond.",
    monsters: [
      { id: 13, name: "Goblin Scout", level: 2, maxHp: 14, currentHp: 14, attack: 4, goldReward: 3, description: "A sneaky goblin carrying a rusty knife", image: wildGoblinImage },
      { id: 14, name: "Wild Goblin", level: 3, maxHp: 16, currentHp: 16, attack: 4, goldReward: 3, description: "A fierce goblin warrior with crude weapons", image: wildGoblinImage },
      { id: 15, name: "Goblin Raider", level: 3, maxHp: 18, currentHp: 18, attack: 5, goldReward: 4, description: "A goblin armed with stolen gear", image: wildGoblinImage },
      { id: 16, name: "Goblin Shaman", level: 3, maxHp: 20, currentHp: 20, attack: 5, goldReward: 4, description: "A goblin mystic wielding dark magic", image: wildGoblinImage },
      { id: 17, name: "Goblin Captain", level: 4, maxHp: 22, currentHp: 22, attack: 7, goldReward: 5, description: "A goblin officer commanding the troops", image: wildGoblinImage },
      { id: 18, name: "Goblin Warlord", level: 4, maxHp: 28, currentHp: 28, attack: 7, goldReward: 7, description: "🏆 MINI-BOSS: A battle-scarred goblin chief with stolen armor and weapons" }
    ]
  },
  {
    id: "spider_nest",
    name: "The Spider's Nest",
    description: "A web-covered lair where giant arachnids weave their deadly traps",
    background: "#1a1a2e",
    storyIntro: "Thick webs block every passage, and the skittering of eight legs echoes from all directions. The air is heavy with the scent of silk and venom...",
    completionStory: "The great web collapses as the nest's guardian falls. In the silence, you notice passages leading deeper into the earth.",
    monsters: [
      { id: 19, name: "Web Spinner", level: 3, maxHp: 18, currentHp: 18, attack: 5, goldReward: 4, description: "A quick spider that weaves binding webs", image: forestSpiderImage },
      { id: 20, name: "Forest Spider", level: 4, maxHp: 20, currentHp: 20, attack: 5, goldReward: 4, description: "A venomous hunter with razor-sharp fangs", image: forestSpiderImage },
      { id: 21, name: "Poison Spider", level: 4, maxHp: 22, currentHp: 22, attack: 7, goldReward: 5, description: "A deadly arachnid dripping with venom", image: forestSpiderImage },
      { id: 22, name: "Shadow Spider", level: 4, maxHp: 24, currentHp: 24, attack: 7, goldReward: 5, description: "A spider that strikes from the darkness", image: forestSpiderImage },
      { id: 23, name: "Warrior Spider", level: 5, maxHp: 26, currentHp: 26, attack: 8, goldReward: 6, description: "A heavily armored spider guardian", image: forestSpiderImage },
      { id: 24, name: "Broodmother", level: 5, maxHp: 32, currentHp: 32, attack: 8, goldReward: 8, description: "🏆 MINI-BOSS: An enormous spider surrounded by her countless offspring" }
    ]
  }
];

// D-rank Dungeon Zones (8 weeks to complete - 2x E-rank time)
const DRANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "crystal_mines",
    name: "The Crystal Mines",
    description: "Ancient tunnels where crystalline creatures guard precious gems",
    background: "#2a1845",
    storyIntro: "You descend into the glittering depths where crystal formations pulse with ethereal light. The air hums with magical energy as gem-encrusted guardians emerge from the walls...",
    completionStory: "The mine's guardian crystal dims as you claim victory. Deeper passages reveal themselves, leading to even greater challenges.",
    monsters: [
      { id: 25, name: "Crystal Sprite", level: 6, maxHp: 35, currentHp: 35, attack: 7, goldReward: 6, description: "A tiny elemental made of living crystal" },
      { id: 26, name: "Gem Crawler", level: 6, maxHp: 38, currentHp: 38, attack: 7, goldReward: 6, description: "An insectoid creature with diamond-hard shell" },
      { id: 27, name: "Ruby Golem", level: 7, maxHp: 42, currentHp: 42, attack: 8, goldReward: 7, description: "A construct of animated precious stones" },
      { id: 28, name: "Sapphire Guardian", level: 7, maxHp: 45, currentHp: 45, attack: 8, goldReward: 7, description: "A blue-crystal sentinel protecting the mines" },
      { id: 29, name: "Diamond Beast", level: 8, maxHp: 48, currentHp: 48, attack: 9, goldReward: 8, description: "A fearsome creature with unbreakable hide" },
      { id: 30, name: "Crystal Overlord", level: 8, maxHp: 55, currentHp: 55, attack: 9, goldReward: 12, description: "🏆 MINI-BOSS: Master of the crystal realm" }
    ]
  },
  {
    id: "shadow_temple",
    name: "The Shadow Temple",
    description: "A cursed sanctum where darkness itself takes physical form",
    background: "#1a1a1a",
    storyIntro: "You enter the abandoned temple where shadows writhe with malevolent life. Ancient altars drip with dark energy as spectral guardians rise from the void...",
    completionStory: "Light returns to the temple as the shadow lord falls. The curse begins to lift, revealing pathways to forgotten chambers.",
    monsters: [
      { id: 31, name: "Shadow Wisp", level: 7, maxHp: 40, currentHp: 40, attack: 8, goldReward: 7, description: "A floating orb of concentrated darkness" },
      { id: 32, name: "Shade Walker", level: 7, maxHp: 43, currentHp: 43, attack: 8, goldReward: 7, description: "A humanoid figure born from pure shadow" },
      { id: 33, name: "Dark Priest", level: 8, maxHp: 46, currentHp: 46, attack: 9, goldReward: 8, description: "A corrupted cleric wielding shadow magic" },
      { id: 34, name: "Void Stalker", level: 8, maxHp: 49, currentHp: 49, attack: 9, goldReward: 8, description: "A predator that hunts between dimensions" },
      { id: 35, name: "Shadow Wraith", level: 9, maxHp: 52, currentHp: 52, attack: 10, goldReward: 9, description: "An ancient spirit of pure malice" },
      { id: 36, name: "Umbral Lord", level: 9, maxHp: 60, currentHp: 60, attack: 10, goldReward: 15, description: "🏆 MINI-BOSS: Sovereign of the shadow realm" }
    ]
  },
  {
    id: "fire_caverns",
    name: "The Fire Caverns",
    description: "Volcanic tunnels where flame elementals guard molten treasures",
    background: "#8B0000",
    storyIntro: "Heat waves distort your vision as you enter the blazing caverns. Lava flows like rivers while fire elementals dance in the superheated air...",
    completionStory: "The flames die down as the fire lord is vanquished. Cooled passages reveal the way to even hotter depths.",
    monsters: [
      { id: 37, name: "Flame Imp", level: 8, maxHp: 44, currentHp: 44, attack: 9, goldReward: 8, description: "A mischievous creature of living fire" },
      { id: 38, name: "Magma Crawler", level: 8, maxHp: 47, currentHp: 47, attack: 9, goldReward: 8, description: "A salamander swimming through molten rock" },
      { id: 39, name: "Fire Elemental", level: 9, maxHp: 50, currentHp: 50, attack: 10, goldReward: 9, description: "A being of pure flame and fury" },
      { id: 40, name: "Lava Golem", level: 9, maxHp: 53, currentHp: 53, attack: 10, goldReward: 9, description: "A massive construct of hardened magma" },
      { id: 41, name: "Inferno Beast", level: 10, maxHp: 56, currentHp: 56, attack: 11, goldReward: 10, description: "A legendary creature born from volcanic fury" },
      { id: 42, name: "Flame Emperor", level: 10, maxHp: 65, currentHp: 65, attack: 11, goldReward: 18, description: "🏆 MINI-BOSS: Ruler of all fire elementals" }
    ]
  },
  {
    id: "ice_fortress",
    name: "The Ice Fortress",
    description: "A frozen citadel where winter's wrath has crystallized into living beings",
    background: "#87CEEB",
    storyIntro: "Your breath fogs in the bitter cold as you approach the ice-covered fortress. Frost creatures patrol the frozen halls while blizzards rage eternal...",
    completionStory: "The eternal winter breaks as the ice queen falls. Melting walls reveal ancient secrets frozen in time.",
    monsters: [
      { id: 43, name: "Frost Sprite", level: 9, maxHp: 48, currentHp: 48, attack: 10, goldReward: 9, description: "A tiny fae creature of winter magic" },
      { id: 44, name: "Ice Wolf", level: 9, maxHp: 51, currentHp: 51, attack: 10, goldReward: 9, description: "A predator with fangs of pure ice" },
      { id: 45, name: "Blizzard Mage", level: 10, maxHp: 54, currentHp: 54, attack: 11, goldReward: 10, description: "A sorcerer commanding winter storms" },
      { id: 46, name: "Glacier Giant", level: 10, maxHp: 57, currentHp: 57, attack: 11, goldReward: 10, description: "A massive humanoid of compressed ice" },
      { id: 47, name: "Winter Wraith", level: 11, maxHp: 60, currentHp: 60, attack: 12, goldReward: 11, description: "A ghostly guardian of the frozen realm" },
      { id: 48, name: "Ice Queen", level: 11, maxHp: 70, currentHp: 70, attack: 12, goldReward: 20, description: "🏆 MINI-BOSS: Eternal sovereign of winter" }
    ]
  },
  {
    id: "storm_peaks",
    name: "The Storm Peaks",
    description: "Mountain heights where lightning elementals dance among eternal thunderclouds",
    background: "#4B0082",
    storyIntro: "Thunder echoes across jagged peaks as you climb through storm-wracked cliffs. Lightning crackles overhead while wind elementals guard the sacred heights...",
    completionStory: "The storms calm as the thunder lord is defeated. Clear skies reveal paths to even higher peaks.",
    monsters: [
      { id: 49, name: "Storm Pixie", level: 10, maxHp: 52, currentHp: 52, attack: 11, goldReward: 10, description: "A tiny elemental crackling with electric energy" },
      { id: 50, name: "Wind Dancer", level: 10, maxHp: 55, currentHp: 55, attack: 11, goldReward: 10, description: "An ethereal being of swirling air currents" },
      { id: 51, name: "Lightning Beast", level: 11, maxHp: 58, currentHp: 58, attack: 12, goldReward: 11, description: "A creature born from pure electrical energy" },
      { id: 52, name: "Thunder Guardian", level: 11, maxHp: 61, currentHp: 61, attack: 12, goldReward: 11, description: "A massive elemental resonating with sound" },
      { id: 53, name: "Tempest Warden", level: 12, maxHp: 64, currentHp: 64, attack: 13, goldReward: 12, description: "A sentinel commanding all weather" },
      { id: 54, name: "Storm Lord", level: 12, maxHp: 75, currentHp: 75, attack: 13, goldReward: 22, description: "🏆 MINI-BOSS: Master of all atmospheric fury" }
    ]
  },
  {
    id: "earth_sanctum",
    name: "The Earth Sanctum",
    description: "Sacred caverns where stone itself has awakened to defend ancient secrets",
    background: "#8B4513",
    storyIntro: "The ground trembles beneath your feet as you enter halls carved from living rock. Stone guardians emerge from the walls, their eyes glowing with primal earth magic...",
    completionStory: "The sanctum grows still as the earth lord returns to slumber. New passages open, revealing deeper mysteries.",
    monsters: [
      { id: 55, name: "Rock Sprite", level: 11, maxHp: 56, currentHp: 56, attack: 12, goldReward: 11, description: "A small elemental of animated stone" },
      { id: 56, name: "Boulder Beast", level: 11, maxHp: 59, currentHp: 59, attack: 12, goldReward: 11, description: "A rolling mass of hardened earth" },
      { id: 57, name: "Stone Warden", level: 12, maxHp: 62, currentHp: 62, attack: 13, goldReward: 12, description: "A towering guardian of granite and marble" },
      { id: 58, name: "Crystal Titan", level: 12, maxHp: 65, currentHp: 65, attack: 13, goldReward: 12, description: "A massive being of precious minerals" },
      { id: 59, name: "Geo Sentinel", level: 13, maxHp: 68, currentHp: 68, attack: 14, goldReward: 13, description: "An ancient protector of earthen secrets" },
      { id: 60, name: "Earth Lord", level: 13, maxHp: 80, currentHp: 80, attack: 14, goldReward: 25, description: "🏆 MINI-BOSS: Sovereign of all terrestrial power" }
    ]
  }
];

// C-rank Dungeon Zones (16 weeks to complete - 2x D-rank time)
const CRANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "void_sanctum",
    name: "The Void Sanctum",
    description: "A realm between dimensions where reality itself bends and breaks",
    background: "#2F0A58",
    storyIntro: "You step into a place that shouldn't exist, where purple void energy crackles through twisted space. Creatures from beyond reality guard forbidden knowledge...",
    completionStory: "Reality stabilizes as the void lord is banished. The dimensional rifts seal, but echoes of greater powers still resonate.",
    monsters: [
      { id: 61, name: "Void Spawn", level: 14, maxHp: 70, currentHp: 70, attack: 15, goldReward: 14, description: "A writhing mass of dark energy" },
      { id: 62, name: "Phase Beast", level: 14, maxHp: 74, currentHp: 74, attack: 15, goldReward: 14, description: "A creature that shifts between dimensions" },
      { id: 63, name: "Reality Bender", level: 15, maxHp: 78, currentHp: 78, attack: 16, goldReward: 15, description: "An entity that warps space itself" },
      { id: 64, name: "Cosmic Horror", level: 15, maxHp: 82, currentHp: 82, attack: 16, goldReward: 15, description: "A being that defies comprehension" },
      { id: 65, name: "Dimensional Guardian", level: 16, maxHp: 86, currentHp: 86, attack: 17, goldReward: 16, description: "A sentinel of the void realm" },
      { id: 66, name: "Void Sovereign", level: 16, maxHp: 95, currentHp: 95, attack: 17, goldReward: 30, description: "🏆 MINI-BOSS: Master of dimensional chaos" }
    ]
  },
  {
    id: "titan_ruins",
    name: "The Titan Ruins",
    description: "Colossal structures where ancient giants once ruled the world",
    background: "#654321",
    storyIntro: "You stand before massive stone ruins built for beings of impossible size. The very air thrums with ancient power as titan-touched guardians awaken...",
    completionStory: "The titan's essence fades as their last guardian falls. The ruins begin to crumble, revealing artifacts of a forgotten age.",
    monsters: [
      { id: 67, name: "Stone Sentinel", level: 15, maxHp: 76, currentHp: 76, attack: 16, goldReward: 15, description: "A guardian statue brought to life" },
      { id: 68, name: "Giant's Fist", level: 15, maxHp: 80, currentHp: 80, attack: 16, goldReward: 15, description: "A severed hand still obeying its master" },
      { id: 69, name: "Colossal Golem", level: 16, maxHp: 84, currentHp: 84, attack: 17, goldReward: 16, description: "A massive construct of titan design" },
      { id: 70, name: "Elder Giant", level: 16, maxHp: 88, currentHp: 88, attack: 17, goldReward: 16, description: "A diminished but still mighty titan" },
      { id: 71, name: "Titan Warden", level: 17, maxHp: 92, currentHp: 92, attack: 18, goldReward: 17, description: "The last guardian of titan secrets" },
      { id: 72, name: "Titan Remnant", level: 17, maxHp: 100, currentHp: 100, attack: 18, goldReward: 35, description: "🏆 MINI-BOSS: The echo of titanic power" }
    ]
  },
  {
    id: "celestial_observatory",
    name: "The Celestial Observatory",
    description: "A tower reaching toward the stars where cosmic entities study mortal affairs",
    background: "#191970",
    storyIntro: "You ascend spiral stairs that seem to stretch into infinity. Starlight illuminates ancient telescopes while celestial beings turn their gaze upon you...",
    completionStory: "The stars dim as the astral lord retreats to higher planes. The observatory falls silent, its cosmic purpose fulfilled.",
    monsters: [
      { id: 73, name: "Star Wisp", level: 16, maxHp: 82, currentHp: 82, attack: 17, goldReward: 16, description: "A fragment of distant starlight given form" },
      { id: 74, name: "Comet Rider", level: 16, maxHp: 86, currentHp: 86, attack: 17, goldReward: 16, description: "A being that travels between worlds" },
      { id: 75, name: "Solar Guardian", level: 17, maxHp: 90, currentHp: 90, attack: 18, goldReward: 17, description: "A sentinel powered by solar energy" },
      { id: 76, name: "Nebula Spirit", level: 17, maxHp: 94, currentHp: 94, attack: 18, goldReward: 17, description: "An entity born from cosmic gas and dust" },
      { id: 77, name: "Constellation Keeper", level: 18, maxHp: 98, currentHp: 98, attack: 19, goldReward: 18, description: "A guardian of stellar arrangements" },
      { id: 78, name: "Astral Lord", level: 18, maxHp: 110, currentHp: 110, attack: 19, goldReward: 40, description: "🏆 MINI-BOSS: Sovereign of cosmic forces" }
    ]
  },
  {
    id: "temporal_nexus",
    name: "The Temporal Nexus",
    description: "A junction where all timelines converge and past meets future",
    background: "#8A2BE2",
    storyIntro: "Time flows strangely here as you witness echoes of what was and visions of what might be. Temporal guardians emerge from paradoxes, protecting the flow of time itself...",
    completionStory: "The timeline stabilizes as the chronarch falls. Time resumes its natural flow, but the memory of infinity lingers.",
    monsters: [
      { id: 79, name: "Time Echo", level: 17, maxHp: 88, currentHp: 88, attack: 18, goldReward: 17, description: "A reflection from another timeline" },
      { id: 80, name: "Paradox Beast", level: 17, maxHp: 92, currentHp: 92, attack: 18, goldReward: 17, description: "A creature that exists in multiple timelines" },
      { id: 81, name: "Chronos Guardian", level: 18, maxHp: 96, currentHp: 96, attack: 19, goldReward: 18, description: "A protector of temporal stability" },
      { id: 82, name: "Future Wraith", level: 18, maxHp: 100, currentHp: 100, attack: 19, goldReward: 18, description: "A being from a timeline that never was" },
      { id: 83, name: "Temporal Warden", level: 19, maxHp: 104, currentHp: 104, attack: 20, goldReward: 19, description: "A sentinel of all time streams" },
      { id: 84, name: "Chronarch", level: 19, maxHp: 115, currentHp: 115, attack: 20, goldReward: 45, description: "🏆 MINI-BOSS: Master of time itself" }
    ]
  },
  {
    id: "abyssal_depths",
    name: "The Abyssal Depths",
    description: "The deepest darkness where primordial horrors slumber in eternal night",
    background: "#000000",
    storyIntro: "You descend into absolute darkness where no light has ever touched. Ancient entities stir in the depths, their malevolent presence pressing against your mind...",
    completionStory: "Light pierces the eternal darkness as the void emperor is banished. The abyss seals itself, but its influence lingers.",
    monsters: [
      { id: 85, name: "Abyssal Spawn", level: 18, maxHp: 94, currentHp: 94, attack: 19, goldReward: 18, description: "A creature born from primordial darkness" },
      { id: 86, name: "Deep Horror", level: 18, maxHp: 98, currentHp: 98, attack: 19, goldReward: 18, description: "An entity that defies mortal comprehension" },
      { id: 87, name: "Nightmare Weaver", level: 19, maxHp: 102, currentHp: 102, attack: 20, goldReward: 19, description: "A being that feeds on fear and despair" },
      { id: 88, name: "Void Leviathan", level: 19, maxHp: 106, currentHp: 106, attack: 20, goldReward: 19, description: "A massive entity from the deep void" },
      { id: 89, name: "Darkness Incarnate", level: 20, maxHp: 110, currentHp: 110, attack: 21, goldReward: 20, description: "The living embodiment of absolute darkness" },
      { id: 90, name: "Void Emperor", level: 20, maxHp: 120, currentHp: 120, attack: 21, goldReward: 50, description: "🏆 MINI-BOSS: Ruler of the endless abyss" }
    ]
  },
  {
    id: "prismatic_cathedral",
    name: "The Prismatic Cathedral",
    description: "A crystalline sanctum where pure light has taken sentient form",
    background: "#FFD700",
    storyIntro: "Brilliant light refracts through countless crystal surfaces as you enter a cathedral of pure radiance. Light elementals dance in rainbow patterns, guarding sacred luminescence...",
    completionStory: "The cathedral dims as the light sovereign ascends to higher planes. The crystals lose their glow, but warmth remains.",
    monsters: [
      { id: 91, name: "Prism Sprite", level: 19, maxHp: 100, currentHp: 100, attack: 20, goldReward: 19, description: "A tiny being of refracted light" },
      { id: 92, name: "Rainbow Guardian", level: 19, maxHp: 104, currentHp: 104, attack: 20, goldReward: 19, description: "A protector wreathed in all colors" },
      { id: 93, name: "Radiance Keeper", level: 20, maxHp: 108, currentHp: 108, attack: 21, goldReward: 20, description: "A sentinel of pure illumination" },
      { id: 94, name: "Crystal Angel", level: 20, maxHp: 112, currentHp: 112, attack: 21, goldReward: 20, description: "A divine being of crystallized light" },
      { id: 95, name: "Luminous Archon", level: 21, maxHp: 116, currentHp: 116, attack: 22, goldReward: 21, description: "A celestial guardian of all light" },
      { id: 96, name: "Light Sovereign", level: 21, maxHp: 140, currentHp: 140, attack: 22, goldReward: 100, description: "🏆 FINAL C-RANK BOSS: Absolute ruler of illumination" }
    ]
  }
];

// B-rank Dungeon Zones (32 weeks to complete - 2x C-rank time)
const BRANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "genesis_core",
    name: "The Genesis Core",
    description: "The primordial source where all existence began",
    background: "#FFD700",
    storyIntro: "You approach the birthplace of reality itself, where the first spark of creation still burns. Genesis entities guard the fundamental forces that gave birth to all worlds...",
    completionStory: "The core pulses with renewed energy as the first guardian acknowledges your strength. Creation itself trembles at your approach.",
    monsters: [
      { id: 109, name: "Proto Essence", level: 24, maxHp: 135, currentHp: 135, attack: 25, goldReward: 24, description: "The raw material of existence" },
      { id: 110, name: "Origin Spark", level: 24, maxHp: 140, currentHp: 140, attack: 25, goldReward: 24, description: "A fragment of the first light" },
      { id: 111, name: "Prime Creator", level: 25, maxHp: 145, currentHp: 145, attack: 26, goldReward: 25, description: "An architect of fundamental reality" },
      { id: 112, name: "Genesis Angel", level: 25, maxHp: 150, currentHp: 150, attack: 26, goldReward: 25, description: "A divine herald of creation" },
      { id: 113, name: "First Born", level: 26, maxHp: 155, currentHp: 155, attack: 27, goldReward: 26, description: "The eldest of all created beings" },
      { id: 114, name: "Genesis Prime", level: 26, maxHp: 170, currentHp: 170, attack: 27, goldReward: 70, description: "🏆 MINI-BOSS: Guardian of the first flame" }
    ]
  },
  {
    id: "quantum_laboratory",
    name: "The Quantum Laboratory",
    description: "A realm where probability and possibility are weaponized",
    background: "#00CED1",
    storyIntro: "Reality shifts constantly as you enter a space where quantum mechanics rule supreme. Probability creatures phase in and out of existence while uncertainty itself becomes your enemy...",
    completionStory: "Probability collapses into certainty as the quantum lord is defeated. The laboratory stabilizes, but echoes of infinite possibility remain.",
    monsters: [
      { id: 115, name: "Probability Ghost", level: 25, maxHp: 142, currentHp: 142, attack: 26, goldReward: 25, description: "A being existing in quantum superposition" },
      { id: 116, name: "Schrödinger's Beast", level: 25, maxHp: 147, currentHp: 147, attack: 26, goldReward: 25, description: "A creature both alive and dead until observed" },
      { id: 117, name: "Wave Function", level: 26, maxHp: 152, currentHp: 152, attack: 27, goldReward: 26, description: "Mathematical probability given form" },
      { id: 118, name: "Uncertainty Principle", level: 26, maxHp: 157, currentHp: 157, attack: 27, goldReward: 26, description: "The embodiment of quantum indeterminacy" },
      { id: 119, name: "Quantum Entangler", level: 27, maxHp: 162, currentHp: 162, attack: 28, goldReward: 27, description: "A being connected across all dimensions" },
      { id: 120, name: "Quantum Overlord", level: 27, maxHp: 175, currentHp: 175, attack: 28, goldReward: 75, description: "🏆 MINI-BOSS: Master of all possibilities" }
    ]
  },
  {
    id: "multiverse_nexus",
    name: "The Multiverse Nexus",
    description: "The central hub connecting all parallel realities",
    background: "#9932CC",
    storyIntro: "You stand at the crossroads of infinite realities, where every possible version of existence converges. Multiverse guardians from countless timelines unite to test your worth...",
    completionStory: "The nexus acknowledges your singular achievement as the dimensional emperor falls. You have proven worthy across all realities.",
    monsters: [
      { id: 121, name: "Parallel Self", level: 26, maxHp: 149, currentHp: 149, attack: 27, goldReward: 26, description: "A version of you from another reality" },
      { id: 122, name: "Reality Shifter", level: 26, maxHp: 154, currentHp: 154, attack: 27, goldReward: 26, description: "A being that rewrites dimensional laws" },
      { id: 123, name: "Omniverse Walker", level: 27, maxHp: 159, currentHp: 159, attack: 28, goldReward: 27, description: "A traveler between all possible worlds" },
      { id: 124, name: "Infinity Mirror", level: 27, maxHp: 164, currentHp: 164, attack: 28, goldReward: 27, description: "A reflection of endless possibilities" },
      { id: 125, name: "Multiverse Warden", level: 28, maxHp: 169, currentHp: 169, attack: 29, goldReward: 28, description: "Guardian of dimensional stability" },
      { id: 126, name: "Dimensional Emperor", level: 28, maxHp: 180, currentHp: 180, attack: 29, goldReward: 80, description: "🏆 MINI-BOSS: Ruler of all realities" }
    ]
  },
  {
    id: "conceptual_plane",
    name: "The Conceptual Plane",
    description: "A realm where abstract ideas take physical form and wage eternal war",
    background: "#4169E1",
    storyIntro: "You enter a battlefield where pure concepts clash in eternal struggle. Love battles Hate, Order wars with Chaos, and abstract ideals manifest as living entities seeking dominance...",
    completionStory: "Balance is restored as the concept emperor yields. Ideas return to their abstract forms, but their power now flows through you.",
    monsters: [
      { id: 127, name: "Living Paradox", level: 27, maxHp: 156, currentHp: 156, attack: 28, goldReward: 27, description: "A contradiction given form" },
      { id: 128, name: "Embodied Logic", level: 27, maxHp: 161, currentHp: 161, attack: 28, goldReward: 27, description: "Pure reason made manifest" },
      { id: 129, name: "Chaos Incarnate", level: 28, maxHp: 166, currentHp: 166, attack: 29, goldReward: 28, description: "The living essence of disorder" },
      { id: 130, name: "Order Absolute", level: 28, maxHp: 171, currentHp: 171, attack: 29, goldReward: 28, description: "Perfect structure made real" },
      { id: 131, name: "Unity Principle", level: 29, maxHp: 176, currentHp: 176, attack: 30, goldReward: 29, description: "The force that binds all concepts" },
      { id: 132, name: "Concept Emperor", level: 29, maxHp: 185, currentHp: 185, attack: 30, goldReward: 85, description: "🏆 MINI-BOSS: Supreme ruler of all ideas" }
    ]
  },
  {
    id: "meta_reality",
    name: "The Meta Reality",
    description: "A layer of existence above existence itself",
    background: "#DC143C",
    storyIntro: "You transcend into a space that exists outside normal reality, where the very concept of 'being' is questioned. Meta-entities observe existence from beyond, and now they turn their attention to you...",
    completionStory: "The meta-realm shimmers as the transcendent falls. You have moved beyond the boundaries of normal existence.",
    monsters: [
      { id: 133, name: "Meta Observer", level: 28, maxHp: 163, currentHp: 163, attack: 29, goldReward: 28, description: "A being that watches existence from outside" },
      { id: 134, name: "Beyond Walker", level: 28, maxHp: 168, currentHp: 168, attack: 29, goldReward: 28, description: "An entity that exists outside normal space" },
      { id: 135, name: "Narrative Force", level: 29, maxHp: 173, currentHp: 173, attack: 30, goldReward: 29, description: "The power that shapes all stories" },
      { id: 136, name: "Fourth Wall", level: 29, maxHp: 178, currentHp: 178, attack: 30, goldReward: 29, description: "The barrier between fiction and reality" },
      { id: 137, name: "Meta Guardian", level: 30, maxHp: 183, currentHp: 183, attack: 31, goldReward: 30, description: "Protector of the reality layer" },
      { id: 138, name: "Transcendent One", level: 30, maxHp: 190, currentHp: 190, attack: 31, goldReward: 90, description: "🏆 MINI-BOSS: Being beyond all comprehension" }
    ]
  },
  {
    id: "source_codex",
    name: "The Source Codex",
    description: "The fundamental programming language of reality itself",
    background: "#228B22",
    storyIntro: "You access the underlying code that defines existence itself. Digital deities and programming primordials guard the source code of reality, ready to debug your very existence...",
    completionStory: "The codex accepts your input as the architect yields. You now understand the fundamental algorithms of existence.",
    monsters: [
      { id: 139, name: "Bug Entity", level: 29, maxHp: 170, currentHp: 170, attack: 30, goldReward: 29, description: "A glitch in the code of reality" },
      { id: 140, name: "Syntax Guardian", level: 29, maxHp: 175, currentHp: 175, attack: 30, goldReward: 29, description: "Protector of logical structure" },
      { id: 141, name: "Algorithm God", level: 30, maxHp: 180, currentHp: 180, attack: 31, goldReward: 30, description: "A divine being of pure logic" },
      { id: 142, name: "Code Compiler", level: 30, maxHp: 185, currentHp: 185, attack: 31, goldReward: 30, description: "The force that makes reality executable" },
      { id: 143, name: "System Admin", level: 31, maxHp: 190, currentHp: 190, attack: 32, goldReward: 31, description: "The ultimate user with root access" },
      { id: 144, name: "Reality Architect", level: 31, maxHp: 195, currentHp: 195, attack: 32, goldReward: 95, description: "🏆 MINI-BOSS: Programmer of existence itself" }
    ]
  },
  {
    id: "omega_terminus",
    name: "The Omega Terminus",
    description: "The theoretical end point where all possibilities converge",
    background: "#8B0000",
    storyIntro: "You reach the ultimate endpoint where all journeys end and all stories conclude. Omega entities representing the finality of existence prepare for the ultimate test...",
    completionStory: "The terminus acknowledges your achievement as the omega sovereign yields. You have reached the theoretical peak of dedication.",
    monsters: [
      { id: 145, name: "End Walker", level: 30, maxHp: 177, currentHp: 177, attack: 31, goldReward: 30, description: "A being that represents conclusion" },
      { id: 146, name: "Final Echo", level: 30, maxHp: 182, currentHp: 182, attack: 31, goldReward: 30, description: "The last reverberation of existence" },
      { id: 147, name: "Terminus Guard", level: 31, maxHp: 187, currentHp: 187, attack: 32, goldReward: 31, description: "Protector of the ultimate endpoint" },
      { id: 148, name: "Omega Angel", level: 31, maxHp: 192, currentHp: 192, attack: 32, goldReward: 31, description: "Herald of the final achievement" },
      { id: 149, name: "Conclusion Lord", level: 32, maxHp: 197, currentHp: 197, attack: 33, goldReward: 32, description: "Master of all endings" },
      { id: 150, name: "Omega Sovereign", level: 32, maxHp: 200, currentHp: 200, attack: 33, goldReward: 100, description: "🏆 MINI-BOSS: The ultimate challenge" }
    ]
  },
  {
    id: "infinite_recursion",
    name: "The Infinite Recursion",
    description: "A loop of existence that calls itself endlessly",
    background: "#FF1493",
    storyIntro: "You enter a space that contains itself, where recursive entities loop through infinite iterations of self-reference. Each battle echoes endlessly through fractal dimensions...",
    completionStory: "The recursion terminates as the loop lord yields. Infinity folds back upon itself, acknowledging your singular achievement.",
    monsters: [
      { id: 151, name: "Self Reference", level: 31, maxHp: 184, currentHp: 184, attack: 32, goldReward: 31, description: "A being that defines itself" },
      { id: 152, name: "Recursive Echo", level: 31, maxHp: 189, currentHp: 189, attack: 32, goldReward: 31, description: "An entity calling itself infinitely" },
      { id: 153, name: "Fractal Mind", level: 32, maxHp: 194, currentHp: 194, attack: 33, goldReward: 32, description: "Consciousness that contains itself" },
      { id: 154, name: "Loop Guardian", level: 32, maxHp: 199, currentHp: 199, attack: 33, goldReward: 32, description: "Protector of endless cycles" },
      { id: 155, name: "Infinite Mirror", level: 33, maxHp: 204, currentHp: 204, attack: 34, goldReward: 33, description: "Reflection reflecting itself forever" },
      { id: 156, name: "Recursion Lord", level: 33, maxHp: 205, currentHp: 205, attack: 34, goldReward: 105, description: "🏆 MINI-BOSS: Master of self-containing loops" }
    ]
  },
  {
    id: "absolute_zero",
    name: "The Absolute Zero",
    description: "The theoretical point where all motion and possibility cease",
    background: "#000080",
    storyIntro: "You enter a realm of perfect stillness where entropy itself has been defeated. Zero-point entities represent the absence of all things, challenging the very notion of existence...",
    completionStory: "Motion returns to the stillness as the null emperor falls. You have proven that dedication can overcome even absolute nothingness.",
    monsters: [
      { id: 157, name: "Void Null", level: 32, maxHp: 191, currentHp: 191, attack: 33, goldReward: 32, description: "The absence of existence itself" },
      { id: 158, name: "Zero Point", level: 32, maxHp: 196, currentHp: 196, attack: 33, goldReward: 32, description: "The theoretical minimum of all things" },
      { id: 159, name: "Entropy's End", level: 33, maxHp: 201, currentHp: 201, attack: 34, goldReward: 33, description: "The cessation of all change" },
      { id: 160, name: "Perfect Vacuum", level: 33, maxHp: 206, currentHp: 206, attack: 34, goldReward: 33, description: "The absence of all matter and energy" },
      { id: 161, name: "Null Consciousness", level: 34, maxHp: 211, currentHp: 211, attack: 35, goldReward: 34, description: "Awareness of absolute nothingness" },
      { id: 162, name: "Null Emperor", level: 34, maxHp: 210, currentHp: 210, attack: 35, goldReward: 110, description: "🏆 MINI-BOSS: Sovereign of absolute emptiness" }
    ]
  },
  {
    id: "beyond_beyond",
    name: "The Beyond Beyond",
    description: "A place that exists past the concept of 'beyond' itself",
    background: "#FF4500",
    storyIntro: "You step into a realm that transcends transcendence itself. Here, entities exist that are beyond the very concept of being beyond, challenging the limits of imagination...",
    completionStory: "The beyond yields to your determination as the hyper-entity acknowledges your impossible achievement. You have gone beyond beyond.",
    monsters: [
      { id: 163, name: "Meta-Beyond", level: 33, maxHp: 198, currentHp: 198, attack: 34, goldReward: 33, description: "Beyond the concept of beyond" },
      { id: 164, name: "Hyper-Transcendent", level: 33, maxHp: 203, currentHp: 203, attack: 34, goldReward: 33, description: "Transcending transcendence itself" },
      { id: 165, name: "Ultra-Concept", level: 34, maxHp: 208, currentHp: 208, attack: 35, goldReward: 34, description: "A concept beyond conceptualization" },
      { id: 166, name: "Mega-Reality", level: 34, maxHp: 213, currentHp: 213, attack: 35, goldReward: 34, description: "Reality beyond reality's boundaries" },
      { id: 167, name: "Giga-Existence", level: 35, maxHp: 218, currentHp: 218, attack: 36, goldReward: 35, description: "Existence beyond existing" },
      { id: 168, name: "Beyond Entity", level: 35, maxHp: 215, currentHp: 215, attack: 36, goldReward: 115, description: "🏆 MINI-BOSS: Being beyond beyondness" }
    ]
  },
  {
    id: "ultimate_pinnacle",
    name: "The Ultimate Pinnacle",
    description: "The absolute peak of all possible achievement",
    background: "#FFD700",
    storyIntro: "You stand at the theoretical maximum of dedication and achievement. Here, the ultimate entities represent the pinnacle of what is possible through unwavering commitment...",
    completionStory: "The pinnacle bows to your unmatched dedication as the apex sovereign yields. You have achieved the ultimate - perfect commitment to your journey.",
    monsters: [
      { id: 169, name: "Peak Essence", level: 34, maxHp: 205, currentHp: 205, attack: 35, goldReward: 34, description: "The concentrated essence of achievement" },
      { id: 170, name: "Summit Guardian", level: 34, maxHp: 210, currentHp: 210, attack: 35, goldReward: 34, description: "Protector of the highest point" },
      { id: 171, name: "Zenith Lord", level: 35, maxHp: 215, currentHp: 215, attack: 36, goldReward: 35, description: "Master of ultimate heights" },
      { id: 172, name: "Apex Angel", level: 35, maxHp: 220, currentHp: 220, attack: 36, goldReward: 35, description: "Herald of perfect achievement" },
      { id: 173, name: "Pinnacle God", level: 36, maxHp: 225, currentHp: 225, attack: 37, goldReward: 36, description: "Divine embodiment of peak performance" },
      { id: 174, name: "Apex Sovereign", level: 36, maxHp: 250, currentHp: 250, attack: 37, goldReward: 200, description: "🏆 FINAL B-RANK BOSS: Ultimate test of dedication" }
    ]
  }
];

// A-rank Dungeon Zones (64 weeks to complete - 2x B-rank time)
const ARANK_DUNGEON_ZONES: DungeonZone[] = [
  {
    id: "primordial_chaos",
    name: "The Primordial Chaos",
    description: "The raw, unformed potential that existed before existence",
    background: "#800080",
    storyIntro: "You dive into the swirling maelstrom of pure possibility that predates creation itself. Chaos entities of unimaginable power emerge from the primordial soup of reality...",
    completionStory: "Order emerges from chaos as the primordial sovereign acknowledges your mastery. You have tamed the untameable.",
    monsters: [
      { id: 175, name: "Chaos Seed", level: 37, maxHp: 230, currentHp: 230, attack: 38, goldReward: 37, description: "The potential for all disorder" },
      { id: 176, name: "Primordial Wisp", level: 37, maxHp: 235, currentHp: 235, attack: 38, goldReward: 37, description: "A fragment of pre-creation energy" },
      { id: 177, name: "Unformed Giant", level: 38, maxHp: 240, currentHp: 240, attack: 39, goldReward: 38, description: "A titan that never achieved final form" },
      { id: 178, name: "Possibility Storm", level: 38, maxHp: 245, currentHp: 245, attack: 39, goldReward: 38, description: "A tempest of infinite potential" },
      { id: 179, name: "Chaos Architect", level: 39, maxHp: 250, currentHp: 250, attack: 40, goldReward: 39, description: "Designer of ordered disorder" },
      { id: 180, name: "Primordial Sovereign", level: 39, maxHp: 275, currentHp: 275, attack: 40, goldReward: 150, description: "🏆 MINI-BOSS: Ruler of original chaos" }
    ]
  },
  {
    id: "akashic_records",
    name: "The Akashic Records",
    description: "The universal database containing all knowledge that ever was or will be",
    background: "#4B0082",
    storyIntro: "You enter the cosmic library where every thought, action, and possibility is recorded for eternity. Knowledge guardians protect the infinite wisdom stored within...",
    completionStory: "The records acknowledge your worthiness as the archive keeper yields. All knowledge flows through your consciousness.",
    monsters: [
      { id: 181, name: "Memory Fragment", level: 38, maxHp: 237, currentHp: 237, attack: 39, goldReward: 38, description: "A shard of forgotten knowledge" },
      { id: 182, name: "Living Library", level: 38, maxHp: 242, currentHp: 242, attack: 39, goldReward: 38, description: "A repository of endless information" },
      { id: 183, name: "Wisdom Guardian", level: 39, maxHp: 247, currentHp: 247, attack: 40, goldReward: 39, description: "Protector of ancient knowledge" },
      { id: 184, name: "Truth Seeker", level: 39, maxHp: 252, currentHp: 252, attack: 40, goldReward: 39, description: "An entity pursuing absolute truth" },
      { id: 185, name: "Omniscient Eye", level: 40, maxHp: 257, currentHp: 257, attack: 41, goldReward: 40, description: "The all-seeing observer of reality" },
      { id: 186, name: "Archive Keeper", level: 40, maxHp: 280, currentHp: 280, attack: 41, goldReward: 155, description: "🏆 MINI-BOSS: Guardian of infinite knowledge" }
    ]
  },
  {
    id: "divine_forge",
    name: "The Divine Forge",
    description: "The cosmic smithy where gods craft the fundamental forces of reality",
    background: "#B22222",
    storyIntro: "You enter the workshop of the gods where reality itself is hammered into shape. Divine smiths work tirelessly, forging the laws of physics on anvils of pure energy...",
    completionStory: "The forge acknowledges your strength as the cosmic smith yields. You are now worthy to shape reality itself.",
    monsters: [
      { id: 187, name: "Forge Spirit", level: 39, maxHp: 244, currentHp: 244, attack: 40, goldReward: 39, description: "The essence of divine craftsmanship" },
      { id: 188, name: "Reality Hammer", level: 39, maxHp: 249, currentHp: 249, attack: 40, goldReward: 39, description: "A tool that shapes existence itself" },
      { id: 189, name: "Divine Anvil", level: 40, maxHp: 254, currentHp: 254, attack: 41, goldReward: 40, description: "The foundation upon which reality is forged" },
      { id: 190, name: "Cosmic Bellows", level: 40, maxHp: 259, currentHp: 259, attack: 41, goldReward: 40, description: "The breath that fans the fires of creation" },
      { id: 191, name: "God-Smith", level: 41, maxHp: 264, currentHp: 264, attack: 42, goldReward: 41, description: "A divine craftsman of reality" },
      { id: 192, name: "Cosmic Smith", level: 41, maxHp: 285, currentHp: 285, attack: 42, goldReward: 160, description: "🏆 MINI-BOSS: Master forger of existence" }
    ]
  },
  {
    id: "eternal_moment",
    name: "The Eternal Moment",
    description: "A single instant stretched across infinite time",
    background: "#20B2AA",
    storyIntro: "You step into a moment that lasts forever, where time has crystallized into a perfect eternal now. Temporal entities exist in suspended animation, guarding the secret of timeless existence...",
    completionStory: "Time flows again as the moment keeper yields. You have learned to exist outside the stream of temporal progression.",
    monsters: [
      { id: 193, name: "Frozen Time", level: 40, maxHp: 251, currentHp: 251, attack: 41, goldReward: 40, description: "A shard of crystallized temporal flow" },
      { id: 194, name: "Eternal Echo", level: 40, maxHp: 256, currentHp: 256, attack: 41, goldReward: 40, description: "A sound that never fades" },
      { id: 195, name: "Moment Guardian", level: 41, maxHp: 261, currentHp: 261, attack: 42, goldReward: 41, description: "Protector of the eternal now" },
      { id: 196, name: "Timeless Sage", level: 41, maxHp: 266, currentHp: 266, attack: 42, goldReward: 41, description: "A being existing outside temporal flow" },
      { id: 197, name: "Infinity Clock", level: 42, maxHp: 271, currentHp: 271, attack: 43, goldReward: 42, description: "A timepiece measuring eternity" },
      { id: 198, name: "Moment Keeper", level: 42, maxHp: 290, currentHp: 290, attack: 43, goldReward: 165, description: "🏆 MINI-BOSS: Guardian of eternal now" }
    ]
  },
  {
    id: "perfect_symmetry",
    name: "The Perfect Symmetry",
    description: "A realm of absolute balance and mathematical perfection",
    background: "#DAA520",
    storyIntro: "You enter a space of flawless proportion where every force has its equal opposite. Symmetry entities maintain perfect balance while testing whether you can tip the scales...",
    completionStory: "Balance is preserved as the symmetry lord yields. You have achieved perfect harmony between all opposing forces.",
    monsters: [
      { id: 199, name: "Mirror Twin", level: 41, maxHp: 258, currentHp: 258, attack: 42, goldReward: 41, description: "Your perfect opposite in all things" },
      { id: 200, name: "Balance Point", level: 41, maxHp: 263, currentHp: 263, attack: 42, goldReward: 41, description: "The fulcrum of all equilibrium" },
      { id: 201, name: "Harmonic Resonance", level: 42, maxHp: 268, currentHp: 268, attack: 43, goldReward: 42, description: "Perfect vibrational alignment" },
      { id: 202, name: "Golden Ratio", level: 42, maxHp: 273, currentHp: 273, attack: 43, goldReward: 42, description: "The mathematical essence of beauty" },
      { id: 203, name: "Equilibrium Master", level: 43, maxHp: 278, currentHp: 278, attack: 44, goldReward: 43, description: "Keeper of perfect balance" },
      { id: 204, name: "Symmetry Lord", level: 43, maxHp: 295, currentHp: 295, attack: 44, goldReward: 170, description: "🏆 MINI-BOSS: Master of all proportion" }
    ]
  }
];

// Flatten all monsters for compatibility with existing code
const ERANK_MONSTERS: Monster[] = ERANK_DUNGEON_ZONES.flatMap(zone => zone.monsters);
const DRANK_MONSTERS: Monster[] = DRANK_DUNGEON_ZONES.flatMap(zone => zone.monsters);
const CRANK_MONSTERS: Monster[] = CRANK_DUNGEON_ZONES.flatMap(zone => zone.monsters);
const BRANK_MONSTERS: Monster[] = BRANK_DUNGEON_ZONES.flatMap(zone => zone.monsters);
const ARANK_MONSTERS: Monster[] = ARANK_DUNGEON_ZONES.flatMap(zone => zone.monsters);
const ALL_MONSTERS: Monster[] = [...ERANK_MONSTERS, ...DRANK_MONSTERS, ...CRANK_MONSTERS];

export default function Battle() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setInCombat } = useBackgroundMusic();
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [isMonsterListOpen, setIsMonsterListOpen] = useState(true);
  const [monsterCooldowns, setMonsterCooldowns] = useState<{[key: number]: number}>({});
  
  // Persistent health state (survives between battles)
  const [persistentPlayerHp, setPersistentPlayerHp] = useState<number | null>(null);
  const [lastRegenTime, setLastRegenTime] = useState<number>(Date.now());
  
  // Animation states
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);
  const [isPlayerTakingDamage, setIsPlayerTakingDamage] = useState(false);
  const [isMonsterTakingDamage, setIsMonsterTakingDamage] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<Array<{id: number, damage: number, x: number, y: number, isPlayer: boolean}>>([]);
  


  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  // Initialize battle state
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  // Manage combat music based on battle state
  useEffect(() => {
    const inCombat = battleState !== null;
    setInCombat(inCombat);
  }, [battleState, setInCombat]);

  // Cleanup combat state when leaving the battle page
  useEffect(() => {
    return () => {
      setInCombat(false);
    };
  }, [setInCombat]);

  // Health regeneration effect - 1% per minute
  useEffect(() => {
    if (!userStats) return;
    
    const playerMaxHp = Math.max(10, 10 + userStats.stamina * 3);
    
    // Initialize persistent HP to full if not set
    if (persistentPlayerHp === null) {
      setPersistentPlayerHp(playerMaxHp);
      return;
    }
    
    // Calculate regeneration
    const currentTime = Date.now();
    const timeDiff = currentTime - lastRegenTime;
    const minutesPassed = Math.floor(timeDiff / (60 * 1000));
    
    if (minutesPassed > 0 && persistentPlayerHp < playerMaxHp) {
      const regenAmount = Math.ceil(playerMaxHp * 0.01 * minutesPassed); // 1% per minute
      const newHp = Math.min(playerMaxHp, persistentPlayerHp + regenAmount);
      
      if (newHp > persistentPlayerHp) {
        setPersistentPlayerHp(newHp);
        setLastRegenTime(currentTime);
        
        // Show regeneration message if not in battle
        if (!battleState && newHp > persistentPlayerHp) {
          toast({
            title: "Health Regenerated",
            description: `You recovered ${newHp - persistentPlayerHp} HP (${newHp}/${playerMaxHp})`,
          });
        }
      }
    }
  }, [userStats, persistentPlayerHp, lastRegenTime, battleState]);

  const startBattle = (monster: Monster) => {
    // Check if monster is on cooldown
    const currentTime = Date.now();
    const cooldownTime = monsterCooldowns[monster.id];
    
    if (cooldownTime && currentTime < cooldownTime) {
      const remainingMinutes = Math.ceil((cooldownTime - currentTime) / (1000 * 60));
      toast({
        title: "Monster on Cooldown",
        description: `${monster.name} is resting. Try again in ${remainingMinutes} minute(s).`,
        variant: "destructive",
      });
      return;
    }

    // Calculate player's max HP and MP based on stats
    const playerMaxHp = Math.max(10, 10 + (userStats?.stamina || 0) * 3);
    const playerMaxMp = Math.max(5, (userStats?.stamina || 0) * 2 + (userStats?.agility || 0) * 1);
    
    // Use persistent HP instead of resetting to full
    const currentPlayerHp = persistentPlayerHp || playerMaxHp;
    
    // Special case for Green Slime - spawn 2 of them
    let monsters: Monster[] = [];
    let battleLog: string[] = [];
    
    if (monster.name === "Green Slime") {
      monsters = [
        { ...monster, currentHp: monster.maxHp, id: monster.id + 100 }, // First slime
        { ...monster, currentHp: monster.maxHp, id: monster.id + 200 }  // Second slime
      ];
      battleLog = [`Two Green Slimes appear!`, `First slime bounces forward!`];
    } else {
      monsters = [{ ...monster, currentHp: monster.maxHp }];
      battleLog = [`A wild ${monster.name} appears!`];
    }
    
    setBattleState({
      playerHp: currentPlayerHp,
      playerMaxHp,
      playerMp: playerMaxMp,
      playerMaxMp,
      monster: monsters[0],
      battleLog,
      isPlayerTurn: true,
      battleResult: 'ongoing',
      remainingMonsters: monsters.slice(1),
      currentMonsterIndex: 0,
      totalMonsters: monsters.length
    });
    setSelectedMonster(null);
  };

  // Update player HP when stats load
  useEffect(() => {
    if (userStats && battleState && battleState.battleResult === 'ongoing') {
      const newMaxHp = Math.max(10, 10 + userStats.stamina * 3);
      // Only update if the maxHp has actually changed
      if (battleState.playerMaxHp !== newMaxHp) {
        setBattleState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            playerMaxHp: newMaxHp,
            playerHp: Math.min(prev.playerHp, newMaxHp)
          };
        });
      }
    }
  }, [userStats]);

  const updateStatsMutation = useMutation({
    mutationFn: async (params: { goldGain: number; battleWon?: boolean }) => {
      const response = await fetch('/api/user/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Failed to update stats');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    }
  });

  const playerAttack = () => {
    if (!battleState || !battleState.isPlayerTurn || battleState.battleResult !== 'ongoing') return;
    
    // Check if player has enough MP (2 MP per attack)
    if (battleState.playerMp < 2) {
      setBattleState(prev => ({
        ...prev!,
        battleLog: [...prev!.battleLog, "Not enough MP to attack!"]
      }));
      return;
    }

    // Start player attack animation
    setIsPlayerAttacking(true);
    setTimeout(() => setIsPlayerAttacking(false), 600);

    // Strength modifies damage (base 3 damage + strength bonus)
    const playerStrength = userStats?.strength || 5;
    const baseDamage = 3 + Math.floor(playerStrength / 2);
    const damage = baseDamage + Math.floor(Math.random() * 3); // 1-3 random bonus

    // Add damage number animation after a short delay (when attack connects)
    setTimeout(() => {
      setIsMonsterTakingDamage(true);
      setTimeout(() => setIsMonsterTakingDamage(false), 400);
      
      // Add floating damage number
      const damageId = Date.now();
      setDamageNumbers(prev => [...prev, {
        id: damageId,
        damage,
        x: 60 + Math.random() * 20, // Random position around monster
        y: 40 + Math.random() * 20,
        isPlayer: false
      }]);
      
      // Remove damage number after animation
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== damageId));
      }, 1000);
    }, 300);

    const newMonsterHp = Math.max(0, battleState.monster.currentHp - damage);
    const isMonsterDefeated = newMonsterHp === 0;

    setBattleState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        monster: { ...prev.monster, currentHp: newMonsterHp },
        playerMp: prev.playerMp - 2, // Consume 2 MP per attack
        battleLog: [...prev.battleLog, `You strike for ${damage} damage!`],
        isPlayerTurn: false,
        battleResult: isMonsterDefeated && prev.remainingMonsters.length === 0 ? 'victory' : 'ongoing'
      };
    });

    if (isMonsterDefeated) {
      setTimeout(() => {
        setBattleState(prev => {
          if (!prev) return prev;
          
          // Check if there are more monsters to fight
          if (prev.remainingMonsters.length > 0) {
            const nextMonster = prev.remainingMonsters[0];
            const remainingAfterNext = prev.remainingMonsters.slice(1);
            
            return {
              ...prev,
              monster: nextMonster,
              remainingMonsters: remainingAfterNext,
              currentMonsterIndex: prev.currentMonsterIndex + 1,
              battleLog: [...prev.battleLog, `${prev.monster.name} is defeated!`, `Second slime bounces forward!`],
              isPlayerTurn: true,
              battleResult: 'ongoing'
            };
          } else {
            // All monsters defeated - battle won
            // Set 10-minute cooldown for the original monster type
            const originalMonsterId = prev.totalMonsters > 1 ? 1 : prev.monster.id; // Green Slime ID is 1
            const cooldownEndTime = Date.now() + (10 * 60 * 1000);
            setMonsterCooldowns(currentCooldowns => ({
              ...currentCooldowns,
              [originalMonsterId]: cooldownEndTime
            }));
            
            const totalGoldReward = prev.monster.goldReward * prev.totalMonsters;
            
            updateStatsMutation.mutate({ 
              goldGain: totalGoldReward, 
              battleWon: true 
            });
            
            toast({
              title: "Victory!",
              description: `You defeated all enemies and gained ${totalGoldReward} gold!`,
            });
            
            return {
              ...prev,
              battleLog: [...prev.battleLog, `${prev.monster.name} is defeated!`, `All enemies defeated!`, `You gain ${totalGoldReward} gold coins!`],
              battleResult: 'victory'
            };
          }
        });
      }, 1000);
    } else {
      setTimeout(() => monsterAttack(), 1500);
    }
  };

  const monsterAttack = () => {
    if (!battleState || battleState.battleResult !== 'ongoing') return;

    // Start monster attack animation
    setIsMonsterAttacking(true);
    setTimeout(() => setIsMonsterAttacking(false), 600);

    // Agility determines evasion chance (5% per agility point, max 90%)
    const playerAgility = userStats?.agility || 5;
    const evasionChance = Math.min(0.9, (playerAgility * 0.05));
    const isEvaded = Math.random() < evasionChance;

    if (isEvaded) {
      setBattleState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          battleLog: [...prev.battleLog, `You dodge the ${prev.monster.name}'s attack!`],
          isPlayerTurn: true
        };
      });
      return;
    }

    const damage = battleState.monster.attack;
    
    // Add damage animation and floating number after a short delay
    setTimeout(() => {
      setIsPlayerTakingDamage(true);
      setTimeout(() => setIsPlayerTakingDamage(false), 400);
      
      // Add floating damage number
      const damageId = Date.now();
      setDamageNumbers(prev => [...prev, {
        id: damageId,
        damage,
        x: 20 + Math.random() * 20, // Random position around player
        y: 40 + Math.random() * 20,
        isPlayer: true
      }]);
      
      // Remove damage number after animation
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== damageId));
      }, 1000);
    }, 300);

    const newPlayerHp = Math.max(0, battleState.playerHp - damage);
    const isPlayerDefeated = newPlayerHp === 0;

    setBattleState(prev => {
      if (!prev) return prev;
      // Player regenerates 1 MP per turn (max of playerMaxMp)
      const mpRegen = Math.min(1, prev.playerMaxMp - prev.playerMp);
      
      // Update persistent HP when player takes damage
      setPersistentPlayerHp(newPlayerHp);
      
      return {
        ...prev,
        playerHp: newPlayerHp,
        playerMp: prev.playerMp + mpRegen,
        battleLog: [...prev.battleLog, `${prev.monster.name} attacks for ${damage} damage!`, ...(mpRegen > 0 ? [`You recover ${mpRegen} MP`] : [])],
        isPlayerTurn: true,
        battleResult: isPlayerDefeated ? 'defeat' : 'ongoing'
      };
    });

    if (isPlayerDefeated) {
      toast({
        title: "Defeat",
        description: "You have been defeated! Train harder and come back stronger!",
        variant: "destructive"
      });
    }
  };

  const returnToMonsterList = () => {
    // Save current HP to persistent state when leaving battle
    if (battleState) {
      setPersistentPlayerHp(battleState.playerHp);
      setLastRegenTime(Date.now());
    }
    setBattleState(null);
  };

  // Helper function to check if monster is on cooldown
  const isMonsterOnCooldown = (monsterId: number) => {
    const cooldownTime = monsterCooldowns[monsterId];
    return cooldownTime && Date.now() < cooldownTime;
  };

  // Helper function to get remaining cooldown time in minutes
  const getRemainingCooldown = (monsterId: number) => {
    const cooldownTime = monsterCooldowns[monsterId];
    if (!cooldownTime) return 0;
    const remaining = cooldownTime - Date.now();
    return Math.max(0, Math.ceil(remaining / (1000 * 60)));
  };

  // Update cooldown display and health regeneration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Update monster cooldowns
      setMonsterCooldowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        // Remove expired cooldowns
        Object.keys(updated).forEach(key => {
          const monsterId = parseInt(key);
          if (updated[monsterId] && now >= updated[monsterId]) {
            delete updated[monsterId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
      
      // Trigger health regeneration check
      setLastRegenTime(prev => {
        const timeDiff = now - prev;
        const minutesPassed = Math.floor(timeDiff / (60 * 1000));
        
        if (minutesPassed > 0) {
          return now; // Update timestamp to trigger regeneration
        }
        return prev;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Monster Selection View
  if (!battleState) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        
        
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Battle Arena</h1>
                <p className="text-muted-foreground mt-1">Choose your opponent and fight for gold coins</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Player Health Status */}
          {userStats && persistentPlayerHp !== null && (
            <Card className="bg-card border-border mb-6">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-green-400" />
                  <span>Your Health Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* HP Bar */}
                  <div className="w-full">
                    <div className="relative w-full bg-gray-800 rounded-full h-6 border border-gray-400 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-600 to-green-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${(persistentPlayerHp / Math.max(10, 10 + userStats.stamina * 3)) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-lg">
                        HP: {persistentPlayerHp}/{Math.max(10, 10 + userStats.stamina * 3)}
                      </div>
                    </div>
                  </div>
                  
                  {/* MP Bar */}
                  <div className="w-full">
                    <div className="relative w-full bg-gray-800 rounded-full h-6 border border-gray-400 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${(userStats.currentMp / userStats.maxMp) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-lg">
                        MP: {userStats.currentMp}/{userStats.maxMp}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}



        {/* E-rank Dungeon Zones */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsMonsterListOpen(!isMonsterListOpen)}
              >
                <div className="flex items-center space-x-2">
                  <Skull className="w-6 h-6 text-white !text-white" />
                  <span>E-rank Dungeons</span>
                  <span className="text-xs bg-white/20 text-white !text-white px-2 py-1 rounded">COMMON</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">Lv 1-10</span>
                </div>
                {isMonsterListOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isMonsterListOpen && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ERANK_DUNGEON_ZONES.map((zone) => (
                    <Card key={zone.id} className="bg-card border-border hover:border-primary hover:shadow-lg cursor-pointer">
                      <CardContent className="p-3 text-center">
                        <div 
                          className="w-6 h-6 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: zone.background }}
                        />
                        <h3 className="font-medium text-sm">{zone.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{zone.monsters.length} monsters</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {isMonsterListOpen && (
                <div className="space-y-6">
                  {ERANK_DUNGEON_ZONES.map((zone) => (
                    <Card key={zone.id} className="bg-card border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: zone.background }}
                          />
                          <span>{zone.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 p-3 bg-muted/50 rounded border-l-4 border-primary text-sm">
                          {zone.storyIntro}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {zone.monsters.map((monster, index) => {
                            const onCooldown = isMonsterOnCooldown(monster.id);
                            const remainingTime = getRemainingCooldown(monster.id);
                            const isBoss = monster.description.includes('MINI-BOSS');
                            
                            return (
                              <Card 
                                key={monster.id}
                                className={`transition-all duration-200 ${
                                  onCooldown 
                                    ? 'opacity-40 cursor-not-allowed bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 shadow-none' 
                                    : `bg-card border-border hover:border-primary hover:shadow-lg hover:scale-105 cursor-pointer ${
                                        isBoss ? 'ring-2 ring-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-orange-900/20' : ''
                                      }`
                                }`}
                                onClick={() => !onCooldown && startBattle(monster)}
                              >
                                <CardContent className={`p-3 ${onCooldown ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
                                  <div className="flex items-start space-x-4">
                                    {/* Monster Image */}
                                    {monster.image && (
                                      <div className="flex-shrink-0 relative">
                                        <img 
                                          src={monster.image} 
                                          alt={monster.name}
                                          className={`w-16 h-16 object-contain rounded-lg border border-border bg-transparent ${
                                            onCooldown ? 'grayscale' : ''
                                          }`}
                                          style={{ backgroundColor: 'transparent' }}
                                        />
                                        {onCooldown && (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Monster Info */}
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <h3 className={`font-bold ${onCooldown ? 'text-gray-400' : 'text-foreground'}`}>
                                          {monster.name}
                                        </h3>
                                        <span className={`text-sm px-2 py-1 rounded ${
                                          onCooldown 
                                            ? 'bg-gray-500 text-gray-300 border border-gray-400' 
                                            : 'bg-red-700 text-white'
                                        }`}>
                                          Lv.{monster.level}
                                        </span>
                                      </div>
                                      
                                      {onCooldown ? (
                                        <div className="text-orange-400 text-sm mb-3 flex items-center">
                                          <Clock className="w-4 h-4 mr-1" />
                                          Resting for {remainingTime} minute(s)
                                        </div>
                                      ) : (
                                        <p className="text-muted-foreground text-sm mb-3">{monster.description}</p>
                                      )}
                                      
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="flex items-center space-x-1">
                                          <Heart className={`w-3 h-3 ${onCooldown ? 'text-gray-400' : 'text-red-400'}`} />
                                          <span className={onCooldown ? 'text-gray-400' : ''}>{monster.maxHp}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <Sword className={`w-3 h-3 ${onCooldown ? 'text-gray-400' : 'text-orange-400'}`} />
                                          <span className={onCooldown ? 'text-gray-400' : ''}>{monster.attack}</span>
                                        </div>
                                        <div className={`flex items-center space-x-1 ${onCooldown ? 'text-gray-400' : 'text-yellow-400'}`}>
                                          <Coins className="w-3 h-3" />
                                          <span>{monster.goldReward}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* D-rank Dungeon Zones */}
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Skull className="w-6 h-6 text-green-300" />
                <span>D-rank Dungeons</span>
                <span className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">UNCOMMON</span>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">Lv 10-20</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm italic">
                Complete all E-rank dungeons to unlock intermediate challenges with elemental themes and greater rewards.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4 opacity-50">
                {DRANK_DUNGEON_ZONES.map((zone) => (
                  <Card key={zone.id} className="bg-muted/30 border-muted">
                    <CardContent className="p-3 text-center">
                      <div 
                        className="w-6 h-6 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: zone.background }}
                      />
                      <h3 className="font-medium text-sm">{zone.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{zone.monsters.length} monsters</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* C-rank Dungeon Zones */}
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Skull className="w-6 h-6 text-blue-300" />
                <span>C-rank Dungeons</span>
                <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">RARE</span>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">Lv 20-30</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm italic">
                Master D-rank content to face cosmic horrors, temporal paradoxes, and transcendent beings. Only the most dedicated adventurers reach this level.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 opacity-50">
                {CRANK_DUNGEON_ZONES.map((zone) => (
                  <Card key={zone.id} className="bg-muted/30 border-muted">
                    <CardContent className="p-3 text-center">
                      <div 
                        className="w-6 h-6 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: zone.background }}
                      />
                      <h3 className="font-medium text-sm">{zone.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{zone.monsters.length} monsters</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* B-rank Dungeons - Locked Preview */}
          <Card className="bg-card/50 border-purple-600/20 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Skull className="w-6 h-6 text-purple-300" />
                <span>B-rank Dungeons</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">EPIC</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">Lv 30-50</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                    In Development
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 opacity-60">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
                    <Skull className="w-8 h-8 text-purple-300" />
                  </div>
                  <h3 className="text-lg font-bold text-purple-300 mb-2">Secrets Await</h3>
                  <p className="text-muted-foreground text-sm">Epic challenges hidden until unlocked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* A-rank Dungeons - Locked Preview */}
          <Card className="bg-card/50 border-yellow-600/20 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Skull className="w-6 h-6 text-yellow-300" />
                <span>A-rank Dungeons</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded">LEGENDARY</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">Lv 50-75</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                    In Development
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 opacity-60">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-600/20 flex items-center justify-center mx-auto mb-4">
                    <Skull className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h3 className="text-lg font-bold text-yellow-300 mb-2">Secrets Await</h3>
                  <p className="text-muted-foreground text-sm">Legendary trials shrouded in mystery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* S-rank Dungeons - Coming Soon */}
          <Card className="bg-card/30 border-orange-600/30 mt-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/10 to-orange-800/5"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-2">
                <Skull className="w-6 h-6 text-orange-300" />
                <span>S-rank Dungeons</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-orange-600/20 text-orange-300 px-2 py-1 rounded">MYTHIC</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">Lv 75-100</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                    In Development
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-muted-foreground text-sm italic mb-4">
                The mythic apex of all challenges. Reserved for the most elite fitness warriors who have transcended mortal limits. Details shrouded in mystery...
              </p>
              <div className="flex items-center justify-center py-12 opacity-60">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
                    <Skull className="w-8 h-8 text-orange-300" />
                  </div>
                  <h3 className="text-lg font-bold text-orange-300 mb-2">Secrets Await</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    The ultimate dungeons are being forged in the fires of legend. Only those who master A-rank content will be deemed worthy...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }

  const playerHpPercentage = (battleState.playerHp / battleState.playerMaxHp) * 100;
  const monsterHpPercentage = (battleState.monster.currentHp / battleState.monster.maxHp) * 100;

  // Battle View - Classic RPG Style
  return (
    <div 
      className="h-screen bg-cover bg-center bg-no-repeat text-black flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${forestBackgroundImage})`
      }}
    >
      {/* Header */}
      <div className="bg-black/70 text-white px-4 py-2 flex items-center justify-center backdrop-blur-sm">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={returnToMonsterList}
          className="text-blue-100 hover:text-yellow-200 absolute left-4"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="text-lg font-bold text-blue-100">Battle Arena</div>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 flex flex-col relative">


        {/* Combatants Area */}
        <div className="flex-1 flex items-center justify-between px-1" style={{ paddingTop: 'calc(15% - 20px)', marginLeft: '-10px' }}>
          {/* Player Avatar (Left) */}
          <div className="flex flex-col items-center">
            {/* Player Health Bars - Above Character */}
            <div className="w-32 space-y-1 mb-2">
              {/* HP Bar */}
              <div className="relative">
                <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-400 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-green-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${playerHpPercentage}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                  HP: {battleState.playerHp}/{battleState.playerMaxHp}
                </div>
              </div>
              
              {/* MP Bar */}
              <div className="relative">
                <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-400 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${(battleState.playerMp / battleState.playerMaxMp) * 100}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                  MP: {battleState.playerMp}/{battleState.playerMaxMp}
                </div>
              </div>
            </div>
            
            <div className="w-44 h-44 flex items-end justify-center relative">
              <img 
                src={battlePlayerImage} 
                alt="Player Character"
                className={`w-40 h-40 object-contain transition-all duration-300 ${
                  isPlayerAttacking ? 'translate-x-8 scale-110' : ''
                } ${
                  isPlayerTakingDamage ? 'animate-pulse' : ''
                }`}
                style={{ 
                  imageRendering: 'pixelated',
                  filter: `drop-shadow(2px 2px 4px rgba(0,0,0,0.8)) ${isPlayerTakingDamage ? 'hue-rotate(0deg) brightness(1.5) saturate(2)' : ''}`,
                  transform: `translateY(-15px) ${isPlayerAttacking ? 'translateX(20px) scale(1.1)' : ''}`
                }}
              />
              {/* Damage numbers for player */}
              {damageNumbers.filter(d => d.isPlayer).map(damage => (
                <div
                  key={damage.id}
                  className="absolute pointer-events-none text-red-500 font-bold text-xl animate-ping"
                  style={{
                    left: `${damage.x}%`,
                    top: `${damage.y}%`,
                    animation: 'damageFloat 1s ease-out forwards',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  -{damage.damage}
                </div>
              ))}
            </div>
          </div>



          {/* Monster(s) (Right) */}
          {battleState.totalMonsters > 1 ? (
            // Multiple monsters - show staggered slimes side by side
            <div className="flex flex-col items-center relative" style={{ marginTop: '20px', marginLeft: '-40px', minHeight: '160px', minWidth: '140px' }}>
              
              {/* First Slime - Bottom Left with Health Bar */}
              <div className={`absolute transition-opacity duration-300 ${
                battleState.currentMonsterIndex === 0 ? 'opacity-100' : 'opacity-50'
              }`} style={{ top: '45px', left: '-40px' }}>
                {/* Health Bar for First Slime */}
                <div className="w-32 mb-1">
                  <div className="relative">
                    <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-400 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          battleState.currentMonsterIndex === 0 
                            ? 'bg-gradient-to-r from-red-600 to-red-500' 
                            : battleState.remainingMonsters.length > 0 && battleState.remainingMonsters[0] 
                              ? 'bg-gradient-to-r from-red-600 to-red-500'
                              : 'bg-gray-600'
                        }`}
                        style={{ 
                          width: battleState.currentMonsterIndex === 0 
                            ? `${monsterHpPercentage}%` 
                            : battleState.remainingMonsters.length > 0 && battleState.remainingMonsters[0]
                              ? `${(battleState.remainingMonsters[0].currentHp / battleState.remainingMonsters[0].maxHp) * 100}%`
                              : '100%'
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                      {battleState.currentMonsterIndex === 0 
                        ? `${battleState.monster.currentHp}/${battleState.monster.maxHp}`
                        : battleState.remainingMonsters.length > 0 && battleState.remainingMonsters[0]
                          ? `${battleState.remainingMonsters[0].currentHp}/${battleState.remainingMonsters[0].maxHp}`
                          : '0/13'
                      }
                    </div>
                  </div>
                </div>
                <div className="w-32 h-24 flex items-end justify-center relative">
                  {/* Damage numbers for monster */}
                  {damageNumbers.filter(d => !d.isPlayer).map(damage => (
                    <div
                      key={damage.id}
                      className="absolute pointer-events-none text-yellow-400 font-bold text-xl animate-ping"
                      style={{
                        left: `${damage.x}%`,
                        top: `${damage.y}%`,
                        animation: 'damageFloat 1s ease-out forwards',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      -{damage.damage}
                    </div>
                  ))}
                  {/* Active monster highlight marker - Red oval ring shadow */}
                  {battleState.currentMonsterIndex === 0 && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-28 h-8 border-2 border-red-500 opacity-80 animate-pulse"
                         style={{ 
                           backgroundColor: 'rgba(255, 0, 0, 0.3)',
                           borderRadius: '50%',
                           boxShadow: '0 0 25px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.4), inset 0 0 15px rgba(255, 0, 0, 0.2)'
                         }}>
                    </div>
                  )}
                  {battleState.currentMonsterIndex === 0 && battleState.monster.image ? (
                    <img 
                      src={battleState.monster.image} 
                      alt="Green Slime #1"
                      className={`w-20 h-20 object-contain transition-all duration-300 ${
                        isMonsterAttacking ? '-translate-x-8 scale-110' : ''
                      } ${
                        isMonsterTakingDamage ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        imageRendering: 'pixelated',
                        filter: `drop-shadow(2px 2px 4px rgba(0,0,0,0.8)) ${isMonsterTakingDamage ? 'hue-rotate(0deg) brightness(1.5) saturate(2)' : ''}`,
                        transform: `${isMonsterAttacking ? 'translateX(-20px) scale(1.1)' : ''}`
                      }}
                    />
                  ) : battleState.remainingMonsters.length > 0 && battleState.remainingMonsters[0] && battleState.remainingMonsters[0].image ? (
                    <img 
                      src={battleState.remainingMonsters[0].image} 
                      alt="Green Slime #1"
                      className="w-20 h-20 object-contain"
                      style={{ 
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                      }}
                    />
                  ) : (
                    <Skull className="w-20 h-20 text-red-600" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))' }} />
                  )}
                </div>
              </div>
              
              {/* Second Slime - Top Right with Health Bar */}
              <div className={`absolute transition-opacity duration-300 ${
                battleState.currentMonsterIndex === 1 ? 'opacity-100' : 'opacity-50'
              }`} style={{ top: '0px', left: '40px' }}>
                {/* Health Bar for Second Slime */}
                <div className="w-32 mb-1">
                  <div className="relative">
                    <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-400 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          battleState.currentMonsterIndex === 1 
                            ? 'bg-gradient-to-r from-red-600 to-red-500' 
                            : 'bg-gradient-to-r from-red-600 to-red-500'
                        }`}
                        style={{ 
                          width: battleState.currentMonsterIndex === 1 
                            ? `${monsterHpPercentage}%` 
                            : '100%'
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                      {battleState.currentMonsterIndex === 1 
                        ? `${battleState.monster.currentHp}/${battleState.monster.maxHp}`
                        : '13/13'
                      }
                    </div>
                  </div>
                </div>
                <div className="w-32 h-24 flex items-end justify-center relative">
                  {/* Active monster highlight marker - Red oval ring shadow */}
                  {battleState.currentMonsterIndex === 1 && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-28 h-8 border-2 border-red-500 opacity-80 animate-pulse"
                         style={{ 
                           backgroundColor: 'rgba(255, 0, 0, 0.3)',
                           borderRadius: '50%',
                           boxShadow: '0 0 25px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.4), inset 0 0 15px rgba(255, 0, 0, 0.2)'
                         }}>
                    </div>
                  )}
                  {battleState.monster.image ? (
                    <img 
                      src={battleState.monster.image} 
                      alt="Green Slime #2"
                      className="w-20 h-20 object-contain"
                      style={{ 
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                      }}
                    />
                  ) : (
                    <Skull className="w-20 h-20 text-red-600" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))' }} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Single monster - original layout
            <div className="flex flex-col items-center" style={{ marginTop: '20px', marginLeft: '-60px' }}>
              {/* Monster Health Bar - Above single monster */}
              <div className="w-32 mb-2">
                <div className="relative">
                  <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-400 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${monsterHpPercentage}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                    HP: {battleState.monster.currentHp}/{battleState.monster.maxHp}
                  </div>
                </div>
              </div>
              
              <div className="w-36 h-36 flex items-end justify-center relative">
                {/* Damage numbers for single monster */}
                {damageNumbers.filter(d => !d.isPlayer).map(damage => (
                  <div
                    key={damage.id}
                    className="absolute pointer-events-none text-yellow-400 font-bold text-xl animate-ping"
                    style={{
                      left: `${damage.x}%`,
                      top: `${damage.y}%`,
                      animation: 'damageFloat 1s ease-out forwards',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    -{damage.damage}
                  </div>
                ))}
                {/* Active monster highlight marker - Red oval ring shadow */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-10 border-2 border-red-500 opacity-80 animate-pulse"
                     style={{ 
                       backgroundColor: 'rgba(255, 0, 0, 0.3)',
                       borderRadius: '50%',
                       boxShadow: '0 0 25px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.4), inset 0 0 15px rgba(255, 0, 0, 0.2)'
                     }}>
                </div>
                {battleState.monster.image ? (
                  <img 
                    src={battleState.monster.image} 
                    alt={battleState.monster.name}
                    className={`w-32 h-32 object-contain transition-all duration-300 ${
                      isMonsterAttacking ? '-translate-x-8 scale-110' : ''
                    } ${
                      isMonsterTakingDamage ? 'animate-pulse' : ''
                    }`}
                    style={{ 
                      imageRendering: 'pixelated',
                      filter: `drop-shadow(2px 2px 4px rgba(0,0,0,0.8)) ${isMonsterTakingDamage ? 'hue-rotate(0deg) brightness(1.5) saturate(2)' : ''}`,
                      transform: `${isMonsterAttacking ? 'translateX(-20px) scale(1.1)' : ''}`
                    }}
                  />
                ) : (
                  <Skull className="w-23 h-23 text-red-600" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))' }} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Battle Log Area - Overlaid on battle screen */}
        <div className="absolute left-2 right-2 z-10 bg-black/70 border border-blue-400/50 p-2 min-h-[70px] max-h-[100px] overflow-y-auto backdrop-blur-sm rounded" style={{ bottom: 'calc(5rem + 10px)' }}>
          <div className="text-xs text-white font-medium" style={{ textShadow: '0 0 8px rgba(173, 216, 255, 0.6)' }}>
            {battleState.battleLog.length === 0 ? (
              <div className="text-blue-200/80 italic">Battle begins...</div>
            ) : (
              battleState.battleLog.map((log, index) => (
                <div key={index} className="mb-0.5 text-blue-100 leading-tight" style={{ textShadow: '0 0 6px rgba(173, 216, 255, 0.4)' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compact RPG Action Menu - Overlaid on battle screen */}
        <div className="absolute left-2 right-2 z-20 bg-black/80 text-white p-1 border-2 border-blue-400/80 backdrop-blur-sm rounded" style={{ bottom: 'calc(3.5rem + 20px)' }}>
          <div className="max-w-4xl mx-auto">
            {/* Only show Attack and Item buttons */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center">
                <Button
                  onClick={playerAttack}
                  disabled={!battleState?.isPlayerTurn || (battleState?.playerMp ?? 0) < 2}
                  className="disabled:opacity-50 disabled:cursor-not-allowed text-blue-100 border py-1 px-2 text-xs font-bold h-7 backdrop-blur-sm w-full"
                  style={{ 
                    backgroundColor: 'rgba(13, 25, 59, 0.7)', 
                    borderColor: 'rgba(13, 25, 59, 0.5)',
                    textShadow: '0 0 10px rgba(173, 216, 255, 0.8)'
                  }}
                >
                  <Sword className="w-3 h-3 mr-0.5" />
                  ATTACK
                </Button>
                <div className="text-xs text-blue-300/80 mt-0.5" style={{ textShadow: '0 0 6px rgba(173, 216, 255, 0.4)' }}>
                  2 MP
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  variant="outline"
                  disabled
                  className="text-blue-100 border py-1 px-2 text-xs font-bold cursor-not-allowed h-7 backdrop-blur-sm w-full"
                  style={{ 
                    backgroundColor: 'rgba(13, 25, 59, 0.7)', 
                    borderColor: 'rgba(13, 25, 59, 0.5)',
                    textShadow: '0 0 10px rgba(173, 216, 255, 0.8)'
                  }}
                >
                  <Heart className="w-3 h-3 mr-0.5" />
                  ITEM
                </Button>
                <div className="text-xs text-blue-300/80 mt-0.5" style={{ textShadow: '0 0 6px rgba(173, 216, 255, 0.4)' }}>
                  0 MP
                </div>
              </div>
            </div>

            {battleState.battleResult === 'victory' && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-yellow-900/90 to-yellow-800/90 border-2 border-yellow-400 rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
                  <div className="mb-6">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-3xl font-bold text-yellow-100 mb-2">VICTORY!</h2>
                    <p className="text-yellow-200">You have defeated {battleState.monster.name}!</p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 mb-6 border border-yellow-400/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      <span className="text-xl font-bold text-yellow-100">Gold Earned</span>
                    </div>
                    <div className="text-4xl font-bold text-yellow-400">
                      +{battleState.totalMonsters > 1 ? battleState.monster.goldReward * battleState.totalMonsters : battleState.monster.goldReward}
                    </div>
                    <div className="text-sm text-yellow-300 mt-1">
                      {battleState.totalMonsters > 1 ? `${battleState.monster.goldReward} × ${battleState.totalMonsters} monsters` : ''}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={returnToMonsterList} 
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 text-lg"
                    >
                      FIGHT AGAIN
                    </Button>
                    <Button 
                      onClick={() => navigate("/")} 
                      variant="outline"
                      className="w-full border-yellow-400 text-yellow-100 hover:bg-yellow-400/20 font-bold py-3 text-lg"
                    >
                      RETURN HOME
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {battleState.battleResult === 'defeat' && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 border-2 border-red-400 rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
                  <div className="mb-6">
                    <Skull className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-3xl font-bold text-red-100 mb-2">DEFEAT!</h2>
                    <p className="text-red-200">You were defeated by {battleState.monster.name}...</p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 mb-6 border border-red-400/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Skull className="w-6 h-6 text-red-400" />
                      <span className="text-xl font-bold text-red-100">No Rewards</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">+0 Gold</div>
                    <div className="text-sm text-red-300 mt-1">Victory is required for rewards</div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={returnToMonsterList} 
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg"
                    >
                      TRY AGAIN
                    </Button>
                    <Button 
                      onClick={() => navigate("/")} 
                      variant="outline"
                      className="w-full border-red-400 text-red-100 hover:bg-red-400/20 font-bold py-3 text-lg"
                    >
                      RETURN HOME
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}