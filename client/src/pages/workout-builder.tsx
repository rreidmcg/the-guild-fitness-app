import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Save, X, MoreHorizontal, Check, Search, Filter, ChevronDown, Copy, Trash2, RefreshCw, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Exercise } from "@shared/schema";

interface WorkoutSection {
  id: string;
  name: string;
  format: 'regular' | 'amrap' | 'timed' | 'interval' | 'freestyle';
  type: 'workout' | 'warmup' | 'cooldown' | 'recovery';
  description?: string;
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exerciseId: number;
  exercise?: Exercise;
  sets: ExerciseSet[];
  notes?: string;
}

interface ExerciseSet {
  id: string;
  type: 'W' | 'R' | 'D' | 'F'; // W=warmup, R=regular, D=drop, F=failure
  reps?: number;
  weight?: number;
  duration?: string;
  rest?: string;
  rir?: number; // Reps in reserve
  completed?: boolean;
}

type WorkoutBuilderStep = 'details' | 'sections' | 'section-form' | 'exercise-selection';

export default function WorkoutBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main state
  const [step, setStep] = useState<WorkoutBuilderStep>('details');
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [sections, setSections] = useState<WorkoutSection[]>([]);
  
  // Section form state
  const [currentSection, setCurrentSection] = useState<Partial<WorkoutSection> | null>(null);
  const [isEditingSection, setIsEditingSection] = useState(false);
  
  // Exercise selection state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  
  // Modal states
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showSetTypeSelector, setShowSetTypeSelector] = useState(false);
  const [editingSet, setEditingSet] = useState<{exerciseId: string, setId: string} | null>(null);
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null);
  const [showExerciseDetails, setShowExerciseDetails] = useState<WorkoutExercise | null>(null);

  const { data: exercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      const response = await apiRequest("/api/workouts", {
        method: "POST",
        body: JSON.stringify(workoutData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Success!",
        description: "Workout created successfully",
      });
      setLocation("/workouts");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workout",
        variant: "destructive",
      });
    },
  });

  // Step 1: Workout Details
  const renderDetailsStep = () => (
    <div className="min-h-screen bg-background text-foreground">
      
      
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/workouts")}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">New Workout</h1>
          
          <Button 
            onClick={() => setStep('sections')}
            disabled={!workoutName.trim()}
            className="text-primary disabled:text-muted-foreground"
            variant="ghost"
          >
            Next
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">WORKOUT NAME</Label>
          <Input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Add workout name"
            className="bg-background border-border text-foreground text-lg font-medium"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">DESCRIPTION</Label>
          <Textarea
            value={workoutDescription}
            onChange={(e) => setWorkoutDescription(e.target.value)}
            placeholder="Add workout description..."
            className="bg-muted border-border text-foreground min-h-[120px] resize-none"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Sections Overview
  const renderSectionsStep = () => (
    <div className="min-h-screen bg-background text-foreground">
      
      
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setStep('details')}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">{workoutName}</h1>
          
          <Button 
            onClick={handleSaveWorkout}
            disabled={sections.length === 0}
            className="text-primary disabled:text-muted-foreground"
            variant="ghost"
          >
            Save
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {sections.length === 0 ? (
          <div className="text-center py-16 space-y-6">
            <div className="mx-auto w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 bg-background rounded border-2 border-dashed border-border flex items-center justify-center">
                <div className="w-6 h-6 bg-primary rounded"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Add Exercises</h2>
              <p className="text-muted-foreground">Please add at least 1 exercise or section to create the workout</p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setCurrentSection({
                    id: Date.now().toString(),
                    name: "",
                    format: 'regular',
                    type: 'workout',
                    exercises: []
                  });
                  setStep('section-form');
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add Exercise
              </Button>
              
              <Button 
                onClick={() => {
                  setCurrentSection({
                    id: Date.now().toString(),
                    name: "",
                    format: 'regular',
                    type: 'workout', 
                    exercises: []
                  });
                  setStep('section-form');
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add Section
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{section.name}</h3>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="secondary" className="text-xs uppercase">
                      {section.format}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {section.exercises.length} EXERCISE{section.exercises.length !== 1 ? 'S' : ''}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {section.exercises.map((exercise) => (
                      <div key={exercise.id} className="pl-4 border-l-2 border-muted">
                        <p className="text-sm font-medium text-foreground">{exercise.exercise?.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => {
                  setCurrentSection({
                    id: Date.now().toString(),
                    name: "",
                    format: 'regular',
                    type: 'workout',
                    exercises: []
                  });
                  setStep('section-form');
                }}
                variant="outline"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              
              <Button 
                onClick={handleSaveWorkout}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 3: Section Form
  const renderSectionForm = () => (
    <div className="min-h-screen bg-background text-foreground">
      
      
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setStep('sections')}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">New Section</h1>
          
          <div className="w-8"></div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6 pb-32">
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">SECTION NAME</Label>
          <Input
            value={currentSection?.name || ""}
            onChange={(e) => setCurrentSection(prev => prev ? {...prev, name: e.target.value} : null)}
            placeholder="Section name"
            className="bg-background border-border text-foreground text-lg font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">SECTION FORMAT</Label>
            <Button 
              variant="outline"
              className="w-full justify-between text-left font-normal"
              onClick={() => setShowFormatSelector(true)}
            >
              <span className="capitalize">{currentSection?.format || 'Regular'}</span>
              <span>{'>'}</span>
            </Button>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">SECTION TYPE</Label>
            <Button 
              variant="outline"
              className="w-full justify-between text-left font-normal capitalize"
              onClick={() => setShowTypeSelector(true)}
            >
              <span className="capitalize">{currentSection?.type || 'Workout'}</span>
              <span>{'>'}</span>
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">DESCRIPTION</Label>
          <Textarea
            value={currentSection?.description || ""}
            onChange={(e) => setCurrentSection(prev => prev ? {...prev, description: e.target.value} : null)}
            placeholder="Add a description..."
            className="bg-muted border-border text-foreground min-h-[120px] resize-none"
          />
        </div>

        {/* Exercise List */}
        {currentSection?.exercises && currentSection.exercises.length > 0 && (
          <div className="space-y-4">
            {currentSection.exercises.map((exercise) => (
              <Card key={exercise.id} className="bg-background border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs font-medium">Ex</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{exercise.exercise?.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleDuplicateExercise(exercise.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteExercise(exercise.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeExercise(exercise.id)}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Change exercise
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowExerciseDetails(exercise)}>
                          <Info className="w-4 h-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Sets Table */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground uppercase">
                      <div>SET</div>
                      <div>LB</div>
                      <div>REPS</div>
                      <div>RIR</div>
                      <div>REST</div>
                    </div>
                    
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className="grid grid-cols-5 gap-2 items-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 text-sm font-bold ${
                            set.type === 'W' ? 'text-orange-500' :
                            set.type === 'R' ? 'text-blue-500' :
                            set.type === 'D' ? 'text-blue-400' :
                            'text-red-500'
                          }`}
                          onClick={() => {
                            setEditingSet({exerciseId: exercise.id, setId: set.id});
                            setShowSetTypeSelector(true);
                          }}
                        >
                          {set.type === 'R' ? index + 1 : set.type}
                        </Button>
                        <Input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                          placeholder="-"
                        />
                        <Input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                          placeholder="10"
                        />
                        <Input
                          type="number"
                          value={set.rir || ''}
                          onChange={(e) => updateSet(exercise.id, set.id, 'rir', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                          placeholder="-"
                        />
                        <Input
                          value={set.rest || ''}
                          onChange={(e) => updateSet(exercise.id, set.id, 'rest', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="01:00"
                        />
                      </div>
                    ))}

                    <Button 
                      variant="ghost" 
                      className="text-primary text-sm"
                      onClick={() => {
                        // Add new set with default regular type
                        if (currentSection && currentSection.exercises) {
                          const updatedExercises = currentSection.exercises.map(ex => 
                            ex.id === exercise.id 
                              ? {...ex, sets: [...ex.sets, {
                                  id: Date.now().toString(),
                                  type: 'R' as const,
                                  reps: 10,
                                  weight: 0,
                                  rest: '01:00'
                                }]}
                              : ex
                          );
                          setCurrentSection({...currentSection, exercises: updatedExercises});
                        }
                      }}
                    >
                      + Add Set
                    </Button>
                  </div>

                  <div className="mt-4">
                    <Textarea 
                      placeholder="Add note..."
                      className="bg-muted border-0 text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Fixed bottom buttons - Always visible above bottom nav */}
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 z-50">
          <div className="max-w-4xl mx-auto flex space-x-3">
            <Button 
              onClick={() => {
                setSelectedSectionId(currentSection?.id || null);
                setStep('exercise-selection');
              }}
              variant="outline"
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
            
            <Button 
              onClick={handleSaveSection}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!currentSection?.name?.trim()}
            >
              Save Section
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Exercise Selection
  const renderExerciseSelection = () => {
    const filteredExercises = (exercises as Exercise[]).filter((exercise: Exercise) => 
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      exercise.muscleGroups.some((mg: string) => mg.toLowerCase().includes(exerciseSearch.toLowerCase()))
    );

    return (
      <div className="min-h-screen bg-background text-foreground">
        
        
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setStep('section-form')}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <h1 className="text-lg font-semibold text-foreground">Select exercises</h1>
            
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercise.."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="pl-10 bg-muted border-border"
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-muted-foreground">EXERCISES ({filteredExercises.length})</p>
          </div>

          {/* Exercise List */}
          <div className="space-y-3 mb-20">
            {filteredExercises.map((exercise: Exercise) => (
              <div 
                key={exercise.id}
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => handleToggleExercise(exercise.id)}
              >
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                  {selectedExercises.includes(exercise.id) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs font-medium">Ex</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{exercise.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Add Exercise Button - Above bottom nav */}
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <Button 
              onClick={handleAddSelectedExercises}
              disabled={selectedExercises.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Add {selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Handlers
  const handleToggleExercise = (exerciseId: number) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleAddSelectedExercises = () => {
    if (!currentSection || selectedExercises.length === 0) return;

    // Add selected exercises to current section
    const exercisesToAdd = selectedExercises.map(exerciseId => {
      const exercise = (exercises as Exercise[]).find((ex: Exercise) => ex.id === exerciseId);
      return {
        id: Date.now().toString() + Math.random(),
        exerciseId,
        exercise,
        sets: [{
          id: Date.now().toString() + Math.random(),
          type: 'R' as const,
          reps: 10,
          weight: 0,
          rest: '01:00'
        }]
      };
    });

    // Update current section with new exercises
    setCurrentSection(prev => ({
      ...prev!,
      exercises: [...(prev?.exercises || []), ...exercisesToAdd]
    }));

    // Clear selection and go back to section form
    setSelectedExercises([]);
    setStep('section-form');
  };

  // Function to update individual set properties
  const updateSet = (exerciseId: string, setId: string, property: keyof ExerciseSet, value: any) => {
    if (!currentSection) return;
    
    const updatedExercises = currentSection.exercises?.map(exercise => {
      if (exercise.id === exerciseId) {
        const updatedSets = exercise.sets.map(set => {
          if (set.id === setId) {
            return { ...set, [property]: value };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    }) || [];

    setCurrentSection({ ...currentSection, exercises: updatedExercises });
  };

  // Exercise menu handlers
  const handleDuplicateExercise = (exerciseId: string) => {
    if (!currentSection) return;
    
    const exerciseToDuplicate = currentSection.exercises?.find(ex => ex.id === exerciseId);
    if (!exerciseToDuplicate) return;

    const duplicatedExercise = {
      ...exerciseToDuplicate,
      id: Date.now().toString() + Math.random(),
      sets: exerciseToDuplicate.sets.map(set => ({
        ...set,
        id: Date.now().toString() + Math.random()
      }))
    };

    setCurrentSection(prev => ({
      ...prev!,
      exercises: [...(prev?.exercises || []), duplicatedExercise]
    }));

    toast({
      title: "Exercise duplicated",
      description: `${exerciseToDuplicate.exercise?.name} has been duplicated`,
    });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!currentSection) return;
    
    const exerciseToDelete = currentSection.exercises?.find(ex => ex.id === exerciseId);
    
    setCurrentSection(prev => ({
      ...prev!,
      exercises: prev?.exercises?.filter(ex => ex.id !== exerciseId) || []
    }));

    toast({
      title: "Exercise deleted",
      description: `${exerciseToDelete?.exercise?.name} has been removed`,
    });
  };

  const handleChangeExercise = (exerciseId: string) => {
    setSelectedSectionId(currentSection?.id || null);
    setSelectedExercises([]);
    setStep('exercise-selection');
    
    // Store the exercise being replaced for later
    const exerciseToReplace = currentSection?.exercises?.find(ex => ex.id === exerciseId);
    if (exerciseToReplace) {
      // Remove the exercise being replaced temporarily
      setCurrentSection(prev => ({
        ...prev!,
        exercises: prev?.exercises?.filter(ex => ex.id !== exerciseId) || []
      }));
    }
  };

  const handleSaveSection = () => {
    if (!currentSection?.name?.trim()) return;

    const finalSection = { ...currentSection } as WorkoutSection;

    if (isEditingSection) {
      setSections(prev => prev.map(section => 
        section.id === finalSection.id ? finalSection : section
      ));
    } else {
      setSections(prev => [...prev, finalSection]);
    }

    // Reset state
    setCurrentSection(null);
    setIsEditingSection(false);
    setSelectedExercises([]);
    setStep('sections');
  };

  const handleSaveWorkout = () => {
    if (!workoutName.trim() || sections.length === 0) {
      toast({
        title: "Error",
        description: "Please add a workout name and at least one section",
        variant: "destructive",
      });
      return;
    }

    const workoutData = {
      name: workoutName,
      description: workoutDescription,
      exercises: sections.flatMap(section => 
        section.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets.length,
          reps: 10, // Default
          weight: 0, // Default
          restTime: 60 // Default
        }))
      ),
    };

    createWorkoutMutation.mutate(workoutData);
  };

  // Format selector modal
  const renderFormatSelector = () => (
    <Dialog open={showFormatSelector} onOpenChange={setShowFormatSelector}>
      <DialogContent className="max-w-md mx-auto bg-card border-border text-foreground">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-center relative">
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-foreground">
            Select section format
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pb-4">
          {/* Regular */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, format: 'regular'} : null);
              setShowFormatSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Regular</h3>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              {currentSection?.format === 'regular' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          {/* AMRAP */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, format: 'amrap'} : null);
              setShowFormatSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">AMRAP</h3>
              <p className="text-sm text-muted-foreground">
                AMRAP format tracks total rounds completed based on time assigned and only allows 1 set per exercise
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-3 flex-shrink-0">
              {currentSection?.format === 'amrap' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          {/* Timed */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, format: 'timed'} : null);
              setShowFormatSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Timed</h3>
              <p className="text-sm text-muted-foreground">
                Timed format tracks total duration based on rounds assigned and only allows 1 set per exercise
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-3 flex-shrink-0">
              {currentSection?.format === 'timed' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          {/* Interval */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, format: 'interval'} : null);
              setShowFormatSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Interval</h3>
              <p className="text-sm text-muted-foreground">
                Interval format autoplays a timer on the client app. This format requires a duration and rest time for each exercise. Can be used for HIIT, TABATA, and more
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-3 flex-shrink-0">
              {currentSection?.format === 'interval' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Type selector modal  
  const renderTypeSelector = () => (
    <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
      <DialogContent className="max-w-md mx-auto bg-card border-border text-foreground">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-center relative">
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-foreground">
            Select section type
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pb-4">
          {/* Workout (Regular) */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, type: 'workout'} : null);
              setShowTypeSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Workout (Regular)</h3>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              {currentSection?.type === 'workout' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          {/* Warm-up */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, type: 'warmup'} : null);
              setShowTypeSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Warm-up</h3>
              <p className="text-sm text-muted-foreground">Not included in the exercise chart</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-3 flex-shrink-0">
              {currentSection?.type === 'warmup' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          {/* Cool down */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, type: 'cooldown'} : null);
              setShowTypeSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Cool down</h3>
              <p className="text-sm text-muted-foreground">Not included in the exercise chart</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-3 flex-shrink-0">
              {currentSection?.type === 'cooldown' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          {/* Recovery */}
          <div 
            className="flex items-center justify-between cursor-pointer py-3"
            onClick={() => {
              setCurrentSection(prev => prev ? {...prev, type: 'recovery'} : null);
              setShowTypeSelector(false);
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Recovery</h3>
              <p className="text-sm text-muted-foreground">Not included in the exercise chart</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-3 flex-shrink-0">
              {currentSection?.type === 'recovery' && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Set type selector modal
  const renderSetTypeSelector = () => (
    <Dialog open={showSetTypeSelector} onOpenChange={setShowSetTypeSelector}>
      <DialogContent className="max-w-md mx-auto bg-card border-border text-foreground">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-center text-lg font-semibold text-foreground">
            Select Set Type
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pb-4">
          {[
            { type: 'W', name: 'Warmup', description: 'Light weight warmup set', color: 'text-orange-500' },
            { type: 'R', name: 'Regular', description: 'Standard working set', color: 'text-blue-500' },
            { type: 'D', name: 'Drop Set', description: 'Reduce weight and continue', color: 'text-blue-400' },
            { type: 'F', name: 'Failure', description: 'Go to complete failure', color: 'text-red-500' }
          ].map((setType) => (
            <div 
              key={setType.type}
              className="flex items-center justify-between cursor-pointer py-3"
              onClick={() => {
                if (editingSet) {
                  updateSet(editingSet.exerciseId, editingSet.setId, 'type', setType.type as 'W' | 'R' | 'D' | 'F');
                }
                setShowSetTypeSelector(false);
                setEditingSet(null);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold ${setType.color}`}>
                  {setType.type}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{setType.name}</h3>
                  <p className="text-sm text-muted-foreground">{setType.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Exercise details modal
  const renderExerciseDetailsModal = () => (
    <Dialog open={!!showExerciseDetails} onOpenChange={() => setShowExerciseDetails(null)}>
      <DialogContent className="max-w-md mx-auto bg-card border-border text-foreground">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-center text-lg font-semibold text-foreground">
            Exercise Details
          </DialogTitle>
        </DialogHeader>
        
        {showExerciseDetails && (
          <div className="space-y-4 pb-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">{showExerciseDetails.exercise?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Category: {showExerciseDetails.exercise?.category}
              </p>
              <p className="text-sm text-muted-foreground">
                Muscle Groups: {showExerciseDetails.exercise?.muscleGroups?.join(', ')}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-1">Sets Configuration</h4>
              <p className="text-sm text-muted-foreground">
                {showExerciseDetails.sets.length} set{showExerciseDetails.sets.length !== 1 ? 's' : ''} configured
              </p>
              <div className="mt-2 space-y-1">
                {showExerciseDetails.sets.map((set, index) => (
                  <div key={set.id} className="text-xs text-muted-foreground">
                    Set {index + 1}: {set.type === 'W' ? 'Warmup' : set.type === 'R' ? 'Regular' : set.type === 'D' ? 'Drop Set' : 'Failure'} 
                    {set.reps && ` - ${set.reps} reps`}
                    {set.weight && ` - ${set.weight} lbs`}
                    {set.rest && ` - ${set.rest} rest`}
                  </div>
                ))}
              </div>
            </div>
            
            {showExerciseDetails.notes && (
              <div>
                <h4 className="font-medium text-foreground mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{showExerciseDetails.notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // Main render based on step
  return (
    <>
      {step === 'details' && renderDetails()}
      {step === 'sections' && renderSections()}
      {step === 'section-form' && renderSectionForm()}
      {step === 'exercise-selection' && renderExerciseSelection()}
      
      {/* Modals */}
      {renderFormatSelector()}
      {renderTypeSelector()}
      {renderSetTypeSelector()}
      {renderExerciseDetailsModal()}
    </>
  );
}