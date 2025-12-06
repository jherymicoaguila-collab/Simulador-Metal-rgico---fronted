import { SimulationParams, SimulationResult } from '../types';

/**
 * Simulates the metallurgical process based on the hypothesis:
 * "Combined flotation, oxidative pretreatment (H2O2) and leaching... increases recovery in arsenopyrite ores."
 */
export const calculateSimulation = (params: SimulationParams): SimulationResult => {
  const { granulometry, collectorDosage, ph, h2o2Concentration, leachingTime } = params;

  // 1. Granulometry Effect (Optimal around 75-85% passing mesh 200)
  // Too coarse (<60) = low liberation. Too fine (>95) = slime issues/high reagent consumption.
  const granulometryFactor = Math.max(0, 1 - Math.pow((granulometry - 80) / 40, 2));

  // 2. Collector Dosage Effect (Saturation curve)
  // Needs enough to float, but plateau effects.
  const collectorFactor = Math.min(1, Math.log10(collectorDosage + 10) / 2.5);

  // 3. pH Effect (Crucial for Cyanidation/Leaching)
  // Gold leaching typically requires pH 10.5 - 11.
  // Penalty for low pH (HCN gas risk/low efficiency) or too high pH (retardation).
  const phOptimal = 11;
  const phFactor = Math.max(0, 1 - Math.abs(ph - phOptimal) / 3);

  // 4. H2O2 Pretreatment Effect (The Core Hypothesis for Arsenopyrite)
  // Higher H2O2 breaks down the sulfide matrix (arsenopyrite), liberating gold.
  // This is the multiplier that unlocks high recovery.
  const oxidationEfficiency = Math.min(100, (h2o2Concentration * 15) * (granulometryFactor * 0.8 + 0.2)); 
  const refractoryUnlockFactor = 0.4 + (oxidationEfficiency / 100) * 0.6; // Base 40% accessible, up to 100% with oxidation

  // 5. Time Effect (Kinetic curve)
  // Recovery increases with time but plateaus.
  const kineticConstant = 0.15; // Speed of reaction
  
  // FINAL CALCULATION
  // Max possible recovery based on liberation (granulometry) and chemical conditions (pH, Collector)
  const maxPotentialAu = 95 * granulometryFactor * phFactor * refractoryUnlockFactor;
  const maxPotentialAg = 88 * granulometryFactor * phFactor * refractoryUnlockFactor; // Silver usually slightly lower in these ores

  // Kinetic calculation: Recovery(t) = Max * (1 - e^(-k * t))
  const auRecovery = maxPotentialAu * (1 - Math.exp(-kineticConstant * leachingTime));
  const agRecovery = maxPotentialAg * (1 - Math.exp(-kineticConstant * leachingTime * 0.9)); // Ag slower kinetics

  // Generate data points for the chart
  const dataPoints = [];
  for (let t = 0; t <= leachingTime + 2; t += (leachingTime/10)) {
     const tAu = maxPotentialAu * (1 - Math.exp(-kineticConstant * t));
     const tAg = maxPotentialAg * (1 - Math.exp(-kineticConstant * t * 0.9));
     dataPoints.push({
       time: Number(t.toFixed(1)),
       recoveryAu: Number(tAu.toFixed(1)),
       recoveryAg: Number(tAg.toFixed(1))
     });
  }

  return {
    auRecovery: Math.min(99.9, Math.max(0, auRecovery)),
    agRecovery: Math.min(99.9, Math.max(0, agRecovery)),
    arsenopyriteOxidation: oxidationEfficiency,
    reagentConsumption: (collectorDosage * 0.5) + (h2o2Concentration * 2), // Arbitrary units
    dataPoints
  };
};