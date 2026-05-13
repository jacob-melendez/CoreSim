/**
 * CoreSim — Reactor Core State Machine
 *
 * Holds all instantaneous state for the reactor and advances
 * it forward by one timestep using the equations module.
 */

import {
    calcKEff,
    calcReactivity,
    evolveFlux,
    calcStartupRate,
    calcPowerOutput,
    calcCoolantRemoval,
    calcTempChange,
    calcCoolantOutletTemp,
    calcPressure,
    calcWaterLevel,
    calcRadiationLevel,
    calcContainmentPressure,
    calcEnergyOutput,
    PHYSICS
} from './equations.js';

export class ReactorCore {
    constructor(fuelType, enrichment, rodPercent, coolantRate) {
        // Configuration (can change at runtime via controls)
        this.fuelType = fuelType;
        this.enrichment = enrichment;
        this.rodPercent = rodPercent;
        this.coolantRate = coolantRate;

        // ── Simulation clock ──
        this.time = 0;

        // ── Nuclear state ──
        this.kEff = 1.0;
        this.reactivity = 0;
        this.flux = 1e14;          // n/cm²·s — typical PWR operating flux
        this.prevFlux = 1e14;
        this.startupRate = 0;      // decades/min (SUR)

        // ── Thermal state ──
        this.fuelTemp = PHYSICS.DEFAULT_INLET_TEMP;      // °C
        this.coolantTemp = PHYSICS.DEFAULT_INLET_TEMP;    // °C (outlet)
        this.powerOutput = 0;      // Watts

        // ── Hydraulic state ──
        this.pressure = PHYSICS.NOMINAL_PRESSURE;         // MPa
        this.waterLevel = PHYSICS.NOMINAL_WATER_LEVEL;    // %

        // ── Environmental state ──
        this.radiationLevel = 0;   // mSv/hr
        this.containmentPressure = PHYSICS.CONTAINMENT_BASE_PRESSURE; // MPa
        this.energyOutputMWh = 0;  // cumulative MWh

        // ── Status ──
        this.status = "OFFLINE";
        this.scramActive = false;
    }

    /**
     * Advance the simulation by dt seconds.
     */
    updateState(dt) {
        // 1. Neutronics
        this.kEff = calcKEff(this.fuelType, this.enrichment, this.rodPercent, this.fuelTemp);
        this.reactivity = calcReactivity(this.kEff);

        this.prevFlux = this.flux;
        this.flux = evolveFlux(this.flux, this.reactivity, dt);

        // Clamp flux to avoid numerical blow-up
        this.flux = Math.max(1e2, Math.min(this.flux, 1e20));

        this.startupRate = calcStartupRate(this.prevFlux, this.flux, dt);

        // 2. Thermal
        this.powerOutput = calcPowerOutput(this.flux, this.enrichment);
        const qCool = calcCoolantRemoval(this.fuelTemp, this.coolantRate);
        const deltaTemp = calcTempChange(this.powerOutput, qCool, dt);
        this.fuelTemp += deltaTemp;

        // Clamp to physical range
        if (this.fuelTemp < PHYSICS.DEFAULT_INLET_TEMP) {
            this.fuelTemp = PHYSICS.DEFAULT_INLET_TEMP;
        }

        this.coolantTemp = calcCoolantOutletTemp(
            PHYSICS.DEFAULT_INLET_TEMP,
            this.powerOutput,
            this.coolantRate
        );

        // 3. Hydraulic
        this.pressure = calcPressure(this.coolantTemp);
        this.waterLevel = calcWaterLevel(this.pressure);

        // 4. Environmental
        this.radiationLevel = calcRadiationLevel(this.flux, this.powerOutput);
        this.containmentPressure = calcContainmentPressure(this.fuelTemp);
        this.energyOutputMWh = calcEnergyOutput(this.energyOutputMWh, this.powerOutput, dt);

        // 5. Clock & status
        this.time += dt;
        this.checkStatus();
    }

    checkStatus() {
        if (this.fuelTemp > PHYSICS.MELTDOWN_TEMP) {
            this.status = "MELTDOWN";
        } else if (this.scramActive) {
            this.status = "SCRAM";
        } else if (this.fuelTemp > PHYSICS.SCRAM_TEMP) {
            // Auto-SCRAM on extreme temperature
            this.triggerScram();
            this.status = "SCRAM";
        } else if (this.fuelTemp > PHYSICS.WARNING_TEMP) {
            this.status = "WARNING";
        } else {
            this.status = "SAFE";
        }
    }

    triggerScram() {
        this.scramActive = true;
        this.rodPercent = 100;
    }

    clearScram() {
        this.scramActive = false;
    }

    // ── Control setters ──
    setRodPercent(val) {
        this.rodPercent = val;
        // If user manually moves rods off 100%, clear SCRAM
        if (val < 100) this.scramActive = false;
    }
    setCoolantRate(val) { this.coolantRate = val; }

    /**
     * Return a plain-object snapshot of the full reactor state.
     * This is what gets pushed into history[] and sent to the UI.
     */
    getSnapshot() {
        return {
            time: this.time,

            // Nuclear
            kEff: this.kEff,
            reactivity: this.reactivity,
            flux: this.flux,
            startupRate: this.startupRate,
            rodPercent: this.rodPercent,

            // Thermal
            fuelTemp: this.fuelTemp,
            coolantTemp: this.coolantTemp,
            powerOutput: this.powerOutput,
            powerMW: this.powerOutput / 1e6,

            // Hydraulic
            pressure: this.pressure,
            waterLevel: this.waterLevel,
            coolantRate: this.coolantRate,

            // Environmental
            radiationLevel: this.radiationLevel,
            containmentPressure: this.containmentPressure,
            energyOutputMWh: this.energyOutputMWh,

            // Status
            status: this.status,
            scramActive: this.scramActive,
        };
    }
}
