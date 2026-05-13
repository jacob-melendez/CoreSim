/**
 * CoreSim — Educational Info Content
 *
 * Contains detailed descriptions of reactor components for the
 * interactive popups on the reactor model diagram and fuel rod
 * cross-section.
 */

export const REACTOR_COMPONENTS = {
    containment: {
        title: "Containment Structure",
        icon: "🏗️",
        description: "The containment structure is the outermost safety barrier of a nuclear power plant. It is a massive reinforced concrete and steel dome designed to contain any radioactive materials released during an accident.",
        details: [
            "Typically 1–1.5 meters thick with steel liner",
            "Withstands internal pressures up to ~0.5 MPa",
            "Designed to resist aircraft impacts and seismic events",
            "Houses the reactor vessel, steam generators, and primary loop",
            "Maintains negative pressure relative to atmosphere during normal operation",
        ],
        funFact: "The containment dome of a typical PWR can weigh over 65,000 tonnes."
    },

    "reactor-vessel": {
        title: "Reactor Pressure Vessel (RPV)",
        icon: "⚛️",
        description: "The reactor pressure vessel is a heavy-walled steel container that houses the nuclear fuel assemblies, control rods, and the primary coolant. It is the core of the nuclear reactor.",
        details: [
            "Made from low-alloy carbon steel, ~20 cm thick",
            "Lined with stainless steel cladding to resist corrosion",
            "Operates at ~15.5 MPa and ~320°C",
            "Contains 150–250 fuel assemblies arranged in a grid",
            "Designed for a 40–60 year operational lifespan",
        ],
        funFact: "The RPV is so heavy (400+ tonnes) that it can only be transported by barge."
    },

    "fuel-rods": {
        title: "Fuel Assemblies",
        icon: "🔶",
        description: "Fuel assemblies contain the nuclear fuel that undergoes fission. Each assembly consists of hundreds of thin fuel rods arranged in a square lattice, held in place by grid spacers.",
        details: [
            "A typical PWR has 157–264 fuel assemblies",
            "Each assembly contains ~264 fuel rods in a 17×17 grid",
            "Fuel rods are ~4 meters long and ~1 cm in diameter",
            "Fuel is uranium dioxide (UO₂) ceramic pellets",
            "Enriched to 3–5% U-235 (natural uranium is only 0.7%)",
        ],
        funFact: "A single UO₂ fuel pellet (~7g) produces as much energy as 1 tonne of coal."
    },

    "control-rods": {
        title: "Control Rods",
        icon: "🎚️",
        description: "Control rods are neutron-absorbing assemblies that regulate the fission reaction. By inserting or withdrawing them from the core, operators control the reactor's power output.",
        details: [
            "Made from neutron-absorbing materials: silver-indium-cadmium (Ag-In-Cd) or boron carbide (B₄C)",
            "Inserted from above by gravity — fail-safe design",
            "Full insertion (SCRAM) shuts down the reactor in ~2 seconds",
            "Partial insertion fine-tunes reactivity during operation",
            "A typical PWR has 50–70 control rod assemblies",
        ],
        funFact: "The word 'SCRAM' is said to stand for 'Safety Control Rod Axe Man' from the first nuclear reactor."
    },

    "steam-generator": {
        title: "Steam Generator",
        icon: "♨️",
        description: "The steam generator transfers heat from the primary (radioactive) coolant loop to the secondary (non-radioactive) loop. This is a crucial safety boundary — it keeps radioactive water separate from the steam that drives the turbine.",
        details: [
            "Contains thousands of thin U-shaped tubes (~20 mm diameter)",
            "Primary coolant (radioactive) flows inside the tubes",
            "Secondary water boils on the outside of the tubes",
            "Produces steam at ~275°C and ~6.5 MPa",
            "A typical PWR has 2–4 steam generators",
        ],
        funFact: "If laid end-to-end, the tubes in one steam generator would stretch over 100 km."
    },

    turbine: {
        title: "Turbine",
        icon: "🌀",
        description: "The turbine converts the kinetic energy of high-pressure steam into rotational mechanical energy. It spins at high speed, driving the electric generator.",
        details: [
            "Typically has high-pressure and low-pressure stages",
            "Rotates at 1500 or 1800 RPM (depending on grid frequency)",
            "Steam enters at ~275°C and exits at ~30°C",
            "Converts ~33% of thermal energy to mechanical energy",
            "Can be over 50 meters long",
        ],
        funFact: "The tip speed of turbine blades can approach the speed of sound."
    },

    generator: {
        title: "Electric Generator",
        icon: "⚡",
        description: "The generator converts the mechanical rotation of the turbine into electrical energy using electromagnetic induction. It produces the electricity that is fed into the power grid.",
        details: [
            "Produces AC electricity at 20–25 kV",
            "Output is stepped up to 110–500 kV for transmission",
            "Typical capacity: 900–1650 MW electrical",
            "Efficiency ~98% (mechanical → electrical)",
            "Uses hydrogen gas cooling for the rotor",
        ],
        funFact: "A single large nuclear generator can power over 1 million homes."
    },

    condenser: {
        title: "Condenser",
        icon: "💧",
        description: "The condenser cools and converts the exhaust steam from the turbine back into liquid water. This completes the steam cycle and allows the water to be pumped back to the steam generator.",
        details: [
            "Uses cooling water from a river, ocean, or cooling tower",
            "Contains thousands of thin tubes for heat exchange",
            "Operates under vacuum (~5 kPa) to maximize turbine efficiency",
            "Exhaust steam is cooled from ~30°C to condensate water",
            "Rejects ~65% of the reactor's thermal energy to the environment",
        ],
        funFact: "A nuclear plant's condenser can process over 50,000 litres of steam per second."
    },

    "cooling-tower": {
        title: "Cooling Tower",
        icon: "🗼",
        description: "The cooling tower removes waste heat from the condenser cooling water by evaporating a small fraction of the water into the atmosphere. The characteristic plume is water vapor, not smoke.",
        details: [
            "Natural draft towers are typically 120–200 meters tall",
            "Hyperbolic shape creates a natural chimney effect (updraft)",
            "Evaporates ~1.5% of the circulating water",
            "Can cool ~500,000 m³/hr of water",
            "The visible plume is pure water vapor — not pollution",
        ],
        funFact: "The hyperboloid shape was chosen for structural strength, not aerodynamics."
    },

    "feedwater-pump": {
        title: "Feedwater Pump",
        icon: "⬆️",
        description: "The feedwater pump pressurizes and recirculates the condensed water from the condenser back to the steam generator, completing the secondary loop cycle.",
        details: [
            "One of the most critical pumps in the secondary system",
            "Raises water pressure from ~1 MPa to ~7 MPa",
            "Driven by steam turbine or electric motor",
            "Flow rates of 500–2000 kg/s",
            "Includes feedwater heaters to improve thermodynamic efficiency",
        ],
        funFact: "Feedwater pumps consume several megawatts — a small power plant in themselves."
    },

    "primary-pump": {
        title: "Reactor Coolant Pump (RCP)",
        icon: "🔄",
        description: "The reactor coolant pump circulates the primary coolant water through the reactor vessel and steam generators. It ensures continuous heat removal from the fuel assemblies.",
        details: [
            "Each pump moves ~5,000–6,000 kg/s of coolant",
            "Motor power: 4,000–9,000 kW each",
            "A typical PWR has 2–4 RCPs (one per loop)",
            "The pump shaft seal is a critical safety component",
            "Can coast down on inertia for ~30s after power loss (flywheel)",
        ],
        funFact: "A single RCP motor is large enough to fill a two-car garage."
    },
};


export const FUEL_ROD_LAYERS = {
    fuel: {
        title: "Fuel Pellet (UO₂)",
        icon: "🟡",
        color: "#f59e0b",
        description: "The fuel pellet is a small ceramic cylinder of uranium dioxide (UO₂), where nuclear fission occurs. Each pellet is about the size of a pencil eraser but contains enormous energy.",
        details: [
            "Diameter: ~8.2 mm, Height: ~10 mm",
            "Made of sintered uranium dioxide ceramic",
            "Enriched to 3–5% U-235 (rest is U-238)",
            "Operating temperature: center ~1200°C, surface ~400°C",
            "Melting point: ~2800°C",
            "A stack of ~350 pellets fills one fuel rod",
        ],
        funFact: "One fuel pellet weighs ~7 grams but releases energy equivalent to 480 cubic meters of natural gas."
    },

    gap: {
        title: "Fuel-Cladding Gap",
        icon: "⭕",
        color: "#1e293b",
        description: "The gap between the fuel pellet and the cladding is initially filled with helium gas. It provides room for fuel swelling during irradiation and facilitates heat transfer.",
        details: [
            "Initial fill gas: helium (He) at ~2 MPa",
            "Gap width: ~80 μm (thinner than a human hair)",
            "Fills with fission gases (Xe, Kr) over time",
            "Thermal conductivity decreases as fission gases accumulate",
            "Eventually closes as fuel swells against cladding",
        ],
        funFact: "The gap conductance changes by a factor of 10 over the fuel's lifetime."
    },

    cladding: {
        title: "Cladding (Zircaloy-4)",
        icon: "🔘",
        color: "#64748b",
        description: "The cladding is a thin tube of zirconium alloy (Zircaloy) that encases the fuel pellets. It is the first barrier preventing fission products from entering the coolant.",
        details: [
            "Material: Zircaloy-4 (Zr + 1.5% Sn + 0.2% Fe + 0.1% Cr)",
            "Wall thickness: ~0.57 mm",
            "Chosen for low neutron absorption cross-section",
            "Melting point: ~1850°C",
            "Must maintain structural integrity for 3–6 years in-core",
            "Reacts with steam above ~1200°C producing hydrogen (safety concern)",
        ],
        funFact: "Zirconium was chosen because it absorbs 50× fewer neutrons than stainless steel."
    },

    coolant: {
        title: "Coolant Water",
        icon: "🔵",
        color: "#3b82f6",
        description: "Light water (H₂O) flows past the fuel rods, removing the heat generated by fission. In a PWR, this water is kept under very high pressure to prevent boiling.",
        details: [
            "Pressure: ~15.5 MPa (155 bar) — prevents boiling",
            "Inlet temperature: ~290°C",
            "Outlet temperature: ~325°C",
            "Flow velocity past fuel rods: ~5 m/s",
            "Contains dissolved boric acid (H₃BO₃) for reactivity control",
            "Also serves as neutron moderator",
        ],
        funFact: "PWR coolant is pressurized to 155 bar — about 150× atmospheric pressure."
    },

    moderator: {
        title: "Moderator (Water)",
        icon: "🌊",
        color: "#1e3a5f",
        description: "In a PWR, the coolant water also serves as the neutron moderator. It slows down fast neutrons from fission to thermal energies, making them far more likely to cause additional fissions in U-235.",
        details: [
            "Fast neutrons: ~2 MeV → Thermal neutrons: ~0.025 eV",
            "Energy reduction factor per collision: ~50%",
            "Takes ~18 collisions with hydrogen to thermalize a neutron",
            "Moderator temperature coefficient is negative (self-regulating)",
            "If water is lost, moderation stops → reactor shuts down (inherently safe)",
        ],
        funFact: "Without moderation, only 1 in 1000 neutrons would cause fission in U-235."
    },
};
