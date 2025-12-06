import { GoogleGenAI } from "@google/genai";
import { SimulationParams, SimulationResult, AIAnalysis } from '../types';

const apiKey = process.env.API_KEY || '';

// Initialize Gemini
// Note: We create the instance inside the function to ensure fresh key usage if handled dynamically, 
// though here strictly following the "no user input for key" rule means it comes from env.
const ai = new GoogleGenAI({ apiKey });

export const analyzeSimulation = async (
  params: SimulationParams, 
  result: SimulationResult
): Promise<AIAnalysis> => {
  
  if (!apiKey) {
    return {
      text: "API Key no configurada. Por favor configura la variable de entorno para ver los insights de IA.",
      mood: 'neutral'
    };
  }

  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Actúa como un profesor experto en metalurgia extractiva y procesamiento de minerales.
    Analiza los siguientes resultados de una simulación de laboratorio basada en la hipótesis:
    "La aplicación combinada de flotación, pretratamiento oxidante con H2O2 y lixiviación mejora la recuperación en minerales con arsenopirita."

    **Datos de Entrada:**
    - Granulometría (% pasante m200): ${params.granulometry}%
    - Dosis de Colector: ${params.collectorDosage} g/t
    - pH: ${params.ph}
    - Concentración H2O2: ${params.h2o2Concentration}%
    - Tiempo de Lixiviación: ${params.leachingTime} horas

    **Resultados Obtenidos:**
    - Recuperación Oro (Au): ${result.auRecovery.toFixed(2)}%
    - Recuperación Plata (Ag): ${result.agRecovery.toFixed(2)}%
    - Oxidación Arsenopirita: ${result.arsenopyriteOxidation.toFixed(2)}%

    **Instrucciones:**
    1. Explica brevemente por qué se obtuvo este resultado (bueno o malo).
    2. Enfócate en la interacción entre el H2O2 (oxidante) y la arsenopirita. ¿Fue suficiente el pretratamiento?
    3. Comenta sobre el pH. ¿Es adecuado para la cianuración posterior?
    4. Usa un tono educativo, alentador y científico.
    5. Mantén la respuesta en menos de 100 palabras.
    6. Formato JSON: { "analysis": "texto...", "mood": "success" | "warning" | "neutral" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    
    return {
      text: parsed.analysis || "No se pudo generar un análisis detallado.",
      mood: parsed.mood || 'neutral'
    };

  } catch (error) {
    console.error("Error calling Gemini:", error);
    return {
      text: "Hubo un error conectando con el asistente inteligente. Intenta ajustar los parámetros nuevamente.",
      mood: 'neutral'
    };
  }
};