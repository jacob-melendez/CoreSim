#Core simulation logic

from Old Stuff.equations import (
    calc_k_eff,
    calc_reactivity,
    evolve_flux,
    calc_power_output,
    calc_coolant_removal,
    calc_temp_change
)
from Old Stuff.Config import DEFAULT_CORE_HEAT_CAPACITY, DEFAULT_INITIAL_TEMP, DEFAULT_INITIAL_FLUX, MELTDOWN_TEMP, SCRAM_REACTIVITY

class ReactorCore:
    def __init__(self, fuel_type: str, enrichment: float, rod_percent: float, coolant_rate: float):
        self.fuel_type = fuel_type
        self.enrichment = enrichment
        self.rod_percent = rod_percent
        self.coolant_rate = coolant_rate

        self.time = 0
        self.temperature = DEFAULT_INITIAL_TEMP
        self.flux = DEFAULT_INITIAL_FLUX
        self.power_output = 0
        self.reactivity = 0
        self.status = "SAFE"

    def update_state(self, dt: float):
        """Advance simulation by dt seconds."""
        k_eff = calc_k_eff(self.fuel_type, self.enrichment, self.rod_percent)
        self.reactivity = calc_reactivity(k_eff)
        self.flux = evolve_flux(self.flux, self.reactivity)
        self.power_output = calc_power_output(self.flux, self.enrichment)

        q_cool = calc_coolant_removal(self.temperature, self.coolant_rate)
        delta_temp = calc_temp_change(self.power_output, q_cool, DEFAULT_CORE_HEAT_CAPACITY, dt)
        self.temperature += delta_temp

        self.time += dt
        self.check_status()

    def check_status(self):
        """Update reactor status based on safety limits."""
        if self.temperature > MELTDOWN_TEMP:
            self.status = "MELTDOWN"
        elif self.reactivity > SCRAM_REACTIVITY:
            self.status = "SCRAM"
        elif self.temperature > 900:
            self.status = "WARNING"
        else:
            self.status = "SAFE"

    def to_dict(self):
        """Return a snapshot of current state."""
        return {
            "time": self.time,
            "temperature": self.temperature,
            "flux": self.flux,
            "power_output": self.power_output,
            "reactivity": self.reactivity,
            "status": self.status,
            "rod_percent": self.rod_percent,
            "coolant_rate": self.coolant_rate,
            "enrichment": self.enrichment,
            "fuel_type": self.fuel_type
        }
