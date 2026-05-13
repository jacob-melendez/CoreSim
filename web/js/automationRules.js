/**
 * CoreSim — Automation Rules Engine
 *
 * Lets users define conditional safety rules:
 *   "IF [metric] [above/below] [threshold] THEN [action] [value]"
 *
 * Rules are evaluated every simulation frame. When a rule fires,
 * it adjusts reactor controls (rods or coolant) automatically.
 * This teaches operators how automated safety systems work in
 * real nuclear power plants.
 */

// ─── Available metrics (maps to snapshot field names) ─────────
export const METRICS = {
    reactivity:     { label: 'Reactivity (ρ)',        unit: '',       field: 'reactivity',          defaultThreshold: 0.01,   step: 0.001 },
    fuelTemp:       { label: 'Fuel Temperature',      unit: '°C',     field: 'fuelTemp',            defaultThreshold: 500,    step: 10 },
    coolantTemp:    { label: 'Coolant Temperature',   unit: '°C',     field: 'coolantTemp',         defaultThreshold: 330,    step: 5 },
    flux:           { label: 'Neutron Flux',          unit: 'n/cm²·s',field: 'flux',                defaultThreshold: 5e14,   step: 1e13 },
    powerMW:        { label: 'Power Output',          unit: 'MW',     field: 'powerMW',             defaultThreshold: 2000,   step: 100 },
    pressure:       { label: 'Primary Pressure',      unit: 'MPa',    field: 'pressure',            defaultThreshold: 16.5,   step: 0.5 },
    radiationLevel: { label: 'Radiation Level',       unit: 'mSv/hr', field: 'radiationLevel',      defaultThreshold: 5,      step: 0.5 },
    startupRate:    { label: 'Startup Rate (SUR)',     unit: 'DPM',    field: 'startupRate',         defaultThreshold: 3,      step: 0.5 },
};

// ─── Available actions ────────────────────────────────────────
export const ACTIONS = {
    insert_rods:      { label: 'Insert rods by',       unit: '%',    defaultValue: 10,  target: 'rods',    direction: +1 },
    withdraw_rods:    { label: 'Withdraw rods by',     unit: '%',    defaultValue: 10,  target: 'rods',    direction: -1 },
    increase_coolant: { label: 'Increase coolant by',  unit: 'L/s',  defaultValue: 500, target: 'coolant', direction: +1 },
    decrease_coolant: { label: 'Decrease coolant by',  unit: 'L/s',  defaultValue: 500, target: 'coolant', direction: -1 },
    scram:            { label: 'Emergency SCRAM',      unit: '',     defaultValue: 0,   target: 'scram',   direction: 0 },
};

// ─── Rule class ───────────────────────────────────────────────
let nextRuleId = 1;

export function createRule(metricKey, condition, threshold, actionKey, actionValue) {
    return {
        id: nextRuleId++,
        enabled: true,
        metricKey,
        condition,       // 'above' | 'below'
        threshold,
        actionKey,
        actionValue,
        lastFired: 0,    // timestamp of last firing (cooldown)
        fireCount: 0,
    };
}

/**
 * Default starter rules — educational examples.
 */
export function getDefaultRules() {
    return [
        createRule('fuelTemp',   'above', 700, 'insert_rods',      10),
        createRule('reactivity', 'above', 0.02, 'insert_rods',     5),
    ];
}


// ─── Rule evaluation ──────────────────────────────────────────

/**
 * Evaluate all enabled rules against the current snapshot.
 * Returns an array of actions to apply.
 *
 * Cooldown: A rule won't fire again for at least 1 simulation-second
 * after its last firing, to prevent oscillation.
 */
export function evaluateRules(rules, snapshot) {
    const actions = [];
    const COOLDOWN_S = 1.0; // seconds between firings

    for (const rule of rules) {
        if (!rule.enabled) continue;

        const metric = METRICS[rule.metricKey];
        if (!metric) continue;

        const value = snapshot[metric.field];
        if (value === undefined || value === null) continue;

        // Check condition
        let triggered = false;
        if (rule.condition === 'above' && value > rule.threshold) triggered = true;
        if (rule.condition === 'below' && value < rule.threshold) triggered = true;

        if (!triggered) continue;

        // Cooldown check
        if (snapshot.time - rule.lastFired < COOLDOWN_S) continue;

        const action = ACTIONS[rule.actionKey];
        if (!action) continue;

        rule.lastFired = snapshot.time;
        rule.fireCount++;

        actions.push({
            ruleId: rule.id,
            target: action.target,
            direction: action.direction,
            value: rule.actionValue,
            label: `${metric.label} ${rule.condition} ${formatThreshold(rule.threshold, rule.metricKey)} → ${action.label} ${rule.actionValue}${action.unit}`,
        });
    }

    return actions;
}

/**
 * Apply a set of evaluated actions to the simulation.
 * Returns { rodPercent, coolantRate } — the new values after all actions.
 */
export function applyActions(actions, currentRodPercent, currentCoolantRate) {
    let rods = currentRodPercent;
    let coolant = currentCoolantRate;
    let scramTriggered = false;

    for (const act of actions) {
        if (act.target === 'rods') {
            rods += act.direction * act.value;
        } else if (act.target === 'coolant') {
            coolant += act.direction * act.value;
        } else if (act.target === 'scram') {
            scramTriggered = true;
        }
    }

    // Clamp to valid ranges
    rods = Math.max(0, Math.min(100, rods));
    coolant = Math.max(500, Math.min(10000, coolant));

    return { rodPercent: rods, coolantRate: coolant, scram: scramTriggered };
}


// ─── Formatting helpers ───────────────────────────────────────

export function formatThreshold(value, metricKey) {
    if (metricKey === 'flux') return value.toExponential(1);
    if (metricKey === 'reactivity') return value.toFixed(3);
    if (Math.abs(value) >= 100) return value.toFixed(0);
    return value.toFixed(1);
}

export function formatMetricValue(value, metricKey) {
    if (value === undefined || value === null) return '—';
    if (metricKey === 'flux') return value.toExponential(2);
    if (metricKey === 'reactivity') return value.toFixed(5);
    if (Math.abs(value) >= 100) return value.toFixed(1);
    return value.toFixed(3);
}
