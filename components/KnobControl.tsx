import React from 'react';

interface KnobControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (val: number) => void;
  color?: string;
}

const KnobControl: React.FC<KnobControlProps> = ({ 
  label, value, min, max, step = 1, unit, onChange, color = "bg-cyan-500" 
}) => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-slate-500 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <label className="text-gray-300 font-medium text-sm uppercase tracking-wider">{label}</label>
        <span className={`text-white font-bold font-mono ${color.replace('bg-', 'text-')}`}>
          {value} <span className="text-xs text-gray-500">{unit}</span>
        </span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      />
      
      <div className="flex justify-between mt-1 text-xs text-gray-500 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      {/* Visual Indicator Bar */}
      <div 
        className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${color}`} 
        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
      />
    </div>
  );
};

export default KnobControl;