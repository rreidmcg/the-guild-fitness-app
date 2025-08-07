/**
 * Utility functions for generating URL-safe slugs from names
 */

/**
 * Generate a URL-safe slug from a name
 * Converts "Test Upper Body Workout" to "test-upper-body-workout"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Find item by slug from a list of items with names
 * Supports both exact slug matches and fallback to ID-based matching for backwards compatibility
 */
export function findBySlug<T extends { id: number; name: string }>(
  items: T[] | undefined,
  slug: string
): T | undefined {
  if (!items) return undefined;
  
  // First try to find by generated slug
  const bySlug = items.find(item => generateSlug(item.name) === slug);
  if (bySlug) return bySlug;
  
  // Fallback: if slug is a number, try to find by ID (backwards compatibility)
  const id = parseInt(slug);
  if (!isNaN(id)) {
    return items.find(item => item.id === id);
  }
  
  return undefined;
}

/**
 * Generate a workout overview URL with slug
 */
export function getWorkoutOverviewUrl(workout: { id: number; name: string }): string {
  const slug = generateSlug(workout.name);
  return `/workout-overview/${slug}`;
}

/**
 * Generate a program overview URL with slug
 */
export function getProgramOverviewUrl(program: { id: number; name: string }): string {
  const slug = generateSlug(program.name);
  return `/program-overview/${slug}`;
}

/**
 * Generate a workout session URL with slug
 */
export function getWorkoutSessionUrl(workout: { id: number; name: string }): string {
  const slug = generateSlug(workout.name);
  return `/workout-session/${slug}`;
}