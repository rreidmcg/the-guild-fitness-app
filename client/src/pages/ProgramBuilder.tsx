import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Save, Eye, Archive, Copy, Trash2, Settings, MoreHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { TrainingProgram, Workout, DayCell } from "@shared/schema";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const GOALS = ["Strength", "Stamina", "Balanced"];

export default function ProgramBuilder() {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    goal: "",
    tags: [] as string[],
    equipment: [] as string[],
    durationWeeks: 4,
    daysPerWeek: 4,
    coachNotes: ""
  });

  const { data: programs, isLoading } = useQuery({
    queryKey: ["/api/training-programs"],
  });

  const { data: workouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  const createProgramMutation = useMutation({
    mutationFn: (programData: any) => apiRequest("/api/training-programs", {
      method: "POST",
      body: programData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      setIsCreating(false);
      setProgramForm({
        name: "",
        description: "",
        goal: "",
        tags: [],
        equipment: [],
        durationWeeks: 4,
        daysPerWeek: 4,
        coachNotes: ""
      });
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/training-programs/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
    },
  });

  const duplicateProgramMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiRequest(`/api/training-programs/${id}/duplicate`, {
        method: "POST",
        body: { name },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
    },
  });

  const publishProgramMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/training-programs/${id}/publish`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
    },
  });

  const handleCreateProgram = () => {
    const calendar = Array.from({ length: programForm.durationWeeks }, (_, weekIndex) => ({
      weekIndex,
      days: Array.from({ length: 7 }, () => ({} as DayCell))
    }));

    createProgramMutation.mutate({
      ...programForm,
      calendar,
    });
  };

  const handleAssignWorkout = (weekIndex: number, dayIndex: number, workoutId: string) => {
    if (!selectedProgram) return;

    const updatedCalendar = [...selectedProgram.calendar];
    updatedCalendar[weekIndex].days[dayIndex] = { workoutId };

    updateProgramMutation.mutate({
      id: selectedProgram.id,
      data: { calendar: updatedCalendar }
    });
  };

  const handleToggleRest = (weekIndex: number, dayIndex: number) => {
    if (!selectedProgram) return;

    const updatedCalendar = [...selectedProgram.calendar];
    const currentDay = updatedCalendar[weekIndex].days[dayIndex];
    
    if (currentDay.rest) {
      updatedCalendar[weekIndex].days[dayIndex] = {};
    } else {
      updatedCalendar[weekIndex].days[dayIndex] = { rest: true };
    }

    updateProgramMutation.mutate({
      id: selectedProgram.id,
      data: { calendar: updatedCalendar }
    });
  };

  const handleClearCell = (weekIndex: number, dayIndex: number) => {
    if (!selectedProgram) return;

    const updatedCalendar = [...selectedProgram.calendar];
    updatedCalendar[weekIndex].days[dayIndex] = {};

    updateProgramMutation.mutate({
      id: selectedProgram.id,
      data: { calendar: updatedCalendar }
    });
  };

  const CalendarCell = ({ dayCell, weekIndex, dayIndex }: { 
    dayCell: DayCell; 
    weekIndex: number; 
    dayIndex: number; 
  }) => {
    const getWorkoutName = (workoutId: string) => {
      const workout = workouts?.find((w: Workout) => w.id.toString() === workoutId);
      return workout?.name || "Unknown Workout";
    };

    if (dayCell.rest) {
      return (
        <div className="program-builder__cell program-builder__cell--rest">
          <span className="program-builder__cell-content">REST</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleClearCell(weekIndex, dayIndex)}
            className="program-builder__cell-action"
          >
            ×
          </Button>
        </div>
      );
    }

    if (dayCell.workoutId) {
      return (
        <div className="program-builder__cell program-builder__cell--workout">
          <span className="program-builder__cell-content">
            {getWorkoutName(dayCell.workoutId)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleClearCell(weekIndex, dayIndex)}
            className="program-builder__cell-action"
          >
            ×
          </Button>
        </div>
      );
    }

    return (
      <div className="program-builder__cell program-builder__cell--empty">
        <div className="program-builder__cell-actions">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                + Assign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Workout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {workouts?.map((workout: Workout) => (
                    <Button
                      key={workout.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleAssignWorkout(weekIndex, dayIndex, workout.id.toString())}
                    >
                      {workout.name}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleToggleRest(weekIndex, dayIndex)}
                >
                  Mark as Rest Day
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="program-builder__loading">Loading programs...</div>;
  }

  if (!selectedProgram) {
    return (
      <div className="program-builder">
        <div className="program-builder__header">
          <h1 className="program-builder__title">Program Builder</h1>
          <Button onClick={() => setIsCreating(true)} className="program-builder__create-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Button>
        </div>

        <div className="program-builder__grid">
          {programs?.map((program: TrainingProgram) => (
            <Card key={program.id} className="program-builder__program-card">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{program.name}</h3>
                  <Badge variant={program.status === "published" ? "default" : "secondary"}>
                    {program.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{program.durationWeeks} weeks</span>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedProgram(program)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateProgramMutation.mutate({
                        id: program.id,
                        name: `${program.name} (Copy)`
                      })}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Program Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Program Name *</label>
                <Input
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={programForm.description}
                  onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  placeholder="Program description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Goal</label>
                  <Select
                    value={programForm.goal}
                    onValueChange={(value) => setProgramForm({ ...programForm, goal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOALS.map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (weeks)</label>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={programForm.durationWeeks}
                    onChange={(e) => setProgramForm({ 
                      ...programForm, 
                      durationWeeks: parseInt(e.target.value) || 1 
                    })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Coach Notes</label>
                <Textarea
                  value={programForm.coachNotes}
                  onChange={(e) => setProgramForm({ ...programForm, coachNotes: e.target.value })}
                  placeholder="Notes for clients"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProgram} disabled={!programForm.name}>
                  Create Program
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="program-builder">
      <div className="program-builder__header">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setSelectedProgram(null)}>
            ← Back
          </Button>
          <div>
            <h1 className="program-builder__title">{selectedProgram.name}</h1>
            <Badge variant={selectedProgram.status === "published" ? "default" : "secondary"}>
              {selectedProgram.status}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          {selectedProgram.status === "draft" && (
            <Button onClick={() => publishProgramMutation.mutate(selectedProgram.id)}>
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="program-builder__calendar">
        <div className="program-builder__calendar-header">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="program-builder__day-header">
              {day}
            </div>
          ))}
        </div>

        <div className="program-builder__weeks">
          {selectedProgram.calendar.map((week, weekIndex) => (
            <div key={weekIndex} className="program-builder__week">
              <div className="program-builder__week-header">
                <span>Week {weekIndex + 1}</span>
              </div>
              <div className="program-builder__week-days">
                {week.days.map((dayCell, dayIndex) => (
                  <CalendarCell
                    key={dayIndex}
                    dayCell={dayCell}
                    weekIndex={weekIndex}
                    dayIndex={dayIndex}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}