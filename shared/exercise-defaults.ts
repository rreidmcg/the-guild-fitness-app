/**
 * Exercise Default Tracking Fields
 * 
 * Determines which tracking fields should be shown for each exercise category
 * based on what metrics are most relevant for that type of exercise.
 */

export type TrackingField = 'weight' | 'reps' | 'time' | 'RIR' | 'RPE';

/**
 * Get default tracking fields for an exercise based on its category
 */
export function getDefaultTrackingFields(category: string): TrackingField[] {
  switch (category.toLowerCase()) {
    // Strength training - track weight, reps, and intensity
    case 'strength':
    case 'compound':
    case 'isolation':
      return ['weight', 'reps', 'RIR'];
    
    // Bodyweight exercises - track reps and intensity, no weight
    case 'bodyweight':
    case 'calisthenics':
      return ['reps', 'RIR'];
    
    // Cardio exercises - track time and intensity
    case 'cardio':
    case 'conditioning':
    case 'hiit':
      return ['time', 'RPE'];
    
    // Plyometric/explosive - track reps and intensity
    case 'plyometric':
    case 'explosive':
    case 'power':
      return ['reps', 'RPE'];
    
    // Core/abs - track reps and time for holds
    case 'core':
    case 'abs':
      return ['reps', 'time'];
    
    // Flexibility/mobility - track time
    case 'flexibility':
    case 'mobility':
    case 'stretching':
      return ['time'];
    
    // Sports/skill - track time and effort
    case 'sports':
    case 'skill':
      return ['time', 'RPE'];
    
    // Balance/stability - track time
    case 'balance':
    case 'stability':
      return ['time'];
    
    // Default for unknown categories - show all fields
    default:
      return ['weight', 'reps', 'RIR'];
  }
}

/**
 * Check if an exercise category is primarily time-based
 */
export function isTimeBased(category: string): boolean {
  const timeBasedCategories = [
    'cardio', 'conditioning', 'hiit', 'flexibility', 
    'mobility', 'stretching', 'balance', 'stability'
  ];
  return timeBasedCategories.includes(category.toLowerCase());
}

/**
 * Check if an exercise category typically uses weight
 */
export function usesWeight(category: string): boolean {
  const weightCategories = [
    'strength', 'compound', 'isolation'
  ];
  return weightCategories.includes(category.toLowerCase());
}