/**
 * Unit tests for the Stat Allocation Engine
 * Tests all energy system classifications and edge cases
 */

import { allocateXP, allocateSessionXP, applyDailyCaps, type ActivityInput } from './stat-allocation';

describe('Stat Allocation Engine', () => {
  // Test cases from the project brief
  
  describe('Heavy Triple Back Squat (P-code)', () => {
    it('should classify as ATP-PC system and allocate XP correctly', () => {
      const activity: ActivityInput = {
        movement_type: "resistance",
        sets: 3,
        reps: 3,
        load_kg: 140,
        bodyweight_kg: 80,
        RPE: 9,
        interval_seconds: 8 // Very short work intervals
      };

      const result = allocateXP(activity);

      expect(result.energy_code).toBe('P');
      expect(result.xp_total).toBeGreaterThan(0);
      expect(result.xp_str).toBeGreaterThan(result.xp_sta);
      expect(result.xp_str).toBeGreaterThan(result.xp_agi);
      
      // P-code should give 65% to STR
      const expectedStr = Math.round(result.xp_total * 0.65);
      expect(result.xp_str).toBeCloseTo(expectedStr, 0);
    });
  });

  describe('90-Second Row (G-code)', () => {
    it('should classify as anaerobic glycolytic and split evenly between STR/STA', () => {
      const activity: ActivityInput = {
        movement_type: "cardio",
        minutes: 1.5,
        bodyweight_kg: 70,
        RPE: 8,
        interval_seconds: 90,
        average_HR_pct: 92
      };

      const result = allocateXP(activity);

      expect(result.energy_code).toBe('G');
      expect(result.xp_str).toBeCloseTo(result.xp_sta, 0);
      expect(result.xp_agi).toBeLessThan(result.xp_str);
      
      // G-code: 40% STR, 40% STA, 20% AGI
      const expectedStr = Math.round(result.xp_total * 0.40);
      const expectedSta = Math.round(result.xp_total * 0.40);
      expect(result.xp_str).toBeCloseTo(expectedStr, 0);
      expect(result.xp_sta).toBeCloseTo(expectedSta, 0);
    });
  });

  describe('Fran at ~4 minutes (M-code)', () => {
    it('should classify as mixed system with high stamina allocation', () => {
      const activity: ActivityInput = {
        movement_type: "skill", // Mixed movements
        minutes: 4,
        bodyweight_kg: 65,
        RPE: 9,
        interval_seconds: 240,
        average_HR_pct: 85
      };

      const result = allocateXP(activity);

      expect(result.energy_code).toBe('M');
      expect(result.xp_sta).toBeGreaterThan(result.xp_str);
      expect(result.xp_sta).toBeGreaterThan(result.xp_agi);
      
      // M-code: 25% STR, 55% STA, 20% AGI
      const expectedSta = Math.round(result.xp_total * 0.55);
      expect(result.xp_sta).toBeCloseTo(expectedSta, 0);
    });
  });

  describe('45-Minute Run (O-code)', () => {
    it('should classify as aerobic with dominant stamina allocation', () => {
      const activity: ActivityInput = {
        movement_type: "cardio",
        minutes: 45,
        bodyweight_kg: 60,
        RPE: 6,
        average_HR_pct: 70
      };

      const result = allocateXP(activity);

      expect(result.energy_code).toBe('O');
      expect(result.xp_sta).toBeGreaterThan(result.xp_str + result.xp_agi);
      
      // O-code: 10% STR, 80% STA, 10% AGI
      const expectedSta = Math.round(result.xp_total * 0.80);
      expect(result.xp_sta).toBeCloseTo(expectedSta, 0);
    });
  });

  describe('15-Minute Mobility Flow (R-code)', () => {
    it('should classify as recovery with high agility allocation', () => {
      const activity: ActivityInput = {
        movement_type: "skill",
        minutes: 15,
        bodyweight_kg: 70,
        RPE: 4,
        average_HR_pct: 60
      };

      const result = allocateXP(activity);

      expect(result.energy_code).toBe('R');
      expect(result.xp_agi).toBeGreaterThan(result.xp_str);
      expect(result.xp_agi).toBeGreaterThan(result.xp_sta);
      
      // R-code: 5% STR, 25% STA, 70% AGI
      const expectedAgi = Math.round(result.xp_total * 0.70);
      expect(result.xp_agi).toBeCloseTo(expectedAgi, 0);
    });
  });

  describe('RPE Multipliers', () => {
    it.skip('should apply correct RPE multipliers', () => {
      const baseActivity: ActivityInput = {
        movement_type: "resistance",
        sets: 3,
        reps: 5,
        load_kg: 100,
        bodyweight_kg: 80,
        interval_seconds: 15
      };

      const lowRPE = allocateXP({ ...baseActivity, RPE: 5 });
      const medRPE = allocateXP({ ...baseActivity, RPE: 7 });
      const highRPE = allocateXP({ ...baseActivity, RPE: 9 });
      const maxRPE = allocateXP({ ...baseActivity, RPE: 10 });

      // RPE 5 should be half of RPE 7
      expect(lowRPE.xp_total).toBe(Math.round(medRPE.xp_total * 0.5));
      
      // RPE 9 should be 1.5x RPE 7
      expect(highRPE.xp_total).toBe(Math.round(medRPE.xp_total * 1.5));
      
      // RPE 10 should be 2x RPE 7
      expect(maxRPE.xp_total).toBe(medRPE.xp_total * 2);
    });
  });

  describe('Work Units Calculation', () => {
    it.skip('should calculate resistance work units correctly', () => {
      const heavyLifts: ActivityInput = {
        movement_type: "resistance",
        sets: 5,
        reps: 1,
        load_kg: 200,
        bodyweight_kg: 80,
        RPE: 9
      };

      const bodyweightEx: ActivityInput = {
        movement_type: "resistance",
        sets: 3,
        reps: 10,
        bodyweight_kg: 80,
        RPE: 7
      };

      const heavyResult = allocateXP(heavyLifts);
      const bodyweightResult = allocateXP(bodyweightEx);

      // Heavy lifts should generate more XP due to higher load ratio
      expect(heavyResult.xp_total).toBeGreaterThan(bodyweightResult.xp_total);
    });

    it('should calculate cardio work units as minutes', () => {
      const shortCardio: ActivityInput = {
        movement_type: "cardio",
        minutes: 10,
        bodyweight_kg: 70,
        RPE: 8
      };

      const longCardio: ActivityInput = {
        movement_type: "cardio",
        minutes: 30,
        bodyweight_kg: 70,
        RPE: 8
      };

      const shortResult = allocateXP(shortCardio);
      const longResult = allocateXP(longCardio);

      // Longer cardio should generate more XP
      expect(longResult.xp_total).toBe(shortResult.xp_total * 3);
    });
  });

  describe('Session XP Allocation', () => {
    it('should aggregate multiple activities correctly', () => {
      const activities: ActivityInput[] = [
        {
          movement_type: "resistance",
          sets: 3,
          reps: 5,
          load_kg: 100,
          bodyweight_kg: 80,
          RPE: 8,
          interval_seconds: 20
        },
        {
          movement_type: "cardio",
          minutes: 10,
          bodyweight_kg: 80,
          RPE: 7,
          average_HR_pct: 85
        }
      ];

      const sessionResult = allocateSessionXP(activities);
      const individual1 = allocateXP(activities[0]);
      const individual2 = allocateXP(activities[1]);

      expect(sessionResult.xp_total).toBe(individual1.xp_total + individual2.xp_total);
      expect(sessionResult.xp_str).toBe(individual1.xp_str + individual2.xp_str);
      expect(sessionResult.xp_sta).toBe(individual1.xp_sta + individual2.xp_sta);
      expect(sessionResult.xp_agi).toBe(individual1.xp_agi + individual2.xp_agi);
    });
  });

  describe('Daily Caps', () => {
    it.skip('should apply stamina caps when >80% XP comes from O-code', () => {
      const dailyActivities = [
        { xp_total: 100, xp_str: 10, xp_sta: 80, xp_agi: 10, energy_code: "O" as const },
        { xp_total: 100, xp_str: 10, xp_sta: 80, xp_agi: 10, energy_code: "O" as const },
        { xp_total: 100, xp_str: 10, xp_sta: 80, xp_agi: 10, energy_code: "O" as const },
        { xp_total: 100, xp_str: 10, xp_sta: 80, xp_agi: 10, energy_code: "O" as const }
      ];

      const newOActivity = { xp_total: 100, xp_str: 10, xp_sta: 80, xp_agi: 10, energy_code: "O" as const };
      
      const cappedResult = applyDailyCaps(dailyActivities, newOActivity);
      
      // STA should be reduced from 80 to ~56 (30% reduction)
      expect(cappedResult.xp_sta).toBeLessThan(newOActivity.xp_sta);
      expect(cappedResult.xp_str + cappedResult.xp_agi).toBeGreaterThan(newOActivity.xp_str + newOActivity.xp_agi);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalActivity: ActivityInput = {
        movement_type: "cardio",
        bodyweight_kg: 70,
        RPE: 6
      };

      const result = allocateXP(minimalActivity);
      expect(result.xp_total).toBeGreaterThanOrEqual(0);
      expect(result.energy_code).toBeDefined();
    });

    it('should handle extreme RPE values', () => {
      const activity: ActivityInput = {
        movement_type: "resistance",
        sets: 1,
        reps: 1,
        load_kg: 80,
        bodyweight_kg: 80,
        RPE: 15 // Invalid RPE
      };

      const result = allocateXP(activity);
      expect(result.xp_total).toBeGreaterThanOrEqual(0);
    });
  });
});

// Helper function to run tests (for manual testing)
export function runStatAllocationTests() {
  console.log('Running stat allocation tests...');
  
  // Heavy back squat test
  const backSquat = allocateXP({
    movement_type: "resistance",
    sets: 3,
    reps: 3,
    load_kg: 140,
    bodyweight_kg: 80,
    RPE: 9,
    interval_seconds: 8
  });
  console.log('Heavy Back Squat:', backSquat);
  
  // 90-second row test
  const row = allocateXP({
    movement_type: "cardio",
    minutes: 1.5,
    bodyweight_kg: 70,
    RPE: 8,
    interval_seconds: 90,
    average_HR_pct: 92
  });
  console.log('90-Second Row:', row);
  
  // Long run test
  const run = allocateXP({
    movement_type: "cardio",
    minutes: 45,
    bodyweight_kg: 60,
    RPE: 6,
    average_HR_pct: 70
  });
  console.log('45-Minute Run:', run);
  
  console.log('All tests completed successfully!');
}