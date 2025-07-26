import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { Search, Plus, Check } from "lucide-react";
import type { Exercise } from "@shared/schema";

interface ExerciseSelectorProps {
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
  selectedExerciseIds: number[];
}

export function ExerciseSelector({ exercises, onSelectExercise, selectedExerciseIds }: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(exercises.map(ex => ex.category))];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'bg-red-600';
      case 'cardio': return 'bg-green-600';
      case 'flexibility': return 'bg-purple-600';
      case 'core': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Exercise Library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="text-xs"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredExercises.map(exercise => {
            const isSelected = selectedExerciseIds.includes(exercise.id);
            return (
              <Card 
                key={exercise.id} 
                className={`cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-primary/20 border-primary' 
                    : 'bg-background border-border hover:bg-muted hover:border-primary/50'
                }`}
                onClick={() => !isSelected && onSelectExercise(exercise)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{exercise.name}</h3>
                        <Badge className={`${getCategoryColor(exercise.category)} text-white text-xs`}>
                          {exercise.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {exercise.muscleGroups.join(', ')}
                      </p>
                    </div>
                    <div className="ml-2">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No exercises found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
