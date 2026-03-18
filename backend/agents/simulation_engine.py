import random
from typing import Generator, Literal, Optional

import networkx as nx
import numpy as np

BETA_BASE = 0.3
SIGMA = 0.3
GAMMA = 0.1

INTERVENTION_BETA: dict = {
    "fact_check": BETA_BASE * 0.5,
    "removal": BETA_BASE * 0.2,
    "counter_narrative": BETA_BASE * 0.6,
    "label_warning": BETA_BASE * 0.75,
    None: BETA_BASE,
}

S, E, I, R = "S", "E", "I", "R"


class SimulationEngine:
    def __init__(
        self,
        num_agents: int = 200,
        intervention: Optional[Literal["fact_check", "removal", "counter_narrative", "label_warning"]] = None,
        random_seed: int = 42,
    ):
        self.num_agents = num_agents
        self.intervention = intervention
        self.random_seed = random_seed
        self.beta = INTERVENTION_BETA.get(intervention, BETA_BASE)
        random.seed(random_seed)
        np.random.seed(random_seed)
        self.graph = nx.barabasi_albert_graph(num_agents, 3, seed=random_seed)
        self.states: dict[int, str] = {n: S for n in self.graph.nodes}
        patient_zero = random.choice(list(self.graph.nodes))
        self.states[patient_zero] = I

    def _count(self) -> dict:
        counts = {S: 0, E: 0, I: 0, R: 0}
        for state in self.states.values():
            counts[state] += 1
        return counts

    def _step(self) -> None:
        new_states = self.states.copy()
        for node in self.graph.nodes:
            state = self.states[node]
            if state == S:
                infected_neighbors = sum(
                    1 for nb in self.graph.neighbors(node) if self.states[nb] == I
                )
                if infected_neighbors > 0 and random.random() < 1 - (1 - self.beta) ** infected_neighbors:
                    new_states[node] = E
            elif state == E:
                if random.random() < SIGMA:
                    new_states[node] = I
            elif state == I:
                if random.random() < GAMMA:
                    new_states[node] = R
        self.states = new_states

    def run_ticks(self, max_ticks: int = 80) -> Generator[dict, None, None]:
        for tick in range(1, max_ticks + 1):
            self._step()
            counts = self._count()
            yield {
                "tick": tick,
                "S": counts[S],
                "E": counts[E],
                "I": counts[I],
                "R": counts[R],
            }
            if counts[I] == 0 and counts[E] == 0:
                break

    def run(self) -> dict:
        ticks = list(self.run_ticks())
        peak = max(ticks, key=lambda t: t["I"])
        return {
            "ticks": ticks,
            "peak_infected": peak["I"],
            "time_to_peak": peak["tick"],
        }
