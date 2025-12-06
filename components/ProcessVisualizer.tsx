import React from 'react';
import { SimulationParams } from '../types';

interface Props {
  params: SimulationParams;
  oxidationLevel: number;
}

const ProcessVisualizer: React.FC<Props> = ({ params, oxidationLevel }) => {
  // Determine visual states based on params
  const isPhGood = params.ph >= 10 && params.ph <= 12;
  const isOxidationGood = oxidationLevel > 60;
  
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mt-6 relative overflow-hidden">
      <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
        <span className="text-2xl">⚗️</span> Diagrama de Flujo
      </h3>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Step 1: Flotation */}
        <div className="flex flex-col items-center text-center group">
          <div className="w-24 h-24 rounded-full bg-slate-700 border-4 border-blue-500 flex items-center justify-center relative shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <div className="text-3xl animate-bounce">🫧</div>
            <div className="absolute -bottom-2 bg-blue-600 text-xs px-2 py-1 rounded-full text-white font-bold">
              {params.collectorDosage} g/t
            </div>
          </div>
          <p className="mt-3 font-bold text-blue-200">1. Flotación</p>
          <p className="text-xs text-slate-400 max-w-[120px]">Concentración de sulfuros</p>
        </div>

        {/* Arrow */}
        <div className="h-1 w-12 md:w-20 bg-slate-600 relative">
          <div className="absolute -right-1 -top-1.5 w-3 h-3 border-t-4 border-r-4 border-slate-600 rotate-45"></div>
        </div>

        {/* Step 2: Oxidation */}
        <div className="flex flex-col items-center text-center">
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center relative transition-all duration-500 ${isOxidationGood ? 'bg-orange-900/40 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' : 'bg-slate-700 border-gray-500'}`}>
            <div className="text-3xl animate-pulse">🔥</div>
            <div className="absolute -bottom-2 bg-orange-600 text-xs px-2 py-1 rounded-full text-white font-bold">
              {params.h2o2Concentration}% H₂O₂
            </div>
          </div>
          <p className="mt-3 font-bold text-orange-200">2. Oxidación</p>
          <p className="text-xs text-slate-400 max-w-[120px]">Liberación de oro refractario (Arsenopirita)</p>
        </div>

        {/* Arrow */}
        <div className="h-1 w-12 md:w-20 bg-slate-600 relative">
          <div className="absolute -right-1 -top-1.5 w-3 h-3 border-t-4 border-r-4 border-slate-600 rotate-45"></div>
        </div>

        {/* Step 3: Leaching */}
        <div className="flex flex-col items-center text-center">
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center relative transition-all duration-500 ${isPhGood ? 'bg-yellow-900/40 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'bg-red-900/20 border-red-500'}`}>
            <div className="text-3xl">💧</div>
            <div className={`absolute -bottom-2 text-xs px-2 py-1 rounded-full text-white font-bold ${isPhGood ? 'bg-green-600' : 'bg-red-600'}`}>
              pH {params.ph}
            </div>
          </div>
          <p className="mt-3 font-bold text-yellow-200">3. Lixiviación</p>
          <p className="text-xs text-slate-400 max-w-[120px]">Disolución de Oro y Plata</p>
        </div>

      </div>

      {/* Background Particles (Cosmetic) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
         <div className="absolute bottom-10 right-20 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
         <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-white rounded-full"></div>
      </div>
    </div>
  );
};

export default ProcessVisualizer;