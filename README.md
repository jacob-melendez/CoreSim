<div align="center">

# ⚛️ CoreSim

### Interactive Nuclear Reactor Simulator

A browser-based Pressurized Water Reactor (PWR) simulator built for education.  
Explore neutronics, thermal-hydraulics, and reactor safety — no backend required.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-v4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 🔍 Overview

CoreSim is a client-side nuclear reactor simulator that models the fundamental physics of a Pressurized Water Reactor (PWR). It provides an interactive dashboard where users can manipulate reactor controls, observe real-time telemetry, and learn how nuclear reactors operate through hands-on experimentation.

> **Note:** CoreSim is an educational tool, not a high-fidelity nuclear engineering code. The physics are simplified to produce realistic-looking behavior at interactive timescales while teaching the core concepts accurately.

### Key Highlights

- **Zero dependencies** — runs entirely in the browser with no server, build step, or installation
- **Real-time physics** — point-kinetics neutronics, thermal-hydraulics, and Doppler feedback
- **Interactive diagrams** — clickable reactor model and fuel rod cross-section with educational popups
- **Custom safety rules** — build your own automation rules to see how safety systems protect a reactor
- **Full telemetry** — 11 live-updating charts across 4 domains with persistent history

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/CoreSim.git
cd CoreSim

# Serve the web directory (any static server works)
cd web
python3 -m http.server 8090

# Open in your browser
open http://localhost:8090
```

No `npm install`, no build tools, no API keys — just open and go.

---

## 🖥️ Dashboard Layout

The interface is organized into three columns:

| Column | Contents |
|--------|----------|
| **Left** | Reactor Controls (rod insertion, coolant flow), Safety Automation (custom rules), Expert Recommendations, System Insights |
| **Center** | Core Assembly Grid (heat-mapped), Fuel Rod Cross-Section (interactive), Nuclear Reactor Model Diagram (interactive) |
| **Right** | Real-Time Telemetry — 11 charts across Nuclear, Thermal, Hydraulic, and Environmental tabs |

---

## ⚙️ Features

### Reactor Controls
- **Control Rod Insertion** (0–100%) — lower values withdraw rods, increasing reactivity
- **Coolant Flow Rate** (500–10,000 L/s) — adjusts heat removal capacity
- **SCRAM** — emergency full rod insertion, shutting down the reactor in seconds
- **Start / Pause / Reset** — full simulation lifecycle control

### Physics Engine
The simulation models five interconnected physics domains:

| Domain | Key Equations | What It Models |
|--------|--------------|----------------|
| **Neutronics** | k_eff, reactivity (ρ), point-kinetics flux evolution | How the chain reaction is controlled |
| **Thermal** | Fission power, coolant heat removal, fuel temperature | Heat generation and removal balance |
| **Feedback** | Doppler temperature coefficient (−3×10⁻⁵ Δk/°C) | Why reactors are inherently self-regulating |
| **Hydraulic** | Primary pressure, pressurizer water level | How temperature affects system pressure |
| **Environmental** | Radiation dose rate, containment pressure, energy output | Boundary conditions and safety metrics |

**Design Targets** (at 50% rod insertion, 5000 L/s coolant):
- k_eff ≈ 1.000 (critical)
- Power ≈ 1,200 MW thermal
- Fuel Temperature ≈ 351°C
- Primary Pressure ≈ 15.5 MPa

### Interactive Reactor Model
The SVG reactor model diagram is fully interactive — click on any labeled component to open an educational popup with:
- Detailed component description
- Engineering specifications (materials, dimensions, operating conditions)
- Fun facts about real-world nuclear engineering

**Clickable components:** Containment Structure, Reactor Vessel, Fuel Assemblies, Control Rods, Steam Generator, Turbine, Generator, Condenser, Cooling Tower, Feedwater Pump, Reactor Coolant Pump

### Heat-Mapped Core Visualization
The 17×17 fuel assembly grid uses a heat-map color scale (blue → cyan → green → yellow → red) based on:
- **Global temperature** — overall fuel temperature from the physics engine
- **Local flux distribution** — cosine-shaped radial profile (hottest at center, coolest at periphery)

Control rod positions are shown as slate-colored cells with opacity proportional to insertion depth.

### Interactive Fuel Rod Cross-Section
Click any layer of the fuel rod cross-section to learn about it:
- **Fuel Pellet** (UO₂) — where fission occurs
- **Fuel-Cladding Gap** — helium fill gas
- **Cladding** (Zircaloy-4) — first safety barrier
- **Coolant Water** — heat removal medium
- **Moderator** — neutron thermalization

Layers highlight on hover with cursor feedback.

### Safety Automation Rules
Create custom IF/THEN rules to automate reactor control:

```
IF [Fuel Temperature] [rises above] [700°C] THEN [Insert rods by] [10%]
IF [Reactivity]       [rises above] [0.02]  THEN [Insert rods by] [5%]
IF [Power Output]     [rises above] [3000 MW] THEN [Increase coolant by] [1000 L/s]
```

**8 supported metrics:** Reactivity, Fuel Temp, Coolant Temp, Neutron Flux, Power Output, Pressure, Radiation Level, Startup Rate

**5 supported actions:** Insert rods, Withdraw rods, Increase coolant, Decrease coolant, Emergency SCRAM

Features:
- Rules can be toggled ON/OFF or deleted
- Fired rules glow and show a fire count
- Activity log shows timestamped rule activations
- 1-second cooldown prevents oscillation

### Real-Time Telemetry
11 live charts organized in 4 tabs:

| Tab | Charts |
|-----|--------|
| **Nuclear** | Neutron Flux (log scale), Control Rod Position, Startup Rate (SUR) |
| **Thermal** | Fuel Temperature, Coolant Temperature |
| **Hydraulic** | Primary Pressure, Coolant Flow Rate, Water Level |
| **Environmental** | Radiation Level, Containment Pressure, Energy Output |

- X-axis shows simulation time in seconds
- Hoverable tooltips with exact values
- **Full history** — data accumulates from start until Reset (no rolling window)

### Expert Recommendations
An AI-like advisory system provides context-aware guidance based on reactor state:
- **Stable Operation** — confirms safe operating parameters
- **Power Rising** — warns about supercritical conditions
- **Power Falling** — notes subcritical state
- **Warning** — suggests corrective actions
- **SCRAM Active** — explains emergency shutdown
- **Meltdown** — describes what happened and how to restart

---

## 📁 Project Structure

```
CoreSim/
├── web/                          # Application root
│   ├── index.html                # Main entry point
│   ├── css/
│   │   └── style.css             # Full design system (dark mode, glassmorphism)
│   ├── js/
│   │   ├── main.js               # App controller, event wiring, chart management
│   │   ├── equations.js          # Physics engine (neutronics, thermal-hydraulics)
│   │   ├── ReactorCore.js        # State machine, safety logic (SCRAM)
│   │   ├── SimulationManager.js  # RAF loop, history buffer, time scaling
│   │   ├── coreVisualization.js  # Canvas: heat-mapped grid + interactive cross-section
│   │   ├── recommendations.js    # Expert advisory engine
│   │   ├── reactorInfo.js        # Educational content for interactive popups
│   │   └── automationRules.js    # User-defined safety automation rules engine
│   └── assets/
│       └── reactor-model.svg     # Interactive PWR system diagram
├── Project Brief.pdf             # Project requirements document
└── README.md
```

---

## 🧪 Experiments to Try

### 1. Achieving Stable Operation
1. Start with default settings (50% rods, 5000 L/s coolant)
2. Click **Start** and watch the reactor warm up to ~351°C
3. Observe k_eff converging to 1.000 via Doppler feedback

### 2. Power Excursion and Recovery
1. Pull rods to **20%** — watch power surge
2. Observe Doppler feedback fighting the excursion
3. Push rods back to **60%** — watch controlled cooldown

### 3. Loss of Coolant (Simulated)
1. Achieve stable operation at ~350°C
2. Reduce coolant to **1000 L/s**
3. Watch temperature rise and Doppler self-regulate
4. Restore coolant to **5000 L/s** — observe recovery

### 4. Testing Safety Automation
1. Create a rule: `IF Power > 2000 MW THEN Insert rods by 15%`
2. Pull rods to **30%** to cause a power rise
3. Watch the automation kick in and stabilize the reactor
4. Check the activity log for rule firing history

### 5. Meltdown Scenario
1. Pull rods to **0%** (fully withdrawn)
2. Reduce coolant to **500 L/s**
3. Observe the cascade: flux spike → temp rise → WARNING → SCRAM → potential meltdown
4. Press **Reset** to restart

---

## 🔧 Technical Details

### Physics Model
- **Neutron kinetics:** Point-kinetics with effective generation time Λ_eff = 0.08s (delayed-neutron dominated)
- **k_eff model:** Subtractive rod worth + enrichment bonus + Doppler temperature feedback
- **Thermal:** Lumped-parameter core with configurable heat capacity (10⁸ J/°C)
- **Self-regulation:** Doppler coefficient of −3×10⁻⁵ Δk/°C ensures inherent stability

### Simulation Loop
- Runs via `requestAnimationFrame` at ~60 FPS
- Time scaling: 5× real-time (configurable)
- Physics step: variable dt, capped at 100ms wall-clock to prevent blow-up
- History recording: every 3rd frame to balance memory and resolution

### Dependencies
- [Chart.js v4](https://www.chartjs.org/) — telemetry charts (loaded via CDN)
- [Inter](https://fonts.google.com/specimen/Inter) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — typography (Google Fonts CDN)

No npm packages. No build tools. No backend.

---

## 🤝 Contributing

Contributions are welcome! Some ideas for future work:

- [ ] Xenon poisoning / samarium buildup simulation
- [ ] Delayed neutron group kinetics (6-group model)
- [ ] Animated coolant flow in the reactor model SVG
- [ ] Heat-map overlay on the reactor model diagram
- [ ] Fuel burnup tracking over extended operation
- [ ] Multiple reactor types (BWR, CANDU, RBMK)
- [ ] Scenario presets (startup sequence, load following, emergency)
- [ ] Data export (CSV download of telemetry history)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built for learning. Built for curiosity.**

*CoreSim — because understanding nuclear energy shouldn't require a PhD.*

</div>
