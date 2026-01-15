import React from 'react'

export default function Sidebar({ params, onParamChange, onSimulate, loading }) {
  const SliderControl = ({ label, value, min, max, step, paramName, unit, helpText }) => (
    <div className="glass-panel p-4 mb-4 transition-transform hover:scale-[1.02]">
      <div className="flex justify-between items-center mb-2">
        <label className="text-blue-200 text-sm font-semibold tracking-wide">
          {label}
        </label>
        <span className="text-cyan-400 text-xs font-mono">{unit}</span>
      </div>

      <div className="flex gap-3 items-center mb-2">
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onParamChange(paramName, parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="w-20">
          <input
            type="number"
            value={value}
            onChange={(e) => onParamChange(paramName, parseFloat(e.target.value))}
            className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-1 text-right text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-slate-400 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {helpText && (
        <p className="text-slate-500 text-xs mt-2 italic border-t border-slate-700/50 pt-2">
          {helpText}
        </p>
      )}
    </div>
  )

  const applyPreset = (preset) => {
    onParamChange('T_in', preset.T_in)
    onParamChange('Flow_Velocity', preset.Flow_Velocity)
    onParamChange('T_jacket', preset.T_jacket)
  }

  const PRESETS = [
    { name: 'Standard', T_in: 300, Flow_Velocity: 2.0, T_jacket: 280, icon: '🏭' },
    { name: 'Max Conv', T_in: 340, Flow_Velocity: 1.0, T_jacket: 290, icon: '🔥' },
    { name: 'Safe Mode', T_in: 280, Flow_Velocity: 3.5, T_jacket: 260, icon: '🛡️' },
  ]

  return (
    <div className="w-full md:w-80 h-auto md:h-full glass border-r-0 md:border-r border-b md:border-b-0 z-10 flex flex-col p-6 shadow-2xl backdrop-blur-xl shrink-0 overflow-y-auto global-scrollbar">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-center relative">
        <div className="absolute inset-0 blur-xl bg-blue-500/20 -z-10 rounded-full"></div>
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          PFR SIM
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest hidden md:block">
          Reactor Tubular Control
        </p>
      </div>

      {/* Presets */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/50 hover:bg-blue-500/20 border border-slate-700 hover:border-blue-500/50 transition-all group"
          >
            <span className="text-lg mb-1 group-hover:scale-110 transition-transform">{preset.icon}</span>
            <span className="text-[10px] text-slate-300 font-mono">{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Controls Container */}
      <div className="space-y-1 mb-6">
        <SliderControl
          label="TEMPERATURA INTRARE"
          value={params.T_in}
          min={273}
          max={350}
          step={1}
          paramName="T_in"
          unit="K"
          helpText="0°C - 77°C"
        />

        <SliderControl
          label="VITEZA FLUID"
          value={params.Flow_Velocity}
          min={0.5}
          max={5}
          step={0.1}
          paramName="Flow_Velocity"
          unit="m/s"
          helpText={`Timp de rezidenţă: ${(5.0 / params.Flow_Velocity).toFixed(1)} s`}
        />

        <SliderControl
          label="TEMP. MANTA RĂCIRE"
          value={params.T_jacket}
          min={250}
          max={300}
          step={1}
          paramName="T_jacket"
          unit="K"
          helpText="-23°C - 27°C"
        />
      </div>

      {/* Action Button */}
      <div className="mt-auto pt-6 border-t border-slate-700/50">
        <button
          onClick={onSimulate}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg ${loading
            ? 'bg-slate-700 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-cyan-500/50 hover:from-blue-500 hover:to-cyan-400'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-xl">⚡</span>
              <span>CALCULATING...</span>
            </span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>START SIMULATION</span>
            </div>
          )}
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center">
        <span className="text-[10px] text-slate-600 font-mono">
          v2.0 • PFR SYSTEM READY
        </span>
      </div>
    </div>
  )
}


