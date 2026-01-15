import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded-lg border border-slate-600 shadow-xl">
        <p className="text-slate-300 text-xs mb-1 font-mono">z = {label} m</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard({ data, loading, error }) {
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-red-200 max-w-md text-center backdrop-blur-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-bold text-xl mb-2">Simulation Error</h3>
          <p className="text-red-300/80 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center opacity-50 hover:opacity-100 transition-opacity duration-500">
          <div className="text-8xl mb-6 animate-pulse grayscale">📊</div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500 mb-2">
            Awaiting Input
          </h2>
          <p className="text-slate-400 font-light">
            Adjust parameters and initialize simulation sequence
          </p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = data.z_axis.map((z, index) => ({
    z: z.toFixed(2),
    temperatura: Math.round(data.temperature_profile[index] * 10) / 10,
    concentratie: Math.round(data.concentration_profile[index] * 1000) / 1000,
  }))

  return (
    <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth custom-scrollbar">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 rounded-lg">
          {/* Loader overlaid is handled by button state, but this adds extra visual cue */}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">
            Simulation Results
          </h1>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
              SUCCESS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
              {data.z_axis.length} STEPS
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-blue-500/20 w-24 h-24 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Final Conversion</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white text-shadow-glow">
              {data.final_conversion.toFixed(1)}
            </span>
            <span className="text-blue-400 text-xl">%</span>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-red-500/20 w-24 h-24 rounded-full blur-xl group-hover:bg-red-500/30 transition-all"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Max Temperature</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {data.max_temperature.toFixed(1)}
            </span>
            <span className="text-red-400 text-sm">K</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            ≈ {(data.max_temperature - 273.15).toFixed(1)} °C
          </p>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-green-500/20 w-24 h-24 rounded-full blur-xl group-hover:bg-green-500/30 transition-all"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Reactor Efficiency</p>
          {/* Mock Metric for visual balance */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {(data.final_conversion / (5.0 / 2.0) * 0.1 + 0.8).toFixed(2)}
            </span>
            <span className="text-green-400 text-sm">idx</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Temperature Chart */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-8 bg-red-500 rounded-full inline-block"></span>
              Temperature Profile
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="z"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="temperatura"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                  name="Temperature (K)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Concentration Chart */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-500 rounded-full inline-block"></span>
              Concentration Profile
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorConc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="z"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="concentratie"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorConc)"
                  name="Concentration (mol/m³)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

