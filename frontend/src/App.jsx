import React, { useState, useCallback } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import './index.css'

function App() {
  const [simulationParams, setSimulationParams] = useState({
    T_in: 300,        // K
    Flow_Velocity: 2.0, // m/s
    T_jacket: 280      // K
  })

  const [simulationData, setSimulationData] = useState(null)
  const [previousData, setPreviousData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Save current data as previous before new run
    if (simulationData) {
      setPreviousData(simulationData)
    }

    try {
      const response = await axios.post('/simulate', simulationParams)
      setSimulationData(response.data)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message
      setError(`Eroare: ${errorMessage}`)
      console.error('Simulation error:', err)
    } finally {
      setLoading(false)
    }
  }, [simulationParams, simulationData])

  const handleParamChange = (param, value) => {
    setSimulationParams(prev => ({
      ...prev,
      [param]: value
    }))
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen text-slate-100 md:overflow-hidden relative">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <Sidebar
        params={simulationParams}
        onParamChange={handleParamChange}
        onSimulate={runSimulation}
        loading={loading}
      />
      <Dashboard
        data={simulationData}
        previousData={previousData}
        loading={loading}
        error={error}
        simulationParams={simulationParams}
      />
    </div>
  )
}

export default App
