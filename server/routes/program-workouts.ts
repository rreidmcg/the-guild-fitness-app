import type { Express } from "express";
import { storage } from "../storage";
import { insertProgramWorkoutSchema } from "../../shared/schema.js";

/**
 * Program workout management routes (CRUD operations for individual workouts within programs)
 */
export function registerProgramWorkoutRoutes(app: Express) {
  // Helper function to get current user ID from session
  function getCurrentUserId(req: any): number | null {
    return req.session?.userId || null;
  }

  // Get a specific program workout by ID
  app.get("/api/program-workouts/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      const workout = await storage.getProgramWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ error: "Program workout not found" });
      }

      // Get program to verify access (null safety check)
      if (!workout.programId) {
        return res.status(400).json({ error: "Workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(workout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Check if user has access to this program
      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(workout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(workout);
    } catch (error) {
      console.error("Error fetching program workout:", error);
      res.status(500).json({ error: "Failed to fetch program workout" });
    }
  });

  // Create a new program workout
  app.post("/api/workout-programs/:programId/workouts", async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      const validationResult = insertProgramWorkoutSchema.safeParse({
        ...req.body,
        programId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid workout data", details: validationResult.error.errors });
      }

      // Verify program exists and user has access
      const program = await storage.getWorkoutProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const workout = await storage.createProgramWorkout(validationResult.data);
      res.status(201).json(workout);
    } catch (error) {
      console.error("Error creating program workout:", error);
      res.status(500).json({ error: "Failed to create program workout" });
    }
  });

  // Update a program workout
  app.put("/api/program-workouts/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      // Get existing workout to verify ownership
      const existingWorkout = await storage.getProgramWorkout(workoutId);
      if (!existingWorkout) {
        return res.status(404).json({ error: "Program workout not found" });
      }

      // Verify program access (null safety check)
      if (!existingWorkout.programId) {
        return res.status(400).json({ error: "Workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(existingWorkout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(existingWorkout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updatedWorkout = await storage.updateProgramWorkout(workoutId, req.body);
      res.json(updatedWorkout);
    } catch (error) {
      console.error("Error updating program workout:", error);
      res.status(500).json({ error: "Failed to update program workout" });
    }
  });

  // Delete a program workout
  app.delete("/api/program-workouts/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      
      // Get existing workout to verify ownership
      const existingWorkout = await storage.getProgramWorkout(workoutId);
      if (!existingWorkout) {
        return res.status(404).json({ error: "Program workout not found" });
      }

      // Verify program access (null safety check)
      if (!existingWorkout.programId) {
        return res.status(400).json({ error: "Workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(existingWorkout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(existingWorkout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteProgramWorkout(workoutId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting program workout:", error);
      res.status(500).json({ error: "Failed to delete program workout" });
    }
  });

  // Copy/duplicate a program workout
  app.post("/api/program-workouts/:workoutId/copy", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const userId = getCurrentUserId(req); 
      if (!userId) { 
        return res.status(401).json({ error: "Authentication required" }); 
      }
      
      // Only allow Zero to access workout programs for now
      const user = await storage.getUser(userId);
      if (!user || user.username !== "Zero") {
        return res.status(403).json({ error: "Programs are currently only available to Zero" });
      }
      const { weekNumber, dayNumber, name } = req.body;
      
      // Get source workout
      const sourceWorkout = await storage.getProgramWorkout(workoutId);
      if (!sourceWorkout) {
        return res.status(404).json({ error: "Source workout not found" });
      }

      // Verify program access (null safety check)
      if (!sourceWorkout.programId) {
        return res.status(400).json({ error: "Source workout has no associated program" });
      }
      const program = await storage.getWorkoutProgram(sourceWorkout.programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      const purchasedPrograms = await storage.getUserPurchasedPrograms(userId);
      const hasAccess = purchasedPrograms.includes(sourceWorkout.programId.toString()) || (program.price || 0) === 0;
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Create copy with new position and name
      const copiedWorkout = await storage.createProgramWorkout({
        programId: sourceWorkout.programId,
        weekNumber: weekNumber || sourceWorkout.weekNumber,
        dayNumber: dayNumber || sourceWorkout.dayNumber,
        name: name || `${sourceWorkout.name} (Copy)`,
        description: sourceWorkout.description,
        exercises: sourceWorkout.exercises,
        notes: sourceWorkout.notes,
        estimatedDuration: sourceWorkout.estimatedDuration,
      });
      
      res.status(201).json(copiedWorkout);
    } catch (error) {
      console.error("Error copying program workout:", error);
      res.status(500).json({ error: "Failed to copy program workout" });
    }
  });
}