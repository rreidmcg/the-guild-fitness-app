/* eslint-disable @typescript-eslint/no-unused-vars */
// shared/exercise-extended.ts
//
// Drop this file into /shared.
// It exports EXTENDED_EXERCISES you can spread into your current defaults.
//
// Minimal, self-contained types so this compiles even if your schema differs.
// If you already have an Exercise type, you can swap this for your import.

export type Category = 'strength' | 'cardio' | 'functional';
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push'
  | 'pull'
  | 'carry'
  | 'rotate'
  | 'anti-rotate'
  | 'locomotion'
  | 'jump'
  | 'crawl'
  | 'breathing'
  | 'mixed';

export interface ExerciseDef {
  id: string;              // slug
  name: string;            // display
  category: Category;
  pattern: MovementPattern;
  equipment: string[];     // e.g., ["barbell"], ["bodyweight"], ["dumbbell"]
  primaryMuscles: string[]; // loose taxonomy; keeps it useful across UIs
  unilateral?: boolean;
  timed?: boolean;         // true when typically time-based (e.g., cardio intervals, carries)
  notes?: string;
  tags?: string[];         // free-form: "glute", "anterior chain", "Zone2", "EMOM", etc.
}

// --- helpers ---------------------------------------------------------------

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const x = (
  name: string,
  category: Category,
  pattern: MovementPattern,
  equipment: string[],
  primaryMuscles: string[],
  opts: Partial<Omit<ExerciseDef, 'id' | 'name' | 'category' | 'pattern' | 'equipment' | 'primaryMuscles'>> = {}
): ExerciseDef => ({
  id: slug(name),
  name,
  category,
  pattern,
  equipment,
  primaryMuscles,
  ...opts,
});

// --- library ---------------------------------------------------------------
//
// Coverage goals:
// - Strength: squat, hinge, lunge, push, pull, carry, rotate/anti-rotate + core variants
// - Cardio: Z2, tempo, intervals, machines, running variants, mixed conditioning
// - Functional: carries, crawls, jumps, locomotion, breathing, trunk control
//
// Equipment tags are intentionally generic to play nice with filters.

export const EXTENDED_EXERCISES: ExerciseDef[] = [
  // ---------------- STRENGTH: SQUAT ----------------
  x('Back Squat', 'strength', 'squat', ['barbell'], ['quads', 'glutes', 'core']),
  x('Front Squat', 'strength', 'squat', ['barbell'], ['quads', 'upper back', 'core']),
  x('Box Squat', 'strength', 'squat', ['barbell', 'box'], ['glutes', 'hamstrings', 'quads']),
  x('Zercher Squat', 'strength', 'squat', ['barbell'], ['quads', 'glutes', 'core']),
  x('Goblet Squat', 'strength', 'squat', ['dumbbell', 'kettlebell'], ['quads', 'glutes', 'core']),
  x('Overhead Squat', 'strength', 'squat', ['barbell'], ['quads', 'shoulders', 'core']),
  x('Heel-Elevated DB Squat', 'strength', 'squat', ['dumbbell', 'plates'], ['quads', 'glutes']),
  x('Safety Bar Squat', 'strength', 'squat', ['barbell'], ['quads', 'glutes', 'upper back']),
  x('Split Squat', 'strength', 'lunge', ['dumbbell'], ['quads', 'glutes'], { unilateral: true }),
  x('Rear-Foot Elevated Split Squat', 'strength', 'lunge', ['dumbbell', 'bench'], ['quads', 'glutes'], { unilateral: true, tags: ['RFESS'] }),
  x('Cyclist Squat', 'strength', 'squat', ['barbell'], ['quads'], { tags: ['narrow stance'] }),

  // ---------------- STRENGTH: HINGE ----------------
  x('Conventional Deadlift', 'strength', 'hinge', ['barbell'], ['posterior chain', 'glutes', 'hamstrings']),
  x('Sumo Deadlift', 'strength', 'hinge', ['barbell'], ['glutes', 'hamstrings', 'adductors']),
  x('Romanian Deadlift', 'strength', 'hinge', ['barbell'], ['hamstrings', 'glutes']),
  x('Trap Bar Deadlift', 'strength', 'hinge', ['trap bar'], ['glutes', 'quads', 'hamstrings']),
  x('DB Romanian Deadlift', 'strength', 'hinge', ['dumbbell'], ['hamstrings', 'glutes']),
  x('Single-Leg RDL', 'strength', 'hinge', ['dumbbell'], ['hamstrings', 'glutes', 'ankle stabilizers'], { unilateral: true }),
  x('Hip Thrust', 'strength', 'hinge', ['barbell', 'bench'], ['glutes', 'hamstrings']),
  x('Good Morning', 'strength', 'hinge', ['barbell'], ['hamstrings', 'glutes', 'erectors']),

  // ---------------- STRENGTH: LUNGE / STEP ----------------
  x('Forward Lunge', 'strength', 'lunge', ['dumbbell', 'bodyweight'], ['quads', 'glutes'], { unilateral: true }),
  x('Reverse Lunge', 'strength', 'lunge', ['dumbbell', 'bodyweight'], ['glutes', 'hamstrings'], { unilateral: true }),
  x('Walking Lunge', 'strength', 'lunge', ['dumbbell', 'bodyweight'], ['quads', 'glutes'], { unilateral: true, locomotion: true }),
  x('Step-Up', 'strength', 'lunge', ['dumbbell', 'box'], ['quads', 'glutes'], { unilateral: true }),
  x('Lateral Lunge', 'strength', 'lunge', ['dumbbell', 'bodyweight'], ['adductors', 'glutes'], { unilateral: true }),
  x('Cossack Squat', 'strength', 'lunge', ['bodyweight', 'kettlebell'], ['adductors', 'quads'], { unilateral: true }),

  // ---------------- STRENGTH: PUSH ----------------
  x('Bench Press', 'strength', 'push', ['barbell', 'bench'], ['chest', 'triceps', 'front delts']),
  x('Incline Bench Press', 'strength', 'push', ['barbell', 'bench'], ['upper chest', 'triceps']),
  x('Dumbbell Bench Press', 'strength', 'push', ['dumbbell', 'bench'], ['chest', 'triceps']),
  x('Push-Up', 'strength', 'push', ['bodyweight'], ['chest', 'triceps', 'core']),
  x('Weighted Push-Up', 'strength', 'push', ['bodyweight', 'plate'], ['chest', 'triceps', 'core']),
  x('Overhead Press', 'strength', 'push', ['barbell'], ['delts', 'triceps', 'upper back']),
  x('Seated DB Shoulder Press', 'strength', 'push', ['dumbbell', 'bench'], ['delts', 'triceps']),
  x('Landmine Press', 'strength', 'push', ['barbell', 'landmine'], ['delts', 'upper chest', 'core']),
  x('Dips', 'strength', 'push', ['dip bars'], ['chest', 'triceps']),

  // ---------------- STRENGTH: PULL ----------------
  x('Bent-Over Row', 'strength', 'pull', ['barbell'], ['lats', 'mid-back', 'biceps']),
  x('Pendlay Row', 'strength', 'pull', ['barbell'], ['lats', 'mid-back', 'posterior delts']),
  x('One-Arm DB Row', 'strength', 'pull', ['dumbbell', 'bench'], ['lats', 'mid-back', 'biceps'], { unilateral: true }),
  x('Seal Row', 'strength', 'pull', ['barbell', 'bench'], ['lats', 'mid-back']),
  x('Chest-Supported DB Row', 'strength', 'pull', ['dumbbell', 'bench'], ['lats', 'mid-back']),
  x('Lat Pulldown', 'strength', 'pull', ['cable'], ['lats', 'biceps']),
  x('Pull-Up', 'strength', 'pull', ['bar'], ['lats', 'biceps', 'scapular stabilizers']),
  x('Chin-Up', 'strength', 'pull', ['bar'], ['lats', 'biceps']),
  x('Face Pull', 'strength', 'pull', ['cable', 'band'], ['rear delts', 'external rotators']),

  // ---------------- STRENGTH: CARRY ----------------
  x('Farmer Carry', 'strength', 'carry', ['dumbbell', 'kettlebell', 'trap bar'], ['grip', 'traps', 'core'], { timed: true, tags: ['Z-Lift'] }),
  x('Suitcase Carry', 'strength', 'carry', ['dumbbell', 'kettlebell'], ['obliques', 'grip', 'core'], { unilateral: true, timed: true, tags: ['Z-Lift', 'anti-lateral-flexion'] }),
  x('Front Rack Carry', 'strength', 'carry', ['kettlebell', 'barbell'], ['core', 'upper back'], { timed: true, tags: ['Z-Lift'] }),
  x('Overhead Carry', 'strength', 'carry', ['dumbbell', 'kettlebell', 'barbell'], ['shoulders', 'core'], { timed: true, tags: ['Z-Lift'] }),
  x('Zercher Carry', 'strength', 'carry', ['barbell'], ['core', 'biceps', 'upper back'], { timed: true, tags: ['Z-Lift'] }),

  // ---------------- STRENGTH: ROTATE / ANTI-ROTATE / CORE ----------------
  x('Plank', 'strength', 'anti-rotate', ['bodyweight'], ['anterior core'], { timed: true }),
  x('Side Plank', 'strength', 'anti-rotate', ['bodyweight'], ['obliques'], { timed: true, unilateral: true }),
  x('Dead Bug', 'strength', 'anti-rotate', ['bodyweight'], ['anterior core']),
  x('Pallof Press', 'strength', 'anti-rotate', ['band', 'cable'], ['obliques', 'anterior core']),
  x('Hanging Knee Raise', 'strength', 'rotate', ['bar'], ['hip flexors', 'abs']),
  x('Hanging Leg Raise', 'strength', 'rotate', ['bar'], ['abs', 'hip flexors']),
  x('Cable Chop (High-to-Low)', 'strength', 'rotate', ['cable', 'band'], ['obliques']),
  x('Cable Lift (Low-to-High)', 'strength', 'rotate', ['cable', 'band'], ['obliques']),
  x('Back Extension', 'strength', 'hinge', ['GHD', 'roman chair'], ['erectors', 'glutes', 'hamstrings']),
  x('Reverse Hyper', 'strength', 'hinge', ['reverse hyper'], ['glutes', 'erectors']),

  // ---------------- CARDIO: MACHINES / MODES ----------------
  x('Treadmill Easy Run (Z2)', 'cardio', 'locomotion', ['treadmill', 'shoes'], ['cardiorespiratory'], { timed: true, tags: ['Zone2'] }),
  x('Treadmill Tempo Run', 'cardio', 'locomotion', ['treadmill', 'shoes'], ['cardiorespiratory'], { timed: true, tags: ['Tempo'] }),
  x('Treadmill Intervals 30/30', 'cardio', 'locomotion', ['treadmill', 'shoes'], ['cardiorespiratory'], { timed: true, tags: ['Intervals'] }),
  x('Outdoor Easy Run (Z2)', 'cardio', 'locomotion', ['shoes'], ['cardiorespiratory'], { timed: true, tags: ['Zone2'] }),
  x('Track Repeats (400s)', 'cardio', 'locomotion', ['shoes'], ['cardiorespiratory'], { timed: true, tags: ['Intervals'] }),
  x('Stationary Bike Z2', 'cardio', 'locomotion', ['bike'], ['cardiorespiratory'], { timed: true, tags: ['Zone2'] }),
  x('Stationary Bike Intervals', 'cardio', 'locomotion', ['bike'], ['cardiorespiratory'], { timed: true, tags: ['Intervals'] }),
  x('Assault Bike Sprints', 'cardio', 'locomotion', ['air bike'], ['cardiorespiratory'], { timed: true, tags: ['Sprints', 'HIIT'] }),
  x('Row Erg Z2', 'cardio', 'locomotion', ['rower'], ['cardiorespiratory', 'lats', 'legs'], { timed: true, tags: ['Zone2'] }),
  x('Row Erg Intervals', 'cardio', 'locomotion', ['rower'], ['cardiorespiratory', 'lats', 'legs'], { timed: true, tags: ['Intervals'] }),
  x('Ski Erg Z2', 'cardio', 'locomotion', ['ski erg'], ['cardiorespiratory', 'lats', 'triceps'], { timed: true, tags: ['Zone2'] }),
  x('Ski Erg Intervals', 'cardio', 'locomotion', ['ski erg'], ['cardiorespiratory', 'lats', 'triceps'], { timed: true, tags: ['Intervals'] }),
  x('Stair Climber', 'cardio', 'locomotion', ['stair mill'], ['cardiorespiratory', 'quads', 'glutes'], { timed: true }),
  x('Elliptical Z2', 'cardio', 'locomotion', ['elliptical'], ['cardiorespiratory'], { timed: true, tags: ['Zone2'] }),
  x('Jump Rope (Steady)', 'cardio', 'jump', ['rope'], ['calves', 'cardiorespiratory'], { timed: true }),
  x('Jump Rope (Intervals)', 'cardio', 'jump', ['rope'], ['calves', 'cardiorespiratory'], { timed: true, tags: ['Intervals'] }),
  x('Swimming Easy (Z2)', 'cardio', 'locomotion', ['pool'], ['cardiorespiratory', 'lats'], { timed: true, tags: ['Zone2'] }),
  x('Swimming Intervals', 'cardio', 'locomotion', ['pool'], ['cardiorespiratory', 'lats'], { timed: true, tags: ['Intervals'] }),
  x('Ruck Walk (Loaded)', 'cardio', 'locomotion', ['ruck'], ['posterior chain', 'cardiorespiratory'], { timed: true, tags: ['Zone2', 'load carriage'] }),
  x('Incline Hike (Treadmill)', 'cardio', 'locomotion', ['treadmill'], ['glutes', 'cardiorespiratory'], { timed: true, tags: ['Zone2'] }),

  // ---------------- CARDIO: MIXED BODYWEIGHT / KB ----------------
  x('Burpee (Steady Pace)', 'cardio', 'mixed', ['bodyweight'], ['full body', 'cardiorespiratory'], { timed: true }),
  x('Burpee (EMOM Intervals)', 'cardio', 'mixed', ['bodyweight'], ['full body'], { timed: true, tags: ['EMOM'] }),
  x('KB Swing (Hardstyle)', 'cardio', 'hinge', ['kettlebell'], ['glutes', 'hamstrings', 'cardiorespiratory'], { timed: true }),
  x('KB Snatch (Cycling)', 'cardio', 'hinge', ['kettlebell'], ['posterior chain', 'cardiorespiratory'], { timed: true }),
  x('KB Clean & Push Press', 'cardio', 'mixed', ['kettlebell'], ['posterior chain', 'delts', 'cardiorespiratory'], { timed: true }),
  x('DB Thruster (Light, Cycled)', 'cardio', 'squat', ['dumbbell'], ['quads', 'delts', 'cardiorespiratory'], { timed: true }),

  // ---------------- FUNCTIONAL: CRAWLS / JUMPS / LOCOMOTION ----------------
  x('Bear Crawl', 'functional', 'crawl', ['bodyweight'], ['shoulders', 'core'], { timed: true }),
  x('Crawling – Lateral', 'functional', 'crawl', ['bodyweight'], ['shoulders', 'core'], { timed: true }),
  x('Crab Walk', 'functional', 'crawl', ['bodyweight'], ['posterior chain', 'triceps'], { timed: true }),
  x('Broad Jump', 'functional', 'jump', ['bodyweight'], ['glutes', 'hamstrings']),
  x('Box Jump', 'functional', 'jump', ['box'], ['quads', 'glutes']),
  x('Seated Box Jump', 'functional', 'jump', ['box'], ['quads', 'glutes']),
  x('Lateral Hop (Line)', 'functional', 'jump', ['bodyweight'], ['calves', 'glutes'], { timed: true }),
  x('Shuttle Run (5–10–5)', 'functional', 'locomotion', ['cones'], ['cardiorespiratory', 'adductors'], { timed: true }),
  x('Sled Push', 'functional', 'locomotion', ['sled'], ['quads', 'glutes', 'cardiorespiratory'], { timed: true }),
  x('Sled Drag (Backwards)', 'functional', 'locomotion', ['sled'], ['quads', 'glutes'], { timed: true }),
  x('Sled Drag (Forwards)', 'functional', 'locomotion', ['sled'], ['hamstrings', 'glutes'], { timed: true }),

  // ---------------- FUNCTIONAL: BREATHING / CONTROL ----------------
  x('Box Breathing (4-4-4-4)', 'functional', 'breathing', ['bodyweight'], ['diaphragm'], { timed: true, tags: ['parasympathetic'] }),
  x('Resisted Diaphragmatic Breathing (Band Around Ribs)', 'functional', 'breathing', ['band'], ['diaphragm'], { timed: true }),
  x('Crocodile Breathing', 'functional', 'breathing', ['bodyweight'], ['diaphragm'], { timed: true }),

  // ---------------- ACCESSORY / ISOLATION (STRENGTH) ----------------
  x('Biceps Curl (DB)', 'strength', 'pull', ['dumbbell'], ['biceps']),
  x('Hammer Curl', 'strength', 'pull', ['dumbbell'], ['biceps', 'brachialis']),
  x('EZ-Bar Curl', 'strength', 'pull', ['barbell'], ['biceps']),
  x('Triceps Rope Pressdown', 'strength', 'push', ['cable'], ['triceps']),
  x('Skull Crusher', 'strength', 'push', ['barbell'], ['triceps']),
  x('Lateral Raise', 'strength', 'push', ['dumbbell'], ['delts']),
  x('Rear Delt Fly (DB)', 'strength', 'pull', ['dumbbell'], ['rear delts']),
  x('Reverse Pec Deck', 'strength', 'pull', ['machine'], ['rear delts']),
  x('Calf Raise (Standing)', 'strength', 'squat', ['machine', 'bodyweight'], ['calves']),
  x('Calf Raise (Seated)', 'strength', 'squat', ['machine'], ['calves']),
  x('Leg Extension', 'strength', 'squat', ['machine'], ['quads']),
  x('Leg Curl (Seated/Lying)', 'strength', 'hinge', ['machine'], ['hamstrings']),
  x('Glute Kickback (Cable)', 'strength', 'hinge', ['cable'], ['glutes'], { unilateral: true }),
  x('Hip Abduction (Machine)', 'strength', 'lunge', ['machine'], ['glute medius']),
  x('Hip Adduction (Machine)', 'strength', 'lunge', ['machine'], ['adductors']),

  // ---------------- MOBILITY & TISSUE CARE (FUNCTIONAL) ----------------
  x('90/90 Hip Switch', 'functional', 'rotate', ['bodyweight'], ['hips']),
  x('Pigeon Stretch (Active)', 'functional', 'rotate', ['bodyweight'], ['glutes']),
  x('Couch Stretch (Active)', 'functional', 'rotate', ['bodyweight'], ['hip flexors']),
  x('Thoracic Extension on Foam Roller', 'functional', 'rotate', ['foam roller'], ['t-spine']),
  x('Bretzel', 'functional', 'rotate', ['bodyweight'], ['t-spine', 'hips']),
  x('Ankle Dorsiflexion Rock', 'functional', 'locomotion', ['bodyweight'], ['ankle']),
];

// Optional: freeze to avoid accidental mutations at runtime.
Object.freeze(EXTENDED_EXERCISES);
