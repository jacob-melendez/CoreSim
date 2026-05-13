/**
 * CoreSim — Expert Recommendations Engine
 *
 * Analyzes the current reactor snapshot and returns context-aware
 * advice strings for the operator. Designed to be educational —
 * each recommendation explains WHY the action is needed.
 */

/**
 * Returns an object { title, messages[] } based on current state.
 */
export function getRecommendations(snapshot, isRunning) {
    const msgs = [];

    // ── Not running ──
    if (!isRunning) {
        if (snapshot.status === "MELTDOWN") {
            return {
                title: "☢️ Core Meltdown",
                level: "critical",
                messages: [
                    "Fuel temperature exceeded the melting point of uranium dioxide (2800°C).",
                    "In a real reactor, this would cause fuel rod failure and release of fission products.",
                    "Press Reset to restart the simulation with safe parameters.",
                ]
            };
        }
        return {
            title: "⏸ Simulation Paused",
            level: "info",
            messages: [
                "Press Start / Resume to begin the simulation.",
                "Adjust Control Rod Insertion and Coolant Flow Rate before starting.",
                "Tip: Start with rods at ~50% and coolant at 5000 L/s for stable operation.",
            ]
        };
    }

    // ── SCRAM active ──
    if (snapshot.scramActive) {
        msgs.push("🛑 Emergency SCRAM is active — all control rods are fully inserted.");
        msgs.push("The reactor is subcritical (k_eff < 1). Neutron flux is decreasing exponentially.");
        if (snapshot.fuelTemp > 400) {
            msgs.push(`Fuel temperature is ${snapshot.fuelTemp.toFixed(0)}°C — waiting for decay heat removal.`);
            msgs.push("Coolant is still circulating to remove residual decay heat.");
        } else {
            msgs.push("Core has reached a safe temperature. You may Reset to restart.");
        }
        return { title: "🛑 SCRAM Active", level: "scram", messages: msgs };
    }

    // ── Meltdown imminent ──
    if (snapshot.fuelTemp > 2000) {
        return {
            title: "🔥 CRITICAL — Meltdown Imminent",
            level: "critical",
            messages: [
                `Fuel temperature is ${snapshot.fuelTemp.toFixed(0)}°C — approaching meltdown threshold (2800°C)!`,
                "IMMEDIATELY press SCRAM to insert all control rods.",
                "Alternatively, maximize coolant flow to improve heat removal.",
            ]
        };
    }

    // ── Warning zone ──
    if (snapshot.status === "WARNING") {
        msgs.push(`⚠️ Fuel temperature is elevated: ${snapshot.fuelTemp.toFixed(0)}°C (warning threshold: 600°C).`);

        if (snapshot.rodPercent < 30) {
            msgs.push("Control rods are minimally inserted — consider inserting them further to reduce reactivity.");
        }
        if (snapshot.coolantRate < 4000) {
            msgs.push("Coolant flow is below nominal. Increase flow rate to improve heat removal.");
        }
        if (snapshot.reactivity > 0.01) {
            msgs.push(`Reactivity is positive (ρ = ${snapshot.reactivity.toFixed(4)}) — the reactor is supercritical and power is rising.`);
        }
        return { title: "⚠️ Warning", level: "warning", messages: msgs };
    }

    // ── Supercritical but not yet in warning ──
    if (snapshot.reactivity > 0.005) {
        msgs.push(`Reactor is supercritical (ρ = ${snapshot.reactivity.toFixed(4)}, k_eff = ${snapshot.kEff.toFixed(4)}).`);
        msgs.push("Neutron flux is increasing — power output will rise.");
        msgs.push("Insert control rods gradually to approach criticality (ρ ≈ 0).");
        return { title: "📈 Power Rising", level: "info", messages: msgs };
    }

    // ── Subcritical ──
    if (snapshot.reactivity < -0.005) {
        msgs.push(`Reactor is subcritical (ρ = ${snapshot.reactivity.toFixed(4)}).`);
        msgs.push("Neutron flux is decreasing — power output will fall.");
        msgs.push("Withdraw control rods to increase reactivity if you want to raise power.");
        return { title: "📉 Power Falling", level: "info", messages: msgs };
    }

    // ── Steady state (near critical) ──
    msgs.push(`Reactor is near critical (ρ = ${snapshot.reactivity.toFixed(4)}, k_eff = ${snapshot.kEff.toFixed(4)}).`);
    msgs.push(`Operating at ${snapshot.powerMW.toFixed(2)} MW with fuel temp ${snapshot.fuelTemp.toFixed(0)}°C.`);
    msgs.push("Conditions are stable. Fine-tune rod position for desired power level.");
    return { title: "✅ Stable Operation", level: "safe", messages: msgs };
}


/**
 * Returns key-value pairs for the System Insights panel.
 */
export function getInsights(snapshot) {
    return [
        { label: "Reactivity (ρ)", value: snapshot.reactivity.toFixed(5), unit: "",
          status: Math.abs(snapshot.reactivity) < 0.005 ? "normal" : snapshot.reactivity > 0 ? "warn" : "cool" },

        { label: "k_eff", value: snapshot.kEff.toFixed(4), unit: "",
          status: Math.abs(snapshot.kEff - 1) < 0.01 ? "normal" : snapshot.kEff > 1 ? "warn" : "cool" },

        { label: "Neutron Flux", value: snapshot.flux.toExponential(2), unit: "n/cm²·s",
          status: "normal" },

        { label: "Startup Rate", value: snapshot.startupRate.toFixed(2), unit: "DPM",
          status: Math.abs(snapshot.startupRate) < 1 ? "normal" : "warn" },

        { label: "Power Output", value: snapshot.powerMW.toFixed(2), unit: "MW",
          status: "normal" },

        { label: "Fuel Temp", value: snapshot.fuelTemp.toFixed(0), unit: "°C",
          status: snapshot.fuelTemp < 600 ? "normal" : snapshot.fuelTemp < 900 ? "warn" : "critical" },

        { label: "Primary Pressure", value: snapshot.pressure.toFixed(1), unit: "MPa",
          status: Math.abs(snapshot.pressure - 15.5) < 2 ? "normal" : "warn" },
    ];
}
