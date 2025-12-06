export interface SimulationParams {
  granulometry: number; // Percentage passing mesh 200 (fineness)
  collectorDosage: number; // g/t
  ph: number; // 0-14
  h2o2Concentration: number; // % (oxidant)
  leachingTime: number; // hours
}

export interface SimulationResult {
  auRecovery: number; // % Gold
  agRecovery: number; // % Silver
  arsenopyriteOxidation: number; // % Efficiency of pretreatment
  reagentConsumption: number; // cost/efficiency metric
  dataPoints: Array<{ time: number; recoveryAu: number; recoveryAg: number }>;
}

export interface AIAnalysis {
  text: string;
  mood: 'success' | 'warning' | 'neutral';
}
