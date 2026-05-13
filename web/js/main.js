/**
 * CoreSim — Main Application Entry Point
 *
 * Initializes all subsystems, wires UI events, creates Chart.js
 * instances for every telemetry tab, and orchestrates the update
 * loop that pushes reactor state into the DOM.
 */

import { SimulationManager } from './SimulationManager.js';
import { CoreVisualization, CrossSectionView } from './coreVisualization.js';
import { getRecommendations, getInsights } from './recommendations.js';
import { REACTOR_COMPONENTS } from './reactorInfo.js';
import { METRICS, ACTIONS, createRule, getDefaultRules, evaluateRules, applyActions, formatThreshold } from './automationRules.js';

// ═══════════════════════════════════════════════════════════════
// DOM References
// ═══════════════════════════════════════════════════════════════
const $ = (id) => document.getElementById(id);

const dom = {
    // Header
    headerStatus: $('header-status'),
    headerPower:  $('header-power'),
    headerTemp:   $('header-temp'),
    headerTime:   $('header-time'),
    header:       $('main-header'),

    // Controls
    rodControl:     $('rod-control'),
    rodDisplay:     $('rod-display'),
    coolantControl: $('coolant-control'),
    coolantDisplay: $('coolant-display'),

    // Buttons
    btnStart: $('btn-start'),
    btnPause: $('btn-pause'),
    btnReset: $('btn-reset'),
    btnScram: $('btn-scram'),

    // Recommendations
    recTitle:    $('rec-title'),
    recMessages: $('rec-messages'),

    // Insights
    insightsGrid: $('insights-grid'),

    // Telemetry tabs
    telemetryTabs: document.querySelectorAll('.tel-tab'),
    tabPanes:      document.querySelectorAll('.tab-pane'),

    // Info popup
    popupOverlay: $('info-popup-overlay'),
    popupClose:   $('info-popup-close'),
    popupIcon:    $('info-popup-icon'),
    popupTitle:   $('info-popup-title'),
    popupDesc:    $('info-popup-desc'),
    popupDetails: $('info-popup-details'),
    popupFact:    $('info-popup-fact'),

    // Reactor model container
    reactorModelContainer: $('reactor-model-container'),

    // Automation
    autoMetric:      $('auto-metric'),
    autoCondition:   $('auto-condition'),
    autoThreshold:   $('auto-threshold'),
    autoAction:      $('auto-action'),
    autoActionValue: $('auto-action-value'),
    autoActionUnit:  $('auto-action-unit'),
    btnAddRule:      $('btn-add-rule'),
    autoRulesList:   $('auto-rules-list'),
    autoLog:         $('auto-log'),
};

// ═══════════════════════════════════════════════════════════════
// Simulation
// ═══════════════════════════════════════════════════════════════
const sim = new SimulationManager();

// ═══════════════════════════════════════════════════════════════
// Visualization
// ═══════════════════════════════════════════════════════════════
let coreViz = null;
let crossViz = null;

// ═══════════════════════════════════════════════════════════════
// Automation Rules
// ═══════════════════════════════════════════════════════════════
let automationRules = getDefaultRules();
const MAX_LOG_ENTRIES = 20;
let firedRuleIds = new Set(); // IDs of rules that fired this frame

function initAutomationForm() {
    // Populate metric dropdown
    for (const [key, m] of Object.entries(METRICS)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = m.label + (m.unit ? ` (${m.unit})` : '');
        dom.autoMetric.appendChild(opt);
    }

    // Populate action dropdown
    for (const [key, a] of Object.entries(ACTIONS)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = a.label;
        dom.autoAction.appendChild(opt);
    }

    // Set initial defaults
    updateFormDefaults();

    // Metric change → update threshold default
    dom.autoMetric.addEventListener('change', updateFormDefaults);

    // Action change → update value default and unit
    dom.autoAction.addEventListener('change', () => {
        const a = ACTIONS[dom.autoAction.value];
        if (a) {
            dom.autoActionValue.value = a.defaultValue;
            dom.autoActionUnit.textContent = a.unit;
            // Hide value input for SCRAM (no value needed)
            dom.autoActionValue.style.display = a.target === 'scram' ? 'none' : '';
            dom.autoActionUnit.style.display = a.target === 'scram' ? 'none' : '';
        }
    });

    // Add rule button
    dom.btnAddRule.addEventListener('click', () => {
        const metricKey = dom.autoMetric.value;
        const condition = dom.autoCondition.value;
        const threshold = parseFloat(dom.autoThreshold.value);
        const actionKey = dom.autoAction.value;
        const actionValue = parseFloat(dom.autoActionValue.value) || 0;

        if (isNaN(threshold)) {
            dom.autoThreshold.focus();
            return;
        }

        const rule = createRule(metricKey, condition, threshold, actionKey, actionValue);
        automationRules.push(rule);
        renderRulesList();
    });

    // Render initial default rules
    renderRulesList();
}

function updateFormDefaults() {
    const m = METRICS[dom.autoMetric.value];
    if (m) {
        dom.autoThreshold.value = m.defaultThreshold;
        dom.autoThreshold.step = m.step;
    }
    const a = ACTIONS[dom.autoAction.value];
    if (a) {
        dom.autoActionValue.value = a.defaultValue;
        dom.autoActionUnit.textContent = a.unit;
        dom.autoActionValue.style.display = a.target === 'scram' ? 'none' : '';
        dom.autoActionUnit.style.display = a.target === 'scram' ? 'none' : '';
    }
}

function renderRulesList() {
    dom.autoRulesList.innerHTML = '';

    automationRules.forEach(rule => {
        const metric = METRICS[rule.metricKey];
        const action = ACTIONS[rule.actionKey];
        if (!metric || !action) return;

        const card = document.createElement('div');
        card.className = 'auto-rule-card';
        card.id = `rule-card-${rule.id}`;
        if (!rule.enabled) card.classList.add('disabled');
        if (firedRuleIds.has(rule.id)) card.classList.add('firing');

        // Rule text
        const text = document.createElement('div');
        text.className = 'auto-rule-text';
        const threshStr = formatThreshold(rule.threshold, rule.metricKey);
        const valStr = action.target === 'scram' ? '' : ` ${rule.actionValue}${action.unit}`;
        text.innerHTML = `<span class="rule-if">IF</span> ${metric.label} ${rule.condition} ${threshStr} `
            + `<span class="rule-then">→</span> ${action.label}${valStr}`;
        card.appendChild(text);

        // Fire count badge
        if (rule.fireCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'auto-rule-badge';
            badge.textContent = `×${rule.fireCount}`;
            card.appendChild(badge);
        }

        // Toggle button
        const toggle = document.createElement('button');
        toggle.className = 'auto-rule-toggle';
        toggle.textContent = rule.enabled ? 'ON' : 'OFF';
        toggle.addEventListener('click', () => {
            rule.enabled = !rule.enabled;
            renderRulesList();
        });
        card.appendChild(toggle);

        // Delete button
        const del = document.createElement('button');
        del.className = 'auto-rule-delete';
        del.textContent = '×';
        del.addEventListener('click', () => {
            automationRules = automationRules.filter(r => r.id !== rule.id);
            renderRulesList();
        });
        card.appendChild(del);

        dom.autoRulesList.appendChild(card);
    });
}

function processAutomation(snapshot) {
    const actions = evaluateRules(automationRules, snapshot);
    firedRuleIds.clear();

    if (actions.length === 0) return;

    const currentRods = parseInt(dom.rodControl.value);
    const currentCoolant = parseInt(dom.coolantControl.value);
    const result = applyActions(actions, currentRods, currentCoolant);

    // Apply SCRAM
    if (result.scram) {
        sim.scram();
        dom.rodControl.value = 100;
        dom.rodDisplay.textContent = '100%';
    } else {
        // Apply rod/coolant changes
        if (result.rodPercent !== currentRods) {
            dom.rodControl.value = result.rodPercent;
            dom.rodDisplay.textContent = result.rodPercent + '%';
        }
        if (result.coolantRate !== currentCoolant) {
            dom.coolantControl.value = result.coolantRate;
            dom.coolantDisplay.textContent = result.coolantRate;
        }
        sim.updateControls(result.rodPercent, result.coolantRate);
    }

    // Track which rules fired and log
    actions.forEach(act => {
        firedRuleIds.add(act.ruleId);
        addLogEntry(snapshot.time, act.label);
    });

    renderRulesList();
}

function addLogEntry(time, text) {
    const entry = document.createElement('div');
    entry.className = 'auto-log-entry';
    entry.innerHTML = `<span class="log-time">[${time.toFixed(1)}s]</span> ${text}`;
    dom.autoLog.insertBefore(entry, dom.autoLog.firstChild);

    // Limit log length
    while (dom.autoLog.children.length > MAX_LOG_ENTRIES) {
        dom.autoLog.removeChild(dom.autoLog.lastChild);
    }
}

// ═══════════════════════════════════════════════════════════════
// Info Popup System
// ═══════════════════════════════════════════════════════════════
function showInfoPopup(info) {
    dom.popupIcon.textContent = info.icon || '';
    dom.popupTitle.textContent = info.title || '';
    dom.popupDesc.textContent = info.description || '';

    // Details list
    dom.popupDetails.innerHTML = '';
    if (info.details) {
        info.details.forEach(d => {
            const li = document.createElement('li');
            li.textContent = d;
            dom.popupDetails.appendChild(li);
        });
    }

    // Fun fact
    dom.popupFact.textContent = info.funFact ? `💡 ${info.funFact}` : '';

    dom.popupOverlay.classList.add('active');
}

function hideInfoPopup() {
    dom.popupOverlay.classList.remove('active');
}

function initPopup() {
    dom.popupClose.addEventListener('click', hideInfoPopup);
    dom.popupOverlay.addEventListener('click', (e) => {
        if (e.target === dom.popupOverlay) hideInfoPopup();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideInfoPopup();
    });
}

// ═══════════════════════════════════════════════════════════════
// Interactive Reactor Model SVG
// ═══════════════════════════════════════════════════════════════
async function initReactorModel() {
    try {
        const resp = await fetch('assets/reactor-model.svg');
        const svgText = await resp.text();
        dom.reactorModelContainer.innerHTML = svgText;

        const svg = dom.reactorModelContainer.querySelector('svg');
        if (!svg) return;

        // Map SVG group IDs to REACTOR_COMPONENTS keys
        // The SVG has groups with ids matching the keys in REACTOR_COMPONENTS
        const clickableIds = Object.keys(REACTOR_COMPONENTS);

        clickableIds.forEach(id => {
            const group = svg.getElementById(id);
            if (!group) return;

            // Mark as interactive
            group.setAttribute('data-clickable', 'true');
            group.style.cursor = 'pointer';

            group.addEventListener('click', (e) => {
                e.stopPropagation();
                const info = REACTOR_COMPONENTS[id];
                if (info) showInfoPopup(info);
            });
        });

        // Also handle sub-groups that are inside containment
        // The reactor vessel and fuel rods are nested inside "containment"
        // We need dedicated clickable zones for them
        const reactorVessel = svg.querySelector('#containment rect[x="140"]');
        if (reactorVessel) {
            reactorVessel.style.cursor = 'pointer';
            reactorVessel.setAttribute('data-clickable', 'true');
            reactorVessel.addEventListener('click', (e) => {
                e.stopPropagation();
                showInfoPopup(REACTOR_COMPONENTS['reactor-vessel']);
            });
        }

        const fuelRods = svg.getElementById('fuel-rods-svg');
        if (fuelRods) {
            fuelRods.setAttribute('data-clickable', 'true');
            fuelRods.style.cursor = 'pointer';
            fuelRods.addEventListener('click', (e) => {
                e.stopPropagation();
                showInfoPopup(REACTOR_COMPONENTS['fuel-rods']);
            });
        }

        const controlRods = svg.getElementById('control-rods-svg');
        if (controlRods) {
            controlRods.setAttribute('data-clickable', 'true');
            controlRods.style.cursor = 'pointer';
            controlRods.addEventListener('click', (e) => {
                e.stopPropagation();
                showInfoPopup(REACTOR_COMPONENTS['control-rods']);
            });
        }

    } catch (err) {
        console.warn('Could not load reactor model SVG:', err);
        dom.reactorModelContainer.innerHTML = '<p style="color:#64748b;text-align:center;padding:2rem;">Reactor model diagram could not be loaded.</p>';
    }
}

// ═══════════════════════════════════════════════════════════════
// Charts — one per metric, with time on x-axis
// ═══════════════════════════════════════════════════════════════
const charts = {};

function makeChartOptions(color, logScale = false) {
    return {
        type: 'line',
        data: {
            datasets: [{
                data: [],
                borderColor: color,
                borderWidth: 1.5,
                pointRadius: 0,
                fill: true,
                backgroundColor: hexToRgba(color, 0.08),
                tension: 0.3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    type: 'linear',
                    display: true,
                    title: {
                        display: true,
                        text: 'Time (s)',
                        color: '#475569',
                        font: { family: "'JetBrains Mono', monospace", size: 9 },
                    },
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: {
                        color: '#475569',
                        font: { family: "'JetBrains Mono', monospace", size: 8 },
                        maxTicksLimit: 6,
                        callback: (val) => val.toFixed(0) + 's',
                    },
                    border: { color: 'transparent' },
                },
                y: {
                    type: logScale ? 'logarithmic' : 'linear',
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                        color: '#475569',
                        font: { family: "'JetBrains Mono', monospace", size: 9 },
                        maxTicksLimit: 5,
                    },
                    border: { color: 'transparent' },
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 20, 30, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleFont: { family: "'JetBrains Mono', monospace", size: 10 },
                    bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
                    callbacks: {
                        title: (items) => `t = ${items[0]?.parsed?.x?.toFixed(1) ?? '?'}s`,
                        label: (item) => {
                            const v = item.parsed.y;
                            if (Math.abs(v) >= 1e6) return v.toExponential(2);
                            if (Math.abs(v) >= 100) return v.toFixed(1);
                            return v.toFixed(3);
                        }
                    }
                },
            },
        }
    };
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function initCharts() {
    const defs = {
        // Nuclear tab
        'chart-flux':         { color: '#60a5fa', log: true },
        'chart-rod':          { color: '#a78bfa', log: false },
        'chart-sur':          { color: '#22d3ee', log: false },
        // Thermal tab
        'chart-fuel-temp':    { color: '#ef4444', log: false },
        'chart-coolant-temp': { color: '#3b82f6', log: false },
        // Hydraulic tab
        'chart-pressure':     { color: '#f59e0b', log: false },
        'chart-flow':         { color: '#3b82f6', log: false },
        'chart-water':        { color: '#22d3ee', log: false },
        // Environmental tab
        'chart-radiation':    { color: '#a78bfa', log: false },
        'chart-containment':  { color: '#f97316', log: false },
        'chart-energy':       { color: '#10b981', log: false },
    };

    for (const [canvasId, { color, log }] of Object.entries(defs)) {
        const canvas = $(canvasId);
        if (!canvas) continue;
        charts[canvasId] = new Chart(
            canvas.getContext('2d'),
            makeChartOptions(color, log)
        );
    }
}

// Mapping: chart id → snapshot field
const CHART_FIELDS = {
    'chart-flux':         'flux',
    'chart-rod':          'rodPercent',
    'chart-sur':          'startupRate',
    'chart-fuel-temp':    'fuelTemp',
    'chart-coolant-temp': 'coolantTemp',
    'chart-pressure':     'pressure',
    'chart-flow':         'coolantRate',
    'chart-water':        'waterLevel',
    'chart-radiation':    'radiationLevel',
    'chart-containment':  'containmentPressure',
    'chart-energy':       'energyOutputMWh',
};

function updateCharts(history) {
    for (const [chartId, field] of Object.entries(CHART_FIELDS)) {
        const chart = charts[chartId];
        if (!chart) continue;

        chart.data.datasets[0].data = history.map(h => ({
            x: h.time,
            y: h[field]
        }));
        chart.update('none');
    }
}

// ═══════════════════════════════════════════════════════════════
// UI Update — called every frame by SimulationManager
// ═══════════════════════════════════════════════════════════════
function onSimUpdate(snapshot, history) {
    updateHeader(snapshot);
    updateRecommendations(snapshot);
    updateInsights(snapshot);
    updateCharts(history);
    if (coreViz) coreViz.update(snapshot);

    // Evaluate automation rules
    processAutomation(snapshot);
}

function updateHeader(s) {
    // Status badge
    dom.headerStatus.textContent = s.status;
    dom.headerStatus.className = 'hm-value status-' + s.status.toLowerCase();

    // Metrics
    dom.headerPower.textContent = s.powerMW.toFixed(2) + ' MW';
    dom.headerTemp.textContent = s.fuelTemp.toFixed(0) + ' °C';
    dom.headerTime.textContent = s.time.toFixed(1) + ' s';

    // Header animation state
    dom.header.className = 'main-header';
    if (s.status === 'WARNING') dom.header.classList.add('state-warning');
    else if (s.status === 'SCRAM') dom.header.classList.add('state-scram');
    else if (s.status === 'MELTDOWN') dom.header.classList.add('state-meltdown');
}

function updateRecommendations(snapshot) {
    const rec = getRecommendations(snapshot, sim.isRunning);

    dom.recTitle.textContent = rec.title;
    dom.recTitle.className = 'rec-title level-' + rec.level;

    dom.recMessages.innerHTML = '';
    rec.messages.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = msg;
        dom.recMessages.appendChild(li);
    });
}

function updateInsights(snapshot) {
    const insights = getInsights(snapshot);
    dom.insightsGrid.innerHTML = '';

    insights.forEach(ins => {
        const row = document.createElement('div');
        row.className = 'insight-row status-' + ins.status;

        const label = document.createElement('span');
        label.className = 'insight-label';
        label.textContent = ins.label;

        const valWrap = document.createElement('span');
        const val = document.createElement('span');
        val.className = 'insight-value';
        val.textContent = ins.value;
        const unit = document.createElement('span');
        unit.className = 'insight-unit';
        unit.textContent = ins.unit;

        valWrap.appendChild(val);
        valWrap.appendChild(unit);
        row.appendChild(label);
        row.appendChild(valWrap);
        dom.insightsGrid.appendChild(row);
    });
}

// ═══════════════════════════════════════════════════════════════
// Event Wiring
// ═══════════════════════════════════════════════════════════════
function initEvents() {
    // ── Controls ──
    dom.rodControl.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        dom.rodDisplay.textContent = val + '%';
        sim.updateControls(val, parseInt(dom.coolantControl.value));
    });

    dom.coolantControl.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        dom.coolantDisplay.textContent = val;
        sim.updateControls(parseInt(dom.rodControl.value), val);
    });

    // ── Buttons ──
    dom.btnStart.addEventListener('click', () => {
        sim.toggle();
        dom.btnStart.textContent = sim.isRunning ? 'Pause' : 'Start / Resume';
    });

    dom.btnPause.addEventListener('click', () => {
        sim.stop();
        dom.btnStart.textContent = 'Start / Resume';
    });

    dom.btnReset.addEventListener('click', () => {
        sim.reset();
        dom.btnStart.textContent = 'Start / Resume';
        // Reset sliders
        dom.rodControl.value = 50;
        dom.rodDisplay.textContent = '50%';
        dom.coolantControl.value = 5000;
        dom.coolantDisplay.textContent = '5000';
    });

    dom.btnScram.addEventListener('click', () => {
        sim.scram();
        dom.rodControl.value = 100;
        dom.rodDisplay.textContent = '100%';
        dom.btnStart.textContent = 'Pause';
    });

    // ── Telemetry Tabs ──
    dom.telemetryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dom.telemetryTabs.forEach(t => t.classList.remove('active'));
            dom.tabPanes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const pane = $('tab-' + tab.dataset.tab);
            if (pane) pane.classList.add('active');

            // Trigger chart resize for newly visible charts
            setTimeout(() => {
                Object.values(charts).forEach(c => c.resize());
            }, 50);
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════════
function init() {
    // Popup system
    initPopup();

    // Charts
    initCharts();

    // Visualization canvases
    coreViz = new CoreVisualization('assembly-canvas');
    crossViz = new CrossSectionView('cross-section-canvas', showInfoPopup);

    // Interactive reactor model (async — loads SVG)
    initReactorModel();

    // Automation rules
    initAutomationForm();

    // Simulation
    sim.onUpdate = onSimUpdate;
    sim.init('UO2', 3.5, 50, 5000);

    // Events
    initEvents();

    // Initial recommendation (paused state)
    const initialSnap = sim.core.getSnapshot();
    updateRecommendations(initialSnap);
    updateInsights(initialSnap);
}

window.addEventListener('DOMContentLoaded', init);
