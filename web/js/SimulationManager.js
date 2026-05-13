/**
 * CoreSim — Simulation Manager
 *
 * Owns the simulation loop (requestAnimationFrame) and history buffer.
 * Bridges the ReactorCore physics with the UI callback system.
 */

import { ReactorCore } from './ReactorCore.js';

export class SimulationManager {
    constructor() {
        this.core = null;
        this.history = [];
        this.running = false;
        this.animationFrameId = null;
        this.lastTimestamp = 0;

        // Simulation speed: 1.0 = real-time, 10.0 = 10× faster
        this.timeScale = 5.0;

        // History: keep ALL data from start until reset.
        // To avoid excessive memory, we record every Nth frame.
        this.recordEveryN = 3;
        this._frameCounter = 0;

        // Config defaults
        this.config = {
            fuelType: "UO2",
            enrichment: 3.5,
            rodPercent: 50,
            coolantRate: 5000,
        };

        // UI callbacks
        this.onUpdate = null;  // (snapshot, history) => void
    }

    init(fuelType, enrichment, rodPercent, coolantRate) {
        this.config = { fuelType, enrichment, rodPercent, coolantRate };
        this.reset();
    }

    reset() {
        this.stop();
        this.core = new ReactorCore(
            this.config.fuelType,
            this.config.enrichment,
            this.config.rodPercent,
            this.config.coolantRate
        );
        this.history = [];
        this.running = false;
        this.lastTimestamp = 0;
        this._frameCounter = 0;

        // Push initial state
        const snap = this.core.getSnapshot();
        this.history.push(snap);
        if (this.onUpdate) this.onUpdate(snap, this.history);
    }

    start() {
        if (!this.core) this.reset();
        if (this.running) return;

        this.running = true;
        this.lastTimestamp = 0;
        this.animationFrameId = requestAnimationFrame((t) => this._loop(t));
    }

    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    toggle() {
        this.running ? this.stop() : this.start();
    }

    get isRunning() {
        return this.running;
    }

    scram() {
        if (!this.core) return;
        this.core.triggerScram();
        if (!this.running) this.start();
    }

    updateControls(rodPercent, coolantRate) {
        if (this.core) {
            this.core.setRodPercent(rodPercent);
            this.core.setCoolantRate(coolantRate);
        }
    }

    // ── Internal loop ──
    _loop(timestamp) {
        if (!this.running) return;

        if (this.lastTimestamp === 0) {
            this.lastTimestamp = timestamp;
        }

        const wallDeltaMs = timestamp - this.lastTimestamp;

        // Skip frames that are too small
        if (wallDeltaMs > 16) {
            // Cap wall-clock delta to avoid blow-up when tab is backgrounded
            const cappedWallDelta = Math.min(wallDeltaMs, 100);
            const simDt = (cappedWallDelta / 1000) * this.timeScale;

            this.core.updateState(simDt);
            this.lastTimestamp = timestamp;

            const snap = this.core.getSnapshot();

            // Record every Nth frame to keep full history without blowing memory
            this._frameCounter++;
            if (this._frameCounter >= this.recordEveryN) {
                this.history.push(snap);
                this._frameCounter = 0;
            }

            if (this.onUpdate) this.onUpdate(snap, this.history);

            // Stop on meltdown (let the UI show the final state)
            if (snap.status === "MELTDOWN") {
                this.stop();
                return;
            }
        }

        this.animationFrameId = requestAnimationFrame((t) => this._loop(t));
    }
}
