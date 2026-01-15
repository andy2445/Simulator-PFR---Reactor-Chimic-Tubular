from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from pydantic import BaseModel
import numpy as np
from typing import List
import os

app = FastAPI(title="PFR Reactor Simulator")

# Configurare CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Model de input
class SimulationInput(BaseModel):
    T_in: float  # Temperatura de intrare [K]
    Flow_Velocity: float  # Viteza fluidului [m/s]
    T_jacket: float  # Temperatura lichidului de răcire [K]


# Model de output
class SimulationOutput(BaseModel):
    z_axis: List[float]
    temperature_profile: List[float]
    concentration_profile: List[float]
    final_conversion: float
    max_temperature: float


# Parametrii constanți ai reactorului
class ReactorParams:
    # Dimensiuni
    L_reactor = 5.0  # Lungimea reactorului [m]
    D_tube = 0.05  # Diametrul tubului [m]
    
    # Parametrii cinetici - reactie de ordinul 1, vizibila
    k0 = 50000.0  # Factor pre-exponențial [1/s]
    E_a = 30000  # Energie de activare [J/mol]
    R_gas = 8.314  # Constanta gazelor ideale [J/(mol·K)]
    Delta_H = -250000  # Căldura de reacție (negativă pentru exoterm) [J/mol]
    
    # Parametrii fizici
    rho = 1000  # Densitate fluid [kg/m³]
    c_p = 4200  # Capacitate calorică specifică [J/(kg·K)]
    U = 500  # Coeficient transfer termic [W/(m²·K)]
    A_surface = 0.785  # Aria suprafeței (π*D*1m) [m²/m]
    C_molar = 1000  # Concentrație în mol/m³ = 1 kmol/m³ pentru schimbarea de scară
    
    # Condiții inițiale
    C_A_inlet = 1.0  # Concentrație inițială (relativă, 0-1)
    
    # Discretizare
    dz = 0.01  # Pas de discretizare [m]


def k_rate(T: float) -> float:
    """
    Calculează constanta de viteză reacție folosind legea lui Arrhenius.
    k(T) = k0 * exp(-E_a / (R * T))
    """
    params = ReactorParams()
    exponent = -params.E_a / (params.R_gas * T)
    # Limitare pentru a evita underflow
    exponent = max(exponent, -700)
    return params.k0 * np.exp(exponent)


def solve_pfr_model(T_in: float, u: float, T_jacket: float) -> tuple:
    """
    Rezolvă sistemul ODE cuplate pentru reactorul PFR folosind metoda Euler explicit.
    
    Ecuații diferențiale:
    dC_A/dz = -k(T)/u * C_A
    dT/dz = [ΔH*k(T)*C_A - 4*U/D_tube*(T - T_jacket)] / (ρ*c_p*u)
    
    Returns:
        (z_axis, T_profile, C_A_profile)
    """
    params = ReactorParams()
    
    # Inițializare vectori soluție
    num_steps = int(params.L_reactor / params.dz) + 1
    z_axis = np.linspace(0, params.L_reactor, num_steps)
    
    T_profile = np.zeros(num_steps)
    C_A_profile = np.zeros(num_steps)
    
    # Condiții inițiale la intrare (z=0)
    T_profile[0] = T_in
    C_A_profile[0] = params.C_A_inlet
    
    # Metoda Euler explicit
    for i in range(num_steps - 1):
        z = z_axis[i]
        T = T_profile[i]
        C_A = C_A_profile[i]
        
        # Calculează constanta de viteză
        k = k_rate(T)
        
        # Derivate (bilanțuri de masă și energie)
        dC_A_dz = -k / u * C_A
        
        # Bilanț de energie: dT/dz = (Căldura generată - Căldura schimbată) / (ρ*c_p*u)
        # Pentru o reacție exotermă (ΔH < 0), reacția degajă căldură și crește temperatura
        # Căldura degajată: -ΔH * k * C_A * C_molar  (negativ pentru pozitiv în ecuație)
        # Căldura luată de jacheta: U * A_surface * (T - T_jacket)
        heat_generated = -params.Delta_H * k * C_A * params.C_molar  # Signum invers
        heat_exchanged = params.U * params.A_surface * (T - T_jacket)
        dT_dz = (heat_generated - heat_exchanged) / (params.rho * params.c_p * u)
        
        # Update cu metoda Euler
        C_A_profile[i + 1] = C_A + dC_A_dz * params.dz
        T_profile[i + 1] = T + dT_dz * params.dz
        
        # Verificare pentru valori negative (fizic imposibile)
        C_A_profile[i + 1] = max(C_A_profile[i + 1], 0.0)
    
    return z_axis, T_profile, C_A_profile


@app.post("/simulate", response_model=SimulationOutput)
async def simulate(input_data: SimulationInput) -> SimulationOutput:
    """
    Endpoint pentru simularea reactorului PFR.
    """
    # Validare input
    if input_data.Flow_Velocity <= 0:
        raise HTTPException(status_code=400, detail="Viteza fluidului trebuie să fie pozitivă")
    if input_data.T_in <= 0:
        raise HTTPException(status_code=400, detail="Temperatura de intrare trebuie să fie pozitivă")
    
    # Rezolvă sistemul ODE
    z_axis, T_profile, C_A_profile = solve_pfr_model(
        T_in=input_data.T_in,
        u=input_data.Flow_Velocity,
        T_jacket=input_data.T_jacket
    )
    
    # Calculează KPIs
    params = ReactorParams()
    final_conversion = ((params.C_A_inlet - C_A_profile[-1]) / params.C_A_inlet) * 100
    max_temperature = float(np.max(T_profile))
    
    # Returnează rezultate
    return SimulationOutput(
        z_axis=z_axis.tolist(),
        temperature_profile=T_profile.tolist(),
        concentration_profile=C_A_profile.tolist(),
        final_conversion=final_conversion,
        max_temperature=max_temperature
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0"}


# Mount static files (React frontend)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
