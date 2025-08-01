import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Save, X, MoreHorizontal, Check, Search, Filter, ChevronDown, Copy, Trash2, RefreshCw, Info, Edit3, Camera, Video } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
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
  eachSide?: boolean; // Indicates if exercise is performed unilaterally
  tempo?: string[]; // Four-digit tempo notation [eccentric, pause, concentric, pause]
}

interface ExerciseSet {
  id: string;
  type: 'W' | 'R' | 'D' | 'F'; // W=warmup, R=regular, D=drop, F=failure
  reps?: number;
  weight?: number;
  duration?: string;
  rest?: string;
  rir?: number; // Reps in reserve
  rpe?: number; // Rate of perceived exertion
  completed?: boolean;
}

type WorkoutBuilderStep = 'details' | 'sections' | 'section-form' | 'exercise-selection';

export default function WorkoutBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editWorkoutId = urlParams.get('edit');
  const isEditMode = !!editWorkoutId;

  // Main state - start at sections if editing, details if creating
  const [step, setStep] = useState<WorkoutBuilderStep>(isEditMode ? 'sections' : 'details');
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
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [editedExercise, setEditedExercise] = useState<any>(null);
  const [openExerciseCombobox, setOpenExerciseCombobox] = useState<string | null>(null);
  const [exerciseSearchTerms, setExerciseSearchTerms] = useState<{[key: string]: string}>({});

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/exercises"],
  });

  // Query for existing workout if in edit mode
  const { data: existingWorkout, isLoading: workoutLoading } = useQuery({
    queryKey: ["/api/workouts", editWorkoutId],
    enabled: isEditMode && !!editWorkoutId,
  });

  // Load existing workout data when available
  useEffect(() => {
    if (existingWorkout && isEditMode && Array.isArray(exercises) && exercises.length > 0 && !exercisesLoading && !workoutLoading) {
      const workout = existingWorkout as any;
      setWorkoutName(workout.name || "");
      setWorkoutDescription(workout.description || "");
      
      // Convert exercises to sections format with intelligent grouping
      if (workout.exercises && Array.isArray(workout.exercises)) {
        // Group exercises by section (using same logic as overview)
        const groupedExercises: Record<string, any[]> = {};
        
        workout.exercises.forEach((exercise: any) => {
          let sectionName = exercise.section;
          
          // If no section is specified, auto-group by exercise category
          if (!sectionName) {
            const exerciseDetails = Array.isArray(exercises) ? exercises.find((ex: any) => ex.id === exercise.exerciseId) : null;
            const category = exerciseDetails?.category;
            
            switch (category) {
              case 'warmup':
                sectionName = 'Warm Up';
                break;
              case 'strength':
                sectionName = 'Main Workout';
                break;
              case 'cardio':
                sectionName = 'Cool Down';
                break;
              case 'bodyweight':
                sectionName = 'Warm Up';
                break;
              default:
                sectionName = 'Main Workout';
            }
          }
          
          if (!groupedExercises[sectionName]) {
            groupedExercises[sectionName] = [];
          }
          groupedExercises[sectionName].push(exercise);
        });

        // Convert to sections format
        const workoutSections: WorkoutSection[] = Object.entries(groupedExercises).map(([sectionName, sectionExercises], sectionIndex) => ({
          id: `section-${sectionIndex}`,
          name: sectionName,
          format: 'regular',
          type: sectionName === 'Warm Up' ? 'warmup' : sectionName === 'Cool Down' ? 'cooldown' : 'workout',
          exercises: sectionExercises.map((ex: any, index: number) => {
            // Find the exercise details from the exercises database
            const exerciseDetails = Array.isArray(exercises) ? exercises.find((e: any) => e.id === (ex.exerciseId || ex.id)) : null;
            return {
              id: `exercise-${sectionIndex}-${index}`,
              exerciseId: ex.exerciseId || ex.id,
              exercise: exerciseDetails || ex.exercise || ex,
              sets: Array.isArray(ex.sets) ? ex.sets : Array.from({length: ex.sets || 1}, (_, i) => ({
                id: `set-${i+1}`,
                type: 'R' as const,
                reps: ex.reps || 10,
                weight: ex.weight || 0,
                duration: ex.duration || undefined,
                rest: ex.restTime ? `${ex.restTime}s` : undefined
              })),
              notes: ex.notes || "",
              eachSide: ex.eachSide || false,
              tempo: ex.tempo || []
            };
          })
        }));
        
        setSections(workoutSections);
      }
    }
  }, [existingWorkout, isEditMode, exercises, exercisesLoading, workoutLoading]);

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      if (isEditMode && editWorkoutId) {
        // Update existing workout
        return await apiRequest(`/api/workouts/${editWorkoutId}`, {
          method: "PUT",
          body: workoutData
        });
      } else {
        // Create new workout
        return await apiRequest("/api/workouts", {
          method: "POST",
          body: workoutData
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ["/api/workouts", editWorkoutId] });
      }
      toast({
        title: "Success!",
        description: isEditMode ? "Workout updated successfully" : "Workout created successfully",
      });
      setLocation("/workouts");
    },
    onError: () => {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update workout" : "Failed to create workout",
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
          
          <h1 className="text-lg font-semibold text-foreground">{isEditMode ? 'Edit Workout' : 'New Workout'}</h1>
          
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
        {/* Workout Title Header */}
        {isEditMode && workoutName && (
          <div className="mb-6 pb-4 border-b border-border">
            <h2 
              className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => setStep('details')}
            >
              {workoutName}
            </h2>
            {workoutDescription && (
              <p 
                className="text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setStep('details')}
              >
                {workoutDescription}
              </p>
            )}
          </div>
        )}

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
              <Card 
                key={section.id} 
                className="bg-card border-border cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => {
                  setCurrentSection(section);
                  setIsEditingSection(true);
                  setStep('section-form');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {section.name}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">

                        <DropdownMenuItem 
                          onClick={() => {
                            // Duplicate section
                            const duplicatedSection = {
                              ...section,
                              id: Date.now().toString(),
                              name: `${section.name} (Copy)`
                            };
                            setSections([...sections, duplicatedSection]);
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate Section
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            // Delete section
                            setSections(sections.filter(s => s.id !== section.id));
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Section
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                        <p 
                          className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            setCurrentSection(section);
                            setStep('section-form');
                          }}
                        >
                          {exercise.exercise?.name}
                        </p>
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
              className="w-full justify-between text-left font-normal text-foreground hover:text-foreground hover:bg-accent"
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
              className="w-full justify-between text-left font-normal capitalize text-foreground hover:text-foreground hover:bg-accent"
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
                      <div className="flex-1">
                        {/* Editable Exercise Name with Inline Combobox */}
                        <Popover 
                          open={openExerciseCombobox === exercise.id} 
                          onOpenChange={(open) => setOpenExerciseCombobox(open ? exercise.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                value={exerciseSearchTerms[exercise.id] || exercise.exercise?.name || ''}
                                placeholder="Type to search exercises..."
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setExerciseSearchTerms(prev => ({
                                    ...prev,
                                    [exercise.id]: value
                                  }));
                                  // Open dropdown when typing
                                  if (!openExerciseCombobox) {
                                    setOpenExerciseCombobox(exercise.id);
                                  }
                                }}
                                onFocus={() => {
                                  setOpenExerciseCombobox(exercise.id);
                                  // Initialize search term with current exercise name if not already set
                                  if (!exerciseSearchTerms[exercise.id]) {
                                    setExerciseSearchTerms(prev => ({
                                      ...prev,
                                      [exercise.id]: exercise.exercise?.name || ''
                                    }));
                                  }
                                }}
                                className="h-8 border-0 bg-transparent p-0 text-left font-semibold text-foreground focus:ring-0 focus-visible:ring-0"
                              />
                              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <Command>
                              <CommandEmpty>No exercise found.</CommandEmpty>
                              <CommandGroup className="max-h-48 overflow-y-auto">
                                {Array.isArray(exercises) && exercises
                                  .filter((ex: any) => {
                                    const searchTerm = exerciseSearchTerms[exercise.id] || '';
                                    return ex.name.toLowerCase().includes(searchTerm.toLowerCase());
                                  })
                                  .map((ex: any) => (
                                  <CommandItem
                                    key={ex.id}
                                    value={ex.name}
                                    onSelect={() => {
                                      if (currentSection && currentSection.exercises) {
                                        const updatedExercises = currentSection.exercises.map(currentEx => 
                                          currentEx.id === exercise.id 
                                            ? {...currentEx, exerciseId: ex.id, exercise: ex}
                                            : currentEx
                                        );
                                        setCurrentSection({...currentSection, exercises: updatedExercises});
                                      }
                                      // Clear search term and close dropdown
                                      setExerciseSearchTerms(prev => ({
                                        ...prev,
                                        [exercise.id]: ex.name
                                      }));
                                      setOpenExerciseCombobox(null);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        exercise.exerciseId === ex.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    <div>
                                      <div className="font-medium">{ex.name}</div>
                                      <div className="text-xs text-muted-foreground capitalize">
                                        {ex.category} • {ex.muscleGroups?.join(', ') || 'No muscle groups'}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {exercise.supersetGroup && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Superset {exercise.supersetGroup}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                        <DropdownMenuItem onClick={() => handleDuplicateExercise(exercise.id)} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteExercise(exercise.id)} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeExercise(exercise.id)} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Change exercise
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateSuperset(exercise.id)} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                          <span className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold">SS</span>
                          {exercise.supersetGroup ? 'Modify Superset' : 'Create Superset'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          // Open details modal directly in edit mode
                          setShowExerciseDetails(exercise);
                          setIsEditingExercise(true);
                          setEditedExercise({
                            name: exercise.exercise?.name || '',
                            modality: 'strength',
                            muscleGroups: exercise.exercise?.muscleGroups || [],
                            category: exercise.exercise?.category || 'strength',
                            fields: (exercise as any)?.trackingFields || ['reps', 'weight', 'RIR'],
                            instructions: exercise.exercise?.description || '',
                            videoUrl: '',
                            photos: []
                          });
                        }} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                          <Info className="w-4 h-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Editable Tracking Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">TRACKING METRICS</Label>
                      <div className="flex space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-xs">
                              <Plus className="w-3 h-3 mr-1" />
                              Add Metric
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {['reps', 'weight', 'RIR', 'RPE', 'duration', 'distance'].map(metric => {
                              const currentFields = (exercise as any)?.trackingFields || ['reps', 'weight', 'RIR'];
                              const isSelected = currentFields.includes(metric);
                              return (
                                <DropdownMenuItem 
                                  key={metric}
                                  disabled={isSelected}
                                  onClick={() => {
                                    if (currentSection && currentSection.exercises && !isSelected) {
                                      const updatedExercises = currentSection.exercises.map(ex => 
                                        ex.id === exercise.id 
                                          ? {...ex, trackingFields: [...currentFields, metric]}
                                          : ex
                                      );
                                      setCurrentSection({...currentSection, exercises: updatedExercises});
                                    }
                                  }}
                                >
                                  {metric.toUpperCase()} {isSelected && '✓'}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {/* Tracking Fields Display */}
                    <div className="flex flex-wrap gap-2">
                      {((exercise as any)?.trackingFields || ['reps', 'weight', 'RIR']).map((field: string) => (
                        <div key={field} className="flex items-center bg-muted rounded px-2 py-1">
                          <span className="text-xs font-medium uppercase">{field}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => {
                              if (currentSection && currentSection.exercises) {
                                const currentFields = (exercise as any)?.trackingFields || ['reps', 'weight', 'RIR'];
                                const updatedFields = currentFields.filter((f: string) => f !== field);
                                const updatedExercises = currentSection.exercises.map(ex => 
                                  ex.id === exercise.id 
                                    ? {...ex, trackingFields: updatedFields}
                                    : ex
                                );
                                setCurrentSection({...currentSection, exercises: updatedExercises});
                              }
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="space-y-2 mt-4">
                    {(() => {
                      // Get tracking fields for this exercise
                      const trackingFields = (exercise as any)?.trackingFields || ['reps', 'weight', 'RIR'];
                      
                      // Define field mapping
                      const fieldMap = {
                        'reps': { label: 'REPS', key: 'reps', type: 'number', placeholder: '10' },
                        'weight': { label: 'LB', key: 'weight', type: 'number', placeholder: '-' },
                        'RIR': { label: 'RIR', key: 'rir', type: 'number', placeholder: '-' },
                        'RPE': { label: 'RPE', key: 'rpe', type: 'number', placeholder: '-' },
                        'duration': { label: 'TIME', key: 'duration', type: 'text', placeholder: '0:30' },
                        'distance': { label: 'DIST', key: 'distance', type: 'number', placeholder: '0' },
                        'rest': { label: 'REST', key: 'rest', type: 'text', placeholder: '01:00' }
                      };
                      
                      // Always show rest as the last column
                      const visibleFields = [...trackingFields.filter((f: string) => f !== 'rest'), 'rest'];
                      const gridCols = visibleFields.length + 2; // +1 for SET column, +1 for delete button
                      
                      return (
                        <>
                          <div className={`grid gap-2 text-xs font-medium text-muted-foreground uppercase`} style={{gridTemplateColumns: `auto repeat(${visibleFields.length}, minmax(0, 1fr)) auto`}}>
                            <div>SET</div>
                            {visibleFields.map(field => (
                              <div key={field}>{fieldMap[field as keyof typeof fieldMap]?.label || field.toUpperCase()}</div>
                            ))}
                            <div></div>
                          </div>
                          
                          {exercise.sets.map((set, index) => (
                            <div key={set.id} className={`grid gap-2 items-center py-2`} style={{gridTemplateColumns: `auto repeat(${visibleFields.length}, minmax(0, 1fr)) auto`}}>
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
                              {visibleFields.map(field => {
                                const fieldConfig = fieldMap[field as keyof typeof fieldMap];
                                if (!fieldConfig) return null;
                                
                                return (
                                  <Input
                                    key={field}
                                    type={fieldConfig.type}
                                    value={(set as any)[fieldConfig.key] || ''}
                                    onChange={(e) => {
                                      const value = fieldConfig.type === 'number' 
                                        ? parseInt(e.target.value) || 0
                                        : e.target.value;
                                      updateSet(exercise.id, set.id, fieldConfig.key as keyof ExerciseSet, value);
                                    }}
                                    className="h-8 text-sm"
                                    placeholder={fieldConfig.placeholder}
                                  />
                                );
                              })}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => {
                                  if (currentSection && currentSection.exercises) {
                                    const updatedExercises = currentSection.exercises.map(ex => 
                                      ex.id === exercise.id 
                                        ? {...ex, sets: ex.sets.filter(s => s.id !== set.id)}
                                        : ex
                                    );
                                    setCurrentSection({...currentSection, exercises: updatedExercises});
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </>
                      );
                    })()}

                  </div>

                  <div className="mt-4 space-y-3">
                    {/* Each Side Checkbox, Tempo Input, and Add Set Button */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exercise.eachSide || false}
                          onChange={(e) => {
                            if (currentSection && currentSection.exercises) {
                              const updatedExercises = currentSection.exercises.map(ex => 
                                ex.id === exercise.id 
                                  ? {...ex, eachSide: e.target.checked}
                                  : ex
                              );
                              setCurrentSection({...currentSection, exercises: updatedExercises});
                            }
                          }}
                          className="rounded"
                        />
                        <span>Each side</span>
                      </label>

                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-muted-foreground">Tempo</label>
                        <Input
                          type="text"
                          placeholder="0-0-0-0"
                          maxLength={7}
                          value={exercise.tempo?.join('-') || '0-0-0-0'}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            // Allow only digits, X, and dashes in the correct format
                            if (/^[0-9X]-[0-9X]-[0-9X]-[0-9X]$/.test(value) || value === '') {
                              if (currentSection && currentSection.exercises) {
                                const tempoArray = value ? value.split('-') : ['0', '0', '0', '0'];
                                const updatedExercises = currentSection.exercises.map(ex => 
                                  ex.id === exercise.id 
                                    ? {...ex, tempo: tempoArray}
                                    : ex
                                );
                                setCurrentSection({...currentSection, exercises: updatedExercises});
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // Auto-format incomplete entries
                            const value = e.target.value;
                            if (!value || !/^[0-9X]-[0-9X]-[0-9X]-[0-9X]$/.test(value)) {
                              if (currentSection && currentSection.exercises) {
                                const updatedExercises = currentSection.exercises.map(ex => 
                                  ex.id === exercise.id 
                                    ? {...ex, tempo: ['0', '0', '0', '0']}
                                    : ex
                                );
                                setCurrentSection({...currentSection, exercises: updatedExercises});
                              }
                            }
                          }}
                          className="w-20 text-center text-sm bg-muted border-border"
                        />
                      </div>

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
                    
                    <Textarea 
                      placeholder="Add note..."
                      className="bg-muted border-0 text-sm resize-none"
                      rows={2}
                      value={exercise.notes || ''}
                      onChange={(e) => {
                        if (currentSection && currentSection.exercises) {
                          const updatedExercises = currentSection.exercises.map(ex => 
                            ex.id === exercise.id 
                              ? {...ex, notes: e.target.value}
                              : ex
                          );
                          setCurrentSection({...currentSection, exercises: updatedExercises});
                        }
                      }}
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
              className="pl-10 bg-muted border-border placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
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

  const handleCreateSuperset = (exerciseId: string) => {
    if (!currentSection) return;
    
    const exercise = currentSection.exercises?.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    // Generate a unique superset identifier
    const supersetId = `SS${Date.now().toString().slice(-3)}`;
    
    // Update the exercise with superset group
    setCurrentSection(prev => ({
      ...prev!,
      exercises: prev?.exercises?.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, supersetGroup: supersetId }
          : ex
      ) || []
    }));

    toast({
      title: "Superset created",
      description: `${exercise.exercise?.name} is now part of superset ${supersetId}. Add more exercises to this superset by using the same option.`,
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
            className="flex items-center justify-between cursor-pointer py-3 hover:bg-accent rounded-lg px-2"
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
  const renderExerciseDetailsModal = () => {
    const handleEditToggle = () => {
      if (!isEditingExercise && showExerciseDetails) {
        setEditedExercise({
          name: showExerciseDetails.exercise?.name || '',
          modality: 'strength',
          muscleGroups: showExerciseDetails.exercise?.muscleGroups || [],
          category: showExerciseDetails.exercise?.category || 'strength',
          fields: (showExerciseDetails as any)?.trackingFields || ['reps', 'weight', 'RIR'],
          instructions: showExerciseDetails.exercise?.description || '',
          videoUrl: '',
          photos: []
        });
      }
      setIsEditingExercise(!isEditingExercise);
    };

    const handleSaveChanges = () => {
      if (editedExercise && showExerciseDetails && currentSection) {
        // Update the exercise in the current section
        const updatedExercises = currentSection.exercises?.map(ex => {
          if (ex.id === showExerciseDetails.id) {
            return {
              ...ex,
              exercise: {
                ...ex.exercise,
                name: editedExercise.name,
                category: editedExercise.category,
                muscleGroups: editedExercise.muscleGroups,
                description: editedExercise.instructions
              },
              trackingFields: editedExercise.fields
            } as any;
          }
          return ex;
        }) || [];

        setCurrentSection({ ...currentSection, exercises: updatedExercises });
        
        // Close modal and reset states
        setShowExerciseDetails(null);
        setIsEditingExercise(false);
        setEditedExercise(null);
        
        toast({
          title: "Exercise updated",
          description: `${editedExercise.name} has been updated`,
        });
      }
    };

    return (
      <Dialog open={!!showExerciseDetails} onOpenChange={() => {
        setShowExerciseDetails(null);
        setIsEditingExercise(false);
        setEditedExercise(null);
      }}>
        <DialogContent className="max-w-2xl mx-auto bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {isEditingExercise ? 'Edit Exercise' : 'Exercise Details'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {isEditingExercise ? 'Modify exercise details and save changes' : 'View exercise information and edit if needed'}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditToggle}
                className="ml-2"
              >
                <Edit3 className="w-4 h-4" />
                {isEditingExercise ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </DialogHeader>
        
        {showExerciseDetails && (
          <div className="space-y-6 pb-4">
            {!isEditingExercise ? (
              // View Mode
              <>
                {/* Exercise Image/Video Section */}
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-primary">Ex</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Exercise Media</p>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {showExerciseDetails.exercise?.name}
                  </h2>
                </div>

                {/* Exercise Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-medium text-foreground mb-1">Modality</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {(showExerciseDetails.exercise as any)?.modality || 'strength'}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-medium text-foreground mb-1">Category</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {showExerciseDetails.exercise?.category || 'strength'}
                    </p>
                  </div>
                </div>

                {/* Muscle Groups */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Target Muscles</h4>
                  <div className="flex flex-wrap gap-2">
                    {showExerciseDetails.exercise?.muscleGroups?.map((muscle, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {muscle}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">Not specified</span>}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Instructions</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {showExerciseDetails.exercise?.description || 'No instructions provided'}
                  </div>
                </div>
              </>
            ) : (
              // Edit Mode
              <div className="space-y-4">
                {/* Exercise Name */}
                <div>
                  <Label className="text-sm font-medium text-foreground">Exercise Name</Label>
                  <Input
                    value={editedExercise?.name || ''}
                    onChange={(e) => setEditedExercise((prev: any) => ({ ...prev, name: e.target.value }))}
                    className="mt-1 placeholder:text-muted-foreground/70 placeholder:transition-opacity focus:placeholder:opacity-0"
                    placeholder="Enter exercise name"
                  />
                </div>

                {/* Modality */}
                <div>
                  <Label className="text-sm font-medium text-foreground">Modality</Label>
                  <Select 
                    value={editedExercise?.modality || 'strength'} 
                    onValueChange={(value: string) => setEditedExercise((prev: any) => ({ ...prev, modality: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength" className="text-foreground hover:bg-accent hover:text-accent-foreground">Strength</SelectItem>
                      <SelectItem value="mobility" className="text-foreground hover:bg-accent hover:text-accent-foreground">Mobility</SelectItem>
                      <SelectItem value="cardio" className="text-foreground hover:bg-accent hover:text-accent-foreground">Cardio</SelectItem>
                      <SelectItem value="agility" className="text-foreground hover:bg-accent hover:text-accent-foreground">Agility</SelectItem>
                      <SelectItem value="myofascial-release" className="text-foreground hover:bg-accent hover:text-accent-foreground">Myofascial Release</SelectItem>
                      <SelectItem value="yoga" className="text-foreground hover:bg-accent hover:text-accent-foreground">Yoga</SelectItem>
                      <SelectItem value="activation" className="text-foreground hover:bg-accent hover:text-accent-foreground">Activation</SelectItem>
                      <SelectItem value="conditioning" className="text-foreground hover:bg-accent hover:text-accent-foreground">Conditioning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-medium text-foreground">Category</Label>
                  <Select 
                    value={editedExercise?.category || 'strength'} 
                    onValueChange={(value: string) => setEditedExercise((prev: any) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength" className="text-foreground hover:bg-accent hover:text-accent-foreground">Strength</SelectItem>
                      <SelectItem value="bodyweight" className="text-foreground hover:bg-accent hover:text-accent-foreground">Bodyweight</SelectItem>
                      <SelectItem value="timed" className="text-foreground hover:bg-accent hover:text-accent-foreground">Timed</SelectItem>
                      <SelectItem value="distance-short" className="text-foreground hover:bg-accent hover:text-accent-foreground">Distance (Short) - yards/meters</SelectItem>
                      <SelectItem value="distance-long" className="text-foreground hover:bg-accent hover:text-accent-foreground">Distance (Long) - miles/kilometers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Muscle Groups */}
                <div>
                  <Label className="text-sm font-medium text-foreground">Muscle Groups</Label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {[
                      'Chest', 'Back', 'Shoulders', 'Arms', 'Biceps', 'Triceps',
                      'Legs', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves',
                      'Core', 'Abs', 'Cardio', 'Full Body'
                    ].map((muscle) => (
                      <label key={muscle} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editedExercise?.muscleGroups?.includes(muscle) || false}
                          onChange={(e) => {
                            const current = editedExercise?.muscleGroups || [];
                            if (e.target.checked) {
                              setEditedExercise((prev: any) => ({ 
                                ...prev, 
                                muscleGroups: [...current, muscle] 
                              }));
                            } else {
                              setEditedExercise((prev: any) => ({ 
                                ...prev, 
                                muscleGroups: current.filter((m: string) => m !== muscle) 
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span>{muscle}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <Label className="text-sm font-medium text-foreground">Tracking Fields</Label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {[
                      'time', 'speed', 'cadence', 'distance-long', 'reps', '%1RM',
                      'weight', 'RIR', 'RPE', 'heart-rate', '%HR', 'calories',
                      'watts', 'RPM', 'rounds'
                    ].map((field) => (
                      <label key={field} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editedExercise?.fields?.includes(field) || false}
                          onChange={(e) => {
                            const current = editedExercise?.fields || [];
                            if (e.target.checked) {
                              setEditedExercise((prev: any) => ({ 
                                ...prev, 
                                fields: [...current, field] 
                              }));
                            } else {
                              setEditedExercise((prev: any) => ({ 
                                ...prev, 
                                fields: current.filter((f: string) => f !== field) 
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{field.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <Label className="text-sm font-medium text-foreground">Instructions</Label>
                  <Textarea
                    value={editedExercise?.instructions || ''}
                    onChange={(e) => setEditedExercise((prev: any) => ({ ...prev, instructions: e.target.value }))}
                    className="mt-1 min-h-[100px]"
                    placeholder="Enter exercise instructions..."
                  />
                </div>

                {/* Media Upload Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Add Video
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Add Photos
                  </Button>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleEditToggle}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* Current Workout Configuration - Only show in view mode */}
            {!isEditingExercise && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-foreground mb-3">Current Workout Configuration</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-1">
                      {showExerciseDetails.sets.length} set{showExerciseDetails.sets.length !== 1 ? 's' : ''} configured
                    </div>
                    
                    {/* Sets Table */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground uppercase mb-2">
                        <div>SET</div>
                        <div>TYPE</div>
                        <div>REPS</div>
                        <div>WEIGHT</div>
                        <div>REST</div>
                      </div>
                      {showExerciseDetails.sets.map((set, index) => (
                        <div key={set.id} className="grid grid-cols-5 gap-2 text-sm py-1">
                          <div className="font-medium">{index + 1}</div>
                          <div className={`font-medium ${
                            set.type === 'W' ? 'text-orange-500' :
                            set.type === 'R' ? 'text-blue-500' :
                            set.type === 'D' ? 'text-blue-400' :
                            'text-red-500'
                          }`}>
                            {set.type === 'W' ? 'Warmup' : 
                             set.type === 'R' ? 'Regular' : 
                             set.type === 'D' ? 'Drop' : 'Failure'}
                          </div>
                          <div>{set.reps || '-'}</div>
                          <div>{set.weight ? `${set.weight}lbs` : '-'}</div>
                          <div>{set.rest || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {showExerciseDetails.notes && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{showExerciseDetails.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    );
  };

  // Main render based on step
  return (
    <>
      {step === 'details' && renderDetailsStep()}
      {step === 'sections' && renderSectionsStep()}
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