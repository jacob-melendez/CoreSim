# Main UI

import streamlit as st
import time
from Old Stuff.SimulationManager import SimulationManager

# Setup
st.set_page_config(page_title="CoreSim: PWR Simulator", layout="wide")
st.title("⚛️ CoreSim: Nuclear Reactor Core Simulator")

# Session state init
if "sim_manager" not in st.session_state:
    st.session_state.sim_manager = SimulationManager()

if "is_running" not in st.session_state:
    st.session_state.is_running = False

sim = st.session_state.sim_manager

# Sidebar controls
with st.sidebar:
    st.header("🛠 Simulation Settings")
    fuel_type = st.selectbox("Fuel Type", ["UO2", "MOX"])
    enrichment = st.slider("Fuel Enrichment (%)", 1.0, 5.0, 3.5, step=0.1)
    rod_percent = st.slider("Control Rod Insertion (%)", 0, 100, 50, step=5)
    coolant_rate = st.slider("Coolant Flow Rate (L/s)", 1000, 10000, 5000, step=500)

    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("▶️ Start Simulation"):
            sim.start_new_sim(fuel_type, enrichment, rod_percent, coolant_rate)
    with col2:
        if st.button("🔄 Reset"):
            sim.reset()

    col3, col4 = st.columns(2)
    with col3:
        if st.button("⏸ Pause"):
            sim.stop()
    with col4:
        if st.button("⏩ Resume"):
            sim.resume()

# Main dashboard
if sim.core:
    st.subheader("📈 Real-Time Core Data")

    # Run update
    if st.session_state.is_running:
        sim.update(dt = 1.0)
        time.sleep(0.5)

    current = sim.get_current_state()
    history = sim.get_history()

    # Display current metrics
    cols = st.columns(4)
    cols[0].metric("Neutron Flux", f"{current['flux']:.2e} n/cm²·s")
    cols[1].metric("Core Temperature", f"{current['temperature']:.1f} °C")
    cols[2].metric("Control Rod %", f"{current['rod_percent']}%")
    cols[3].metric("Reactivity", f"{current['reactivity']:.3f}")

    # Plot historical data
    import pandas as pd
    if history:
        df = pd.DataFrame(history)

        st.line_chart(df[["time", "flux"]].set_index("time"), use_container_width=True)
        st.line_chart(df[["time", "temperature"]].set_index("time"), use_container_width=True)

else:
    st.warning("Start a simulation from the sidebar to begin.")
