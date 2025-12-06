import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { calculateSimulation } from './utils/mathModel';
import { analyzeSimulation } from './services/geminiService';
import { SimulationParams, SimulationResult, AIAnalysis } from './types';
import KnobControl from './components/KnobControl';
import ReactorTank from './components/ReactorTank';

// Initial default parameters
const DEFAULT_PARAMS: SimulationParams = {
  granulometry: 65,      // % passing mesh 200 (suboptimal default to encourage playing)
  collectorDosage: 50,   // g/t
  ph: 9.0,               // Slightly too low
  h2o2Concentration: 2,  // Low oxidation
  leachingTime: 24,      // hours
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [result, setResult] = useState<SimulationResult>(calculateSimulation(DEFAULT_PARAMS));
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'recovery' | 'radar'>('recovery');

  // Debounce ref for AI calls to prevent spamming
  const analysisTimeoutRef = useRef<number | null>(null);

  // Update simulation immediately on param change
  useEffect(() => {
    const newResult = calculateSimulation(params);
    setResult(newResult);
  }, [params]);

  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await analyzeSimulation(params, result);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const radarData = [
    { subject: 'Granulometría', A: (params.granulometry / 100) * 100, fullMark: 100 },
    { subject: 'pH (Norm.)', A: (params.ph / 14) * 100, fullMark: 100 },
    { subject: 'Oxidante H2O2', A: (params.h2o2Concentration / 10) * 100, fullMark: 100 }, // Scaled
    { subject: 'Tiempo', A: (params.leachingTime / 72) * 100, fullMark: 100 }, // Scaled
    { subject: 'Colector', A: (params.collectorDosage / 200) * 100, fullMark: 100 }, // Scaled
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-gold-500 selection:text-black pb-20">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 py-8 border-b border-gray-900/50 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Simulador</span> Metalúrgico
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Optimización de recuperación de Oro/Plata en Arsenopirita
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-600 font-mono">ESTADO DEL SISTEMA</div>
            <div className="flex items-center gap-2 justify-end">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-green-500 font-bold text-sm">EN LÍNEA</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900/40 p-6 rounded-xl border border-gray-800 backdrop-blur-sm">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-200 border-b border-gray-800 pb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              PARÁMETROS DE PROCESO
            </h2>
            
            <div className="space-y-5">
              <KnobControl 
                label="Oxidante (H₂O₂)" 
                value={params.h2o2Concentration} 
                min={0} max={10} step={0.1} unit="%" 
                onChange={(v) => updateParam('h2o2Concentration', v)}
                color="bg-cyan-500"
              />
               <KnobControl 
                label="Tiempo Lixiviación" 
                value={params.leachingTime} 
                min={12} max={96} step={1} unit="hrs" 
                onChange={(v) => updateParam('leachingTime', v)}
                color="bg-purple-500"
              />
              <KnobControl 
                label="Granulometría (-m200)" 
                value={params.granulometry} 
                min={40} max={98} step={1} unit="%" 
                onChange={(v) => updateParam('granulometry', v)}
                color="bg-gray-500"
              />
              <KnobControl 
                label="Dosis Colector" 
                value={params.collectorDosage} 
                min={10} max={200} unit="g/t" 
                onChange={(v) => updateParam('collectorDosage', v)}
                color="bg-blue-500"
              />
              <KnobControl 
                label="pH (Alcalinidad)" 
                value={params.ph} 
                min={7} max={13} step={0.1} unit="pH" 
                onChange={(v) => updateParam('ph', v)}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* AI INSIGHTS CARD */}
          <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                <span>⚡</span> Análisis Inteligente
              </h2>
              <button 
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 text-white px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                {isAnalyzing ? 'Procesando...' : 'Evaluar'}
              </button>
            </div>
            
            {aiAnalysis ? (
               <div className={`p-4 rounded border-l-2 ${
                 aiAnalysis.mood === 'success' ? 'bg-green-900/10 border-green-500 text-green-400' :
                 aiAnalysis.mood === 'warning' ? 'bg-yellow-900/10 border-yellow-500 text-yellow-400' :
                 'bg-gray-800/50 border-gray-600 text-gray-400'
               } animate-fade-in`}>
                 <p className="text-sm font-mono leading-relaxed">{aiAnalysis.text}</p>
               </div>
            ) : (
              <p className="text-gray-600 text-xs font-mono">
                System: Waiting for user request...
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHARTS & STATS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 relative overflow-hidden group hover:border-yellow-600/50 transition-colors">
              <div className="relative z-10">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Recuperación Au</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white font-mono">{result.auRecovery.toFixed(1)}</span>
                  <span className="text-yellow-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 relative overflow-hidden group hover:border-gray-500/50 transition-colors">
              <div className="relative z-10">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Recuperación Ag</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white font-mono">{result.agRecovery.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
              <div className="relative z-10">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Efic. Oxidación</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white font-mono">{result.arsenopyriteOxidation.toFixed(1)}</span>
                  <span className="text-cyan-500 text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-800 min-h-[400px]">
            <div className="flex gap-6 mb-6 border-b border-gray-800 pb-2">
              <button 
                onClick={() => setActiveTab('recovery')}
                className={`text-sm font-bold pb-2 transition-all uppercase tracking-wider ${activeTab === 'recovery' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-600 hover:text-gray-300'}`}
              >
                Cinética
              </button>
              <button 
                onClick={() => setActiveTab('radar')}
                className={`text-sm font-bold pb-2 transition-all uppercase tracking-wider ${activeTab === 'radar' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-600 hover:text-gray-300'}`}
              >
                Balance
              </button>
            </div>

            <div className="h-[350px] w-full">
              {activeTab === 'recovery' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.dataPoints}>
                    <defs>
                      <linearGradient id="colorAu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#4b5563"
                      tick={{fill: '#6b7280', fontSize: 12}}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      domain={[0, 100]}
                      tick={{fill: '#6b7280', fontSize: 12}}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                      itemStyle={{ color: '#d1d5db' }}
                    />
                    <Legend iconType="circle" />
                    <Area 
                      type="monotone" 
                      dataKey="recoveryAu" 
                      name="Oro (Au)" 
                      stroke="#EAB308" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAu)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recoveryAg" 
                      name="Plata (Ag)" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAg)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4b5563" />
                    <Radar
                      name="Configuración Actual"
                      dataKey="A"
                      stroke="#EAB308"
                      strokeWidth={2}
                      fill="#EAB308"
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
        </div>
      </main>

       {/* REACTOR VISUALIZATION SECTION (Moved to Bottom) */}
      <section className="w-full bg-[#020202] border-t border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-8 w-1 bg-gradient-to-b from-yellow-500 to-transparent rounded-full"></div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Gemelo Digital del Proceso</h2>
              <p className="text-gray-500 text-sm">Visualización 3D en tiempo real de la cinética de lixiviación</p>
            </div>
          </div>
          
          <div className="rounded-2xl overflow-hidden border border-gray-800/50 shadow-2xl shadow-black">
            <ReactorTank params={params} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;