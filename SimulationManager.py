#Simulation oversight

from Old Stuff.ReactorCore import Old Stuff.ReactorCore

class SimulationManager:
    def __init__(self):
        self.core = None
        self.history = []
        self.running = False

    def start_new_sim(self, fuel_type: str, enrichment: float, rod_percent: float, coolant_rate: float):
        """Initialize a new ReactorCore and clear history."""
        self.core = ReactorCore(fuel_type, enrichment, rod_percent, coolant_rate)
        self.history = []
        self.running = True

    def update(self, dt: float = 1.0):
        """Advance simulation by dt seconds."""
        if self.core and self.running and self.core.status != "MELTDOWN":
            self.core.update_state(dt)
            snapshot = self.core.to_dict()
            self.history.append(snapshot)

    def get_current_state(self) -> dict:
        """Return latest core state."""
        if self.core:
            return self.core.to_dict()
        return {}

    def get_history(self) -> list:
        """Return full simulation history (for plotting)."""
        return self.history

    def stop(self):
        """Pause simulation."""
        self.running = False

    def resume(self):
        """Resume simulation after pause."""
        if self.core and self.core.status not in ["MELTDOWN"]:
            self.running = True

    def reset(self):
        """Clear core and history entirely."""
        self.core = None
        self.history = []
        self.running = False

