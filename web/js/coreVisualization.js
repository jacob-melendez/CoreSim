/**
 * CoreSim — Core Visualization Module
 *
 * Renders the top-down fuel assembly grid with local heat-mapping
 * and the interactive fuel rod cross-section using Canvas 2D.
 */

import { FUEL_ROD_LAYERS } from './reactorInfo.js';


// ─── Heat-map color ramp ─────────────────────────────────────
// Maps a normalized value [0..1] to a color from blue → cyan → green → yellow → orange → red
function heatColor(t) {
    t = Math.max(0, Math.min(1, t));
    let r, g, b;
    if (t < 0.2) {       // blue → cyan
        const s = t / 0.2;
        r = 30;  g = Math.floor(60 + s * 160);  b = Math.floor(200 + s * 55);
    } else if (t < 0.4) { // cyan → green
        const s = (t - 0.2) / 0.2;
        r = Math.floor(30 + s * 10);  g = Math.floor(220 - s * 20);  b = Math.floor(255 - s * 155);
    } else if (t < 0.6) { // green → yellow
        const s = (t - 0.4) / 0.2;
        r = Math.floor(40 + s * 215);  g = Math.floor(200 - s * 10);  b = Math.floor(100 - s * 80);
    } else if (t < 0.8) { // yellow → orange
        const s = (t - 0.6) / 0.2;
        r = 255;  g = Math.floor(190 - s * 100);  b = Math.floor(20 - s * 10);
    } else {              // orange → red
        const s = (t - 0.8) / 0.2;
        r = 255;  g = Math.floor(90 - s * 70);  b = Math.floor(10 + s * 20);
    }
    return `rgb(${r},${g},${b})`;
}


// ═══════════════════════════════════════════════════════════════
// Core Assembly Grid (Top-Down) with Heat-Mapping
// ═══════════════════════════════════════════════════════════════
export class CoreVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 17;
        this.rodPercent = 50;
        this.fuelTemp = 290;
        this.flux = 1e14;
        this.status = "OFFLINE";

        // Pre-compute which cells are valid (not corners) and which are control rod positions
        this._validCells = [];
        this._controlRodCells = new Set();
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!this._isCorner(r, c)) {
                    this._validCells.push([r, c]);
                    if (this._isControlRodPosition(r, c)) {
                        this._controlRodCells.add(`${r},${c}`);
                    }
                }
            }
        }

        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width - 20, rect.height - 20, 400);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / (this.gridSize + 2);
        this.draw();
    }

    update(snapshot) {
        this.rodPercent = snapshot.rodPercent;
        this.fuelTemp = snapshot.fuelTemp;
        this.flux = snapshot.flux;
        this.status = snapshot.status;
        this.draw();
    }

    /**
     * Compute a local flux multiplier based on distance from center.
     * Real PWR flux follows a cosine-like distribution: highest at
     * the center, decreasing toward the periphery.
     */
    _localFluxMultiplier(row, col) {
        const mid = (this.gridSize - 1) / 2;
        const dr = (row - mid) / mid;
        const dc = (col - mid) / mid;
        const distNorm = Math.sqrt(dr * dr + dc * dc); // 0 at center, ~1 at edge
        // Cosine-like distribution: peak at center, ~30% at edge
        return 0.3 + 0.7 * Math.cos(distNorm * Math.PI / 2.2);
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cs = this.cellSize;
        const offset = cs;

        // Clear
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, w, h);

        // Compute temperature normalization:
        // At 290°C → 0, at ~1200°C → 1 (full red)
        const globalTempNorm = Math.max(0, Math.min(1, (this.fuelTemp - 290) / 910));

        // ── Draw fuel assembly grid ──
        for (const [row, col] of this._validCells) {
            const x = offset + col * cs;
            const y = offset + row * cs;
            const isControlRod = this._controlRodCells.has(`${row},${col}`);

            let color;
            if (isControlRod) {
                // Control rod positions: opacity reflects insertion depth
                const insertionAlpha = 0.3 + (this.rodPercent / 100) * 0.7;
                color = `rgba(100, 116, 139, ${insertionAlpha})`;
            } else {
                // Heat-mapped fuel assembly
                // Local temperature = global temp × local flux distribution
                const localMultiplier = this._localFluxMultiplier(row, col);
                const localHeat = globalTempNorm * localMultiplier;
                color = heatColor(localHeat);
            }

            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

            // Cell label
            if (cs > 14) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = `${Math.max(6, cs * 0.35)}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const label = isControlRod ? '▪' : '';
                ctx.fillText(label, x + cs / 2, y + cs / 2);
            }
        }

        // ── Axis labels ──
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.max(8, cs * 0.45)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < this.gridSize; i++) {
            ctx.fillText(i, offset + i * cs + cs / 2, offset / 2);
            ctx.fillText(i, offset / 2, offset + i * cs + cs / 2);
        }

        // ── Heat-map legend ──
        this._drawLegend(ctx, w, h);

        // ── Meltdown overlay ──
        if (this.status === "MELTDOWN") {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ef4444';
            ctx.font = `bold ${cs * 1.5}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☢ MELTDOWN', w / 2, h / 2);
        }
    }

    _drawLegend(ctx, w, h) {
        const legW = 12;
        const legH = Math.min(h * 0.5, 120);
        const legX = w - legW - 6;
        const legY = (h - legH) / 2;

        // Gradient bar
        for (let i = 0; i < legH; i++) {
            const t = 1 - (i / legH); // top = hot, bottom = cold
            ctx.fillStyle = heatColor(t);
            ctx.fillRect(legX, legY + i, legW, 1);
        }

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(legX, legY, legW, legH);

        // Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Hot', legX + legW + 3, legY + 6);
        ctx.fillText('Cold', legX + legW + 3, legY + legH - 2);
    }

    _isCorner(row, col) {
        const mid = Math.floor(this.gridSize / 2);
        const dr = Math.abs(row - mid);
        const dc = Math.abs(col - mid);
        return (dr + dc) > (this.gridSize * 0.75);
    }

    _isControlRodPosition(row, col) {
        return (row % 4 === 0 && col % 4 === 0) ||
               (row % 4 === 2 && col % 4 === 2);
    }
}


// ═══════════════════════════════════════════════════════════════
// Interactive Fuel Rod Cross-Section
// ═══════════════════════════════════════════════════════════════
export class CrossSectionView {
    constructor(canvasId, onLayerClick) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onLayerClick = onLayerClick || null;
        this.hoveredLayer = null;

        // Layer definitions: outer → inner
        this.layers = [
            { ratio: 1.0,  color: '#1e3a5f', hoverColor: '#2d4f7a', label: 'Moderator', key: 'moderator' },
            { ratio: 0.78, color: '#3b82f6', hoverColor: '#60a5fa', label: 'Coolant',   key: 'coolant' },
            { ratio: 0.58, color: '#64748b', hoverColor: '#94a3b8', label: 'Cladding',  key: 'cladding' },
            { ratio: 0.48, color: '#1e293b', hoverColor: '#334155', label: 'Gap',       key: 'gap' },
            { ratio: 0.42, color: '#f59e0b', hoverColor: '#fbbf24', label: 'Fuel',      key: 'fuel' },
        ];

        this._resize();
        window.addEventListener('resize', () => this._resize());

        // Click handling
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredLayer = null;
            this.canvas.style.cursor = 'default';
            this.draw();
        });
    }

    _resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width - 10, rect.height - 10, 200);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cx = size / 2;
        this.cy = size / 2;
        this.maxR = Math.min(this.cx, this.cy) - 15;
        this.draw();
    }

    _getLayerAtPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dist = Math.sqrt((mx - this.cx) ** 2 + (my - this.cy) ** 2);
        const normDist = dist / this.maxR;

        // Check layers inner → outer (fuel first, moderator last)
        for (let i = this.layers.length - 1; i >= 0; i--) {
            if (normDist <= this.layers[i].ratio) {
                return this.layers[i];
            }
        }
        return null;
    }

    _handleClick(e) {
        const layer = this._getLayerAtPoint(e);
        if (layer && this.onLayerClick) {
            const info = FUEL_ROD_LAYERS[layer.key];
            if (info) this.onLayerClick(info);
        }
    }

    _handleMouseMove(e) {
        const layer = this._getLayerAtPoint(e);
        const newKey = layer ? layer.key : null;
        if (newKey !== (this.hoveredLayer ? this.hoveredLayer.key : null)) {
            this.hoveredLayer = layer;
            this.canvas.style.cursor = layer ? 'pointer' : 'default';
            this.draw();
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, w, h);

        // Draw concentric circles (outer to inner)
        this.layers.forEach(layer => {
            const r = this.maxR * layer.ratio;
            ctx.beginPath();
            ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2);
            const isHovered = this.hoveredLayer && this.hoveredLayer.key === layer.key;
            ctx.fillStyle = isHovered ? layer.hoverColor : layer.color;
            ctx.fill();

            // Highlight border on hover
            if (isHovered) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw labels with leader lines
        const labelAngle = -Math.PI / 4;
        this.layers.forEach((layer, i) => {
            const angle = labelAngle + i * 0.35;
            const r = this.maxR * layer.ratio;
            const lx = this.cx + Math.cos(angle) * r;
            const ly = this.cy + Math.sin(angle) * r;
            const tx = this.cx + Math.cos(angle) * (this.maxR + 12);
            const ty = this.cy + Math.sin(angle) * (this.maxR + 12);

            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const isHovered = this.hoveredLayer && this.hoveredLayer.key === layer.key;
            ctx.fillStyle = isHovered ? '#fff' : '#e2e8f0';
            ctx.font = isHovered ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(layer.label, tx + 3, ty + 3);
        });

        // "Click to learn more" hint
        ctx.fillStyle = '#475569';
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click a layer to learn more', this.cx, h - 4);
    }
}
