import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarSelector } from "@/components/ui/avatar-selector";
import { Avatar3D } from "@/components/ui/avatar-3d";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Box, User, Play, Trophy, Zap, StarIcon } from "lucide-react";

export default function AvatarDemo() {
  const [animationState, setAnimationState] = useState<'idle' | 'victory' | 'attack' | 'level_up'>('idle');
  const [demoUser, setDemoUser] = useState({
    id: 1,
    username: "Demo Character",
    level: 15,
    strength: 25,
    stamina: 20,
    agility: 18,
    skinColor: "#F5C6A0",
    hairColor: "#8B4513",
    gender: "male"
  });

  const { data: userStats } = useQuery({ queryKey: ["/api/user/stats"] });

  const handleStatChange = (stat: string, value: number) => {
    setDemoUser(prev => ({ ...prev, [stat]: value }));
  };

  const handleAnimationChange = (animation: string) => {
    setAnimationState(animation as any);
    // Reset to idle after 3 seconds for non-idle animations
    if (animation !== 'idle') {
      setTimeout(() => setAnimationState('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <Box className="w-6 h-6 mr-2" />
                3D Avatar Demo
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Experience the new 3D character models that reflect your fitness progress
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
            <TabsTrigger value="your-avatar">Your Avatar</TabsTrigger>
            <TabsTrigger value="comparisons">Progression Stages</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3D Avatar Display */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Box className="w-5 h-5 mr-2" />
                    3D Character Model
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square">
                    <Avatar3D
                      user={demoUser}
                      size="lg"
                      className="w-full h-full"
                      interactive={true}
                      showStats={true}
                      animationState={animationState}
                    />
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium">Animation</label>
                      <div className="flex gap-2 mt-1">
                        <Button 
                          size="sm" 
                          variant={animationState === 'idle' ? 'default' : 'outline'}
                          onClick={() => handleAnimationChange('idle')}
                        >
                          <User className="w-4 h-4 mr-1" />
                          Idle
                        </Button>
                        <Button 
                          size="sm" 
                          variant={animationState === 'victory' ? 'default' : 'outline'}
                          onClick={() => handleAnimationChange('victory')}
                        >
                          <Trophy className="w-4 h-4 mr-1" />
                          Victory
                        </Button>
                        <Button 
                          size="sm" 
                          variant={animationState === 'attack' ? 'default' : 'outline'}
                          onClick={() => handleAnimationChange('attack')}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Attack
                        </Button>
                        <Button 
                          size="sm" 
                          variant={animationState === 'level_up' ? 'default' : 'outline'}
                          onClick={() => handleAnimationChange('level_up')}
                        >
                          <StarIcon className="w-4 h-4 mr-1" />
                          Level Up
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Character Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Level: {demoUser.level}</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={demoUser.level}
                      onChange={(e) => handleStatChange('level', parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Strength: {demoUser.strength}</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={demoUser.strength}
                      onChange={(e) => handleStatChange('strength', parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Stamina: {demoUser.stamina}</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={demoUser.stamina}
                      onChange={(e) => handleStatChange('stamina', parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Agility: {demoUser.agility}</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={demoUser.agility}
                      onChange={(e) => handleStatChange('agility', parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Gender</label>
                    <Select value={demoUser.gender} onValueChange={(value) => setDemoUser(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Skin Color</label>
                    <input
                      type="color"
                      value={demoUser.skinColor}
                      onChange={(e) => setDemoUser(prev => ({ ...prev, skinColor: e.target.value }))}
                      className="w-full mt-1 h-10 rounded"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Hair Color</label>
                    <input
                      type="color"
                      value={demoUser.hairColor}
                      onChange={(e) => setDemoUser(prev => ({ ...prev, hairColor: e.target.value }))}
                      className="w-full mt-1 h-10 rounded"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>3D Avatar Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-400">Stat-Based Appearance</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Strength affects muscle mass</li>
                      <li>• Agility affects leg length</li>
                      <li>• Level adds equipment & gear</li>
                      <li>• Gender affects proportions</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-400">Dynamic Animations</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Idle breathing animation</li>
                      <li>• Victory celebrations</li>
                      <li>• Attack movements</li>
                      <li>• Level up effects</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-400">Interactive Elements</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Mouse tracking rotation</li>
                      <li>• Real-time stat updates</li>
                      <li>• Toggle 2D/3D views</li>
                      <li>• Customizable colors</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="your-avatar" className="space-y-6">
            {userStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Your Current Avatar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AvatarSelector
                      user={userStats}
                      size="lg"
                      className="w-full aspect-square"
                      showToggle={true}
                      defaultMode="3d"
                      interactive={true}
                      showStats={true}
                      animationState="idle"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Your Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Level</span>
                      <span className="text-xl font-bold">{(userStats as any)?.level || 1}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-400">Strength</span>
                      <span className="text-lg font-bold">{(userStats as any)?.strength || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-400">Stamina</span>
                      <span className="text-lg font-bold">{(userStats as any)?.stamina || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-400">Agility</span>
                      <span className="text-lg font-bold">{(userStats as any)?.agility || 0}</span>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Your 3D avatar reflects your fitness journey. As you train different muscle groups and improve your stats, your character will grow stronger and more equipped!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Please log in to see your personalized 3D avatar</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comparisons" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Beginner */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-center">Beginner (Level 1-5)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Avatar3D
                    user={{
                      id: 1,
                      username: "Beginner",
                      level: 3,
                      strength: 2,
                      stamina: 2,
                      agility: 2,
                      skinColor: "#F5C6A0",
                      hairColor: "#8B4513",
                      gender: "male"
                    }}
                    size="md"
                    className="w-full aspect-square"
                    interactive={false}
                    showStats={true}
                    animationState="idle"
                  />
                  <div className="mt-4 text-sm text-center text-muted-foreground">
                    Basic character with minimal equipment
                  </div>
                </CardContent>
              </Card>

              {/* Intermediate */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-center">Intermediate (Level 10-20)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Avatar3D
                    user={{
                      id: 2,
                      username: "Intermediate",
                      level: 15,
                      strength: 15,
                      stamina: 12,
                      agility: 10,
                      skinColor: "#F5C6A0",
                      hairColor: "#654321",
                      gender: "female"
                    }}
                    size="md"
                    className="w-full aspect-square"
                    interactive={false}
                    showStats={true}
                    animationState="victory"
                  />
                  <div className="mt-4 text-sm text-center text-muted-foreground">
                    Equipped with weapons and basic armor
                  </div>
                </CardContent>
              </Card>

              {/* Advanced */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-center">Advanced (Level 25+)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Avatar3D
                    user={{
                      id: 3,
                      username: "Advanced",
                      level: 30,
                      strength: 35,
                      stamina: 30,
                      agility: 25,
                      skinColor: "#D4A574",
                      hairColor: "#2C1810",
                      gender: "male"
                    }}
                    size="md"
                    className="w-full aspect-square"
                    interactive={false}
                    showStats={true}
                    animationState="level_up"
                  />
                  <div className="mt-4 text-sm text-center text-muted-foreground">
                    Fully armored with glowing effects
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}