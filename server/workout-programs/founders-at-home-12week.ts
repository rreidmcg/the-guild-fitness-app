// Founders Pack 12-Week At-Home Workout Program
// Scalable for different ability levels with bodyweight and minimal equipment options

export const foundersAtHome12Week = {
  id: "founders-at-home-12week",
  name: "Founders At-Home 12-Week Program",
  description: "Exclusive 12-week at-home workout program designed for the first 100 Dumbbells & Dragons users. Scalable for all fitness levels with bodyweight and minimal equipment variations.",
  category: "founders",
  difficultyLevel: "Scalable",
  durationWeeks: 12,
  targetMuscleGroups: ["Full Body", "Core", "Cardio"],
  workouts: [
    // Week 1-2: Foundation Building
    {
      week: 1,
      day: 1,
      name: "Foundation Upper Body",
      description: "Build upper body strength with scalable bodyweight movements",
      exercises: [
        {
          name: "Push-ups",
          sets: 3,
          reps: "8-15",
          restSeconds: 60,
          notes: "Beginner: Wall/knee push-ups, Intermediate: Regular, Advanced: Decline/diamond push-ups",
          muscleGroups: ["Chest", "Shoulders", "Triceps"]
        },
        {
          name: "Pike Push-ups",
          sets: 3,
          reps: "5-12",
          restSeconds: 60,
          notes: "Targets shoulders. Beginner: Hands on elevated surface, Advanced: Feet elevated",
          muscleGroups: ["Shoulders", "Triceps"]
        },
        {
          name: "Tricep Dips",
          sets: 3,
          reps: "8-15",
          restSeconds: 60,
          notes: "Use chair/couch. Beginner: Bent knees, Advanced: Straight legs",
          muscleGroups: ["Triceps", "Shoulders"]
        },
        {
          name: "Plank Hold",
          sets: 3,
          reps: "30-60 seconds",
          restSeconds: 45,
          notes: "Core engagement focus. Beginner: Knee plank, Advanced: Add leg lifts",
          muscleGroups: ["Core", "Shoulders"]
        }
      ]
    },
    {
      week: 1,
      day: 2,
      name: "Foundation Lower Body",
      description: "Develop leg strength and mobility",
      exercises: [
        {
          name: "Bodyweight Squats",
          sets: 3,
          reps: "12-20",
          restSeconds: 60,
          notes: "Focus on form. Beginner: Chair assist, Advanced: Jump squats",
          muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"]
        },
        {
          name: "Lunges",
          sets: 3,
          reps: "10 each leg",
          restSeconds: 60,
          notes: "Stationary lunges. Beginner: Hand support, Advanced: Reverse lunges",
          muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"]
        },
        {
          name: "Glute Bridges",
          sets: 3,
          reps: "15-25",
          restSeconds: 45,
          notes: "Squeeze glutes at top. Advanced: Single leg bridges",
          muscleGroups: ["Glutes", "Hamstrings"]
        },
        {
          name: "Calf Raises",
          sets: 3,
          reps: "15-25",
          restSeconds: 45,
          notes: "Use wall for balance. Advanced: Single leg",
          muscleGroups: ["Calves"]
        }
      ]
    },
    {
      week: 1,
      day: 3,
      name: "Foundation Core & Cardio",
      description: "Core strength and cardiovascular endurance",
      exercises: [
        {
          name: "Mountain Climbers",
          sets: 3,
          reps: "20-40",
          restSeconds: 60,
          notes: "Keep core tight. Beginner: Slower pace, Advanced: High knees",
          muscleGroups: ["Core", "Cardio"]
        },
        {
          name: "Dead Bug",
          sets: 3,
          reps: "10 each side",
          restSeconds: 45,
          notes: "Slow controlled movement. Focus on core stability",
          muscleGroups: ["Core", "Hip Flexors"]
        },
        {
          name: "High Knees",
          sets: 3,
          reps: "30 seconds",
          restSeconds: 60,
          notes: "Cardio movement. Beginner: Marching in place",
          muscleGroups: ["Cardio", "Hip Flexors"]
        },
        {
          name: "Side Plank",
          sets: 2,
          reps: "20-45 seconds each side",
          restSeconds: 60,
          notes: "Beginner: Knee side plank, Advanced: Add leg lifts",
          muscleGroups: ["Core", "Obliques"]
        }
      ]
    },

    // Week 3-4: Progression
    {
      week: 3,
      day: 1,
      name: "Progressive Upper Body",
      description: "Increased intensity and volume",
      exercises: [
        {
          name: "Push-up Variations",
          sets: 4,
          reps: "10-18",
          restSeconds: 75,
          notes: "Mix regular, wide, and diamond push-ups",
          muscleGroups: ["Chest", "Shoulders", "Triceps"]
        },
        {
          name: "Handstand Prep",
          sets: 3,
          reps: "30-60 seconds",
          restSeconds: 90,
          notes: "Wall-supported. Focus on shoulder strength",
          muscleGroups: ["Shoulders", "Core"]
        },
        {
          name: "Burpees",
          sets: 3,
          reps: "8-15",
          restSeconds: 90,
          notes: "Full body movement. Beginner: Step back instead of jump",
          muscleGroups: ["Full Body", "Cardio"]
        }
      ]
    },

    // Week 5-8: Strength Building
    {
      week: 5,
      day: 1,
      name: "Strength Upper Focus",
      description: "Maximum strength development",
      exercises: [
        {
          name: "Archer Push-ups",
          sets: 3,
          reps: "6-12 each side",
          restSeconds: 90,
          notes: "Advanced movement. Beginner: Use resistance band assist",
          muscleGroups: ["Chest", "Shoulders", "Core"]
        },
        {
          name: "Pike Walk-outs",
          sets: 3,
          reps: "8-12",
          restSeconds: 75,
          notes: "Core and shoulder stability",
          muscleGroups: ["Shoulders", "Core"]
        }
      ]
    },

    // Week 9-12: Advanced Integration
    {
      week: 9,
      day: 1,
      name: "Advanced Circuit",
      description: "Complex movement patterns and conditioning",
      exercises: [
        {
          name: "Pistol Squat Progression",
          sets: 3,
          reps: "5-10 each leg",
          restSeconds: 90,
          notes: "Use assistance as needed. Build to full pistol squats",
          muscleGroups: ["Quadriceps", "Glutes", "Core"]
        },
        {
          name: "One-Arm Push-up Progression",
          sets: 3,
          reps: "3-8 each arm",
          restSeconds: 120,
          notes: "Advanced goal. Use incline and assistance",
          muscleGroups: ["Chest", "Core", "Shoulders"]
        }
      ]
    }
  ],
  equipment: [
    "None required",
    "Optional: Resistance bands",
    "Optional: Chair or elevated surface",
    "Optional: Water bottles for light weights"
  ],
  progressionNotes: [
    "Week 1-2: Focus on form and movement quality",
    "Week 3-4: Increase repetitions and add variations", 
    "Week 5-8: Introduce advanced progressions",
    "Week 9-12: Master complex movements and combinations"
  ],
  scalingGuidelines: {
    beginner: "Use easier variations, longer rest periods, fewer reps",
    intermediate: "Follow standard program progression",
    advanced: "Add plyometric variations, reduce rest, increase complexity"
  }
};