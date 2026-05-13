/**
 * CoreSim — Physics Equations Module
 * 
 * Models a simplified Pressurized Water Reactor (PWR).
 * Each function approximates one aspect of the neutronics,
 * thermal-hydraulics, or environmental behavior of the core.
 * 
 * NOTE: These are educational approximations, not production-grade
 * reactor physics codes. Tuning constants are chosen to produce
 * plausible-looking behavior at interactive time-scales.
 * 
 * DESIGN TARGETS (at 50% rod insertion, 3.5% enrichment, 5000 L/s coolant):
 *   k_eff  ≈ 1.000 (critical)
 *   Power  ≈ 1000 MW thermal
 *   T_fuel ≈ 346 °C
 *   T_cool ≈ 326 °C (outlet)
 *   P_prim ≈ 15.5 MPa
 */

// ─── Constants ───────────────────────────────────────────────────────
export const PHYSICS = {
    // ── Neutronics ──
    // The reactor has built-in excess reactivity from the fuel.
    // Control rods subtract reactivity to achieve criticality.
    // At ~50% insertion (with 3.5% enrichment), k_eff ≈ 1.0.
    EXCESS_K: 0.06,              // Excess reactivity built into fuel (k above 1.0)
    ENRICHMENT_COEFF: 0.02,      // k_eff bonus per percent enrichment above 3.0%
    TOTAL_ROD_WORTH: 0.14,       // Total Δk from 0% → 100% rod insertion
    LAMBDA_EFF: 0.08,            // Effective neutron generation time (s)
    //   (includes delayed neutron effects — much
    //    slower than prompt generation time ~1e-4 s)
    DOPPLER_COEFF: -3e-5,        // Δk/°C — Doppler temperature feedback
    //   Higher fuel temp → more neutron absorption
    //   → less reactivity. This is the PRIMARY
    //   self-regulating mechanism in a PWR.
    DOPPLER_REF_TEMP: 350.0,     // °C — reference temperature for Doppler

    // ── Thermal ──
    ENERGY_PER_FISSION: 3.2e-11, // Joules per fission event
    FISSION_SCALE: 1e5,          // Macroscopic fission cross-section proxy
    //   Tuned so flux=1e14 gives P ≈ 1 GW
    COOLANT_EFFICIENCY: 4e3,     // J/(K·s) per unit coolant flow
    //   Tuned so T_eq ≈ 346°C at 1 GW / 5000 L/s
    DEFAULT_INLET_TEMP: 290.0,   // °C — typical PWR cold-leg temperature
    CORE_HEAT_CAPACITY: 1e8,     // J/°C — lumped core thermal inertia
    //   Tuned for ~0.5°C/step at 10% power imbalance
    COOLANT_CP: 5.5e3,           // J/(kg·°C) — water Cp at ~300°C, 15 MPa

    // ── Hydraulic ──
    NOMINAL_PRESSURE: 15.5,      // MPa — typical PWR primary system pressure
    PRESSURE_TEMP_COEFF: 0.035,  // MPa/°C deviation from nominal coolant temp
    NOMINAL_COOLANT_TEMP: 315.0, // °C — reference coolant temp for pressure calc
    NOMINAL_WATER_LEVEL: 100,    // % — full pressurizer level
    WATER_LEVEL_PRESSURE_COEFF: -2.0, // %/MPa deviation from nominal

    // ── Environmental ──
    RADIATION_FLUX_COEFF: 1e-12, // Sv·cm²/n — dose rate per unit flux
    CONTAINMENT_BASE_PRESSURE: 0.101, // MPa — atmospheric
    CONTAINMENT_TEMP_COEFF: 0.0001,   // MPa/°C above nominal core temp

    // ── Safety Limits ──
    MELTDOWN_TEMP: 2800.0,       // °C — UO₂ fuel melting point
    WARNING_TEMP: 600.0,         // °C — operator warning threshold
    SCRAM_TEMP: 800.0,           // °C — automatic SCRAM trigger
};


// ─── Neutronics ──────────────────────────────────────────────────────

/**
 * Effective multiplication factor.
 * 
 * Model: k_eff = (1 + excess_k + enrichment_bonus)
 *              − rod_worth × (rod% / 100)
 *              + doppler_coeff × (T_fuel − T_ref)
 * 
 * The Doppler feedback is crucial: as fuel temperature rises,
 * U-238 resonance absorption increases ("Doppler broadening"),
 * which reduces k_eff and slows the reaction. This is the
 * primary self-regulating mechanism in any thermal reactor.
 * 
 * At 50% rods, 3.5% enrichment, 350°C (equilibrium):
 *   k = 1.06 + 0.01 − 0.07 + 0 = 1.00  →  reactor is critical
 * 
 * At 50% rods, 3.5% enrichment, 400°C (hotter than ref):
 *   k = 1.06 + 0.01 − 0.07 + (-3e-5)(50) = 1.00 − 0.0015 = 0.9985  → subcritical, cools down
 */
export function calcKEff(fuelType, enrichment, rodPercent, fuelTemp = PHYSICS.DOPPLER_REF_TEMP) {
    // Base k with excess reactivity
    const kBase = 1.0 + PHYSICS.EXCESS_K;

    // Small enrichment boost
    const enrichmentBonus = (enrichment - 3.0) * PHYSICS.ENRICHMENT_COEFF;

    // Rod worth (subtractive)
    const rodReactivityLoss = PHYSICS.TOTAL_ROD_WORTH * (rodPercent / 100.0);

    // Doppler temperature feedback (negative coefficient → self-regulating)
    const dopplerFeedback = PHYSICS.DOPPLER_COEFF * (fuelTemp - PHYSICS.DOPPLER_REF_TEMP);

    return kBase + enrichmentBonus - rodReactivityLoss + dopplerFeedback;
}

/**
 * Reactivity ρ = (k − 1) / k
 * 
 * ρ > 0 → supercritical (flux rising)
 * ρ = 0 → critical (steady state)
 * ρ < 0 → subcritical (flux falling)
 */
export function calcReactivity(kEff) {
    if (kEff <= 0) return -1;
    return (kEff - 1) / kEff;
}

/**
 * Evolve neutron flux using simplified point-kinetics.
 * 
 * dΦ/dt = (ρ / Λ_eff) × Φ
 * 
 * where Λ_eff is the effective neutron generation time.
 * Using Λ_eff ≈ 0.08 s (dominated by delayed neutrons in a thermal reactor)
 * makes the response slow enough to be controllable but fast enough to see.
 * 
 * At criticality (ρ = 0): dΦ = 0, flux holds steady.
 * At ρ = +0.01: flux grows by ~12.5% per second.
 */
export function evolveFlux(currentFlux, reactivity, dt) {
    const dFlux = currentFlux * (reactivity / PHYSICS.LAMBDA_EFF) * dt;
    return currentFlux + dFlux;
}

/**
 * Startup Rate (SUR) — decades per minute.
 * SUR = log10(φ₂/φ₁) / Δt × 60
 * Positive → flux increasing, Negative → decreasing.
 */
export function calcStartupRate(prevFlux, currentFlux, dt) {
    if (prevFlux <= 0 || currentFlux <= 0 || dt <= 0) return 0;
    return (Math.log10(currentFlux / prevFlux) / dt) * 60;
}


// ─── Thermal ─────────────────────────────────────────────────────────

/**
 * Thermal power output from fission.
 * P = Φ × E_fission × Σ_f (macroscopic fission cross-section proxy)
 * 
 * At flux=1e14, enrichment=3.5:
 *   P = 1e14 × 3.2e-11 × 3.5 × 1e5 = 1.12 GW
 */
export function calcPowerOutput(flux, enrichment) {
    return flux * PHYSICS.ENERGY_PER_FISSION * (enrichment * PHYSICS.FISSION_SCALE);
}

/**
 * Heat removed by coolant per second.
 * Q̇_cool = η × ṁ × (T_fuel − T_inlet)
 * 
 * At T_fuel=346°C, flow=5000:
 *   Q = 4e3 × 5000 × 56 = 1.12 GW  (matches power → equilibrium)
 */
export function calcCoolantRemoval(temp, coolantRate, inletTemp = PHYSICS.DEFAULT_INLET_TEMP) {
    return PHYSICS.COOLANT_EFFICIENCY * coolantRate * (temp - inletTemp);
}

/**
 * Core temperature change over one timestep.
 * ΔT = (P_thermal − Q̇_coolant) × dt / C_core
 */
export function calcTempChange(power, coolantLoss, dt, heatCapacity = PHYSICS.CORE_HEAT_CAPACITY) {
    return ((power - coolantLoss) * dt) / heatCapacity;
}

/**
 * Coolant outlet temperature.
 * T_out = T_in + P / (ṁ × Cp)
 * Clamped to physical range.
 */
export function calcCoolantOutletTemp(inletTemp, power, flowRate) {
    if (flowRate <= 0) return inletTemp;
    const deltaT = power / (flowRate * PHYSICS.COOLANT_CP);
    return inletTemp + Math.min(deltaT, 800);
}


// ─── Hydraulic ───────────────────────────────────────────────────────

/**
 * Primary system pressure.
 * Approximated as nominal + deviation proportional to coolant temp.
 */
export function calcPressure(coolantTemp) {
    const deviation = coolantTemp - PHYSICS.NOMINAL_COOLANT_TEMP;
    return Math.max(0, PHYSICS.NOMINAL_PRESSURE + deviation * PHYSICS.PRESSURE_TEMP_COEFF);
}

/**
 * Pressurizer water level (%).
 * Drops when pressure rises above nominal.
 */
export function calcWaterLevel(pressure) {
    const deviation = pressure - PHYSICS.NOMINAL_PRESSURE;
    const level = PHYSICS.NOMINAL_WATER_LEVEL + deviation * PHYSICS.WATER_LEVEL_PRESSURE_COEFF;
    return Math.max(0, Math.min(100, level));
}


// ─── Environmental ───────────────────────────────────────────────────

/**
 * Radiation dose rate at containment boundary (mSv/hr).
 */
export function calcRadiationLevel(flux, power) {
    const fromFlux = flux * PHYSICS.RADIATION_FLUX_COEFF;
    const fromPower = power * 1e-9;
    return (fromFlux + fromPower) * 1000; // Sv → mSv
}

/**
 * Containment building internal pressure (MPa).
 * Rises if core temp greatly exceeds nominal.
 */
export function calcContainmentPressure(coreTemp) {
    const excess = Math.max(0, coreTemp - PHYSICS.NOMINAL_COOLANT_TEMP);
    return PHYSICS.CONTAINMENT_BASE_PRESSURE + excess * PHYSICS.CONTAINMENT_TEMP_COEFF;
}

/**
 * Cumulative energy output in MWh.
 */
export function calcEnergyOutput(previousMWh, powerWatts, dt) {
    const powerMW = powerWatts / 1e6;
    const hoursElapsed = dt / 3600;
    return previousMWh + powerMW * hoursElapsed;
}
