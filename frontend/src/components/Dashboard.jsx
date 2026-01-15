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

export default function Dashboard({ data, previousData, loading, error, simulationParams }) {
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-red-200 max-w-md text-center backdrop-blur-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-bold text-xl mb-2">Eroare Simulare</h3>
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
            Așteptare Date
          </h2>
          <p className="text-slate-400 font-light">
            Ajustează parametrii și pornește simularea
          </p>
        </div>
      </div>
    )
  }

  // Calculate Economics (Simplified Model)
  // Profit = (Flow * Conversion * Price_Product) - (Flow * Price_Reactant) - Energy Cost
  // Mock Prices: Product = 150 $/mol, Reactant = 50 $/mol, Energy ~ 5 $/hr
  const flowRate = simulationParams.Flow_Velocity * 0.00196 // m3/s (approx for D=0.05m)
  const molFlow = flowRate * 1000 // mol/s (if C=1000 mol/m3)
  const conversionFrac = data.final_conversion / 100

  const priceProduct = 2.5 // $/mol
  const priceReactant = 0.8 // $/mol

  // Profit per hour
  const hourlyProfit = ((molFlow * conversionFrac * priceProduct) - (molFlow * priceReactant)) * 3600
  const isProfitable = hourlyProfit > 0

  // Prepare chart data with comparison
  const chartData = data.z_axis.map((z, index) => {
    const point = {
      z: z.toFixed(2),
      temperatura: Math.round(data.temperature_profile[index]),
      concentratie: Math.round(data.concentration_profile[index] * 1000) / 1000,
    }

    if (previousData && previousData.z_axis[index] !== undefined) {
      point.temperatura_prev = Math.round(previousData.temperature_profile[index])
      point.concentratie_prev = Math.round(previousData.concentration_profile[index] * 1000) / 1000
    }

    return point
  })

  const exportCSV = () => {
    if (!data) return

    // Header
    let csv = 'z [m],Temperatură [K],Concentrație [mol/m3]\n'

    // Rows
    data.z_axis.forEach((z, i) => {
      csv += `${z.toFixed(4)},${data.temperature_profile[i].toFixed(4)},${data.concentration_profile[i].toFixed(4)}\n`
    })

    // Download trigger
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulare_pfr_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth custom-scrollbar">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 rounded-lg">
          {/* Loader overlaid is handled by button state, but this adds extra visual cue */}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
            Rezultate Simulare
          </h1>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
              SUCCES
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
              {data.z_axis.length} PAȘI
            </span>
            {previousData && (
              <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-xs border border-slate-500/30 flex items-center gap-1">
                <span>🔄</span> COMPARAȚIE ACTIVĂ
              </span>
            )}
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="glass px-4 py-2 hover:bg-white/10 text-xs font-bold text-emerald-400 flex items-center gap-2 transition-all active:scale-95"
        >
          <span>📥</span> EXPORTĂ CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-blue-500/20 w-24 h-24 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Conversie Finală</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white text-shadow-glow">
              {data.final_conversion.toFixed(1)}
            </span>
            <span className="text-blue-400 text-xl">%</span>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-red-500/20 w-24 h-24 rounded-full blur-xl group-hover:bg-red-500/30 transition-all"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Temp. Maximă</p>
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
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Eficiență Reactor</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {(data.final_conversion / (5.0 / 2.0) * 0.1 + 0.8).toFixed(2)}
            </span>
            <span className="text-green-400 text-sm">idx</span>
          </div>
        </div>

        {/* Economic KPI */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl transition-all ${isProfitable ? 'bg-amber-500/20 group-hover:bg-amber-500/30' : 'bg-red-500/20'}`}></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Profit Estimat (h)</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${isProfitable ? 'text-amber-400' : 'text-red-400'}`}>
              {hourlyProfit.toFixed(0)}
            </span>
            <span className="text-slate-400 text-sm">$</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Flux: {molFlow.toFixed(2)} mol/s
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Temperature Chart */}
        <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-red-400">🌡️</span> Profil Temperatură
            {previousData && <span className="text-xs text-slate-500 ml-auto font-normal">-- Anterior (Gri)</span>}
          </h3>
          <div className="h-64">
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
                  label={{ value: 'Lungime Reactor (m)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                {previousData && (
                  <Area
                    type="monotone"
                    dataKey="temperatura_prev"
                    name="Temp. Ant."
                    stroke="#64748b"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="temperatura"
                  name="Temperatură"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Concentration Chart */}
        <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400">💧</span> Profil Concentrație
            {previousData && <span className="text-xs text-slate-500 ml-auto font-normal">-- Anterior (Gri)</span>}
          </h3>
          <div className="h-64">
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
                  label={{ value: 'Lungime Reactor (m)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                {previousData && (
                  <Area
                    type="monotone"
                    dataKey="concentratie_prev"
                    name="Conc. Ant."
                    stroke="#64748b"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="concentratie"
                  name="Concentrație"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

