import networkx as nx
import numpy as np
from typing import List
from models.agent_profile import AgentProfile
from models.simulation import SimulationConfig, SimulationResult

BETA = 0.3
SIGMA = 0.2
GAMMA = 0.1


class SimulationEngine:
    def __init__(self, config: SimulationConfig):
        self.config = config
        self.graph = nx.barabasi_albert_graph(config.num_agents, 3, seed=42)
        self.agents: List[AgentProfile] = self._init_agents()

    def _init_agents(self) -> List[AgentProfile]:
        agents = []
        platforms = ["twitter", "whatsapp", "facebook", "news"]

        for i in range(self.config.num_agents):
            agents.append(AgentProfile(
                name=f"agent_{i}",
                state="I" if i == 0 else "S",
                credibility=float(np.random.beta(2, 5)),
                reach=int(np.random.pareto(2) * 10) + 1,
                bias=float(np.random.uniform(-1, 1)),
                platform=platforms[i % len(platforms)],
                tick_infected=0 if i == 0 else None,
            ))
        return agents

    def run(self) -> List[SimulationResult]:
        results: List[SimulationResult] = []
        states = [a.state for a in self.agents]

        for tick in range(1, self.config.ticks + 1):
            new_states = states[:]
            new_infections = 0
            interventions_applied: list[str] = []

            for node in self.graph.nodes():
                current = states[node]

                if current == "S":
                    neighbors = list(self.graph.neighbors(node))
                    infected_neighbors = sum(1 for n in neighbors if states[n] == "I")
                    if infected_neighbors > 0:
                        prob = 1 - (1 - BETA) ** infected_neighbors
                        if np.random.random() < prob:
                            new_states[node] = "E"
                            new_infections += 1

                elif current == "E":
                    if np.random.random() < SIGMA:
                        new_states[node] = "I"
                        self.agents[node].tick_infected = tick

                elif current == "I":
                    if np.random.random() < GAMMA:
                        new_states[node] = "R"
                    if self.config.intervention and np.random.random() < 0.05:
                        new_states[node] = "R"
                        if self.config.intervention not in interventions_applied:
                            interventions_applied.append(self.config.intervention)

            states = new_states
            for i, agent in enumerate(self.agents):
                agent.state = states[i]

            counts = {s: states.count(s) for s in ("S", "E", "I", "R")}
            results.append(SimulationResult(
                simulation_id=self.config.id,
                tick=tick,
                susceptible=counts["S"],
                exposed=counts["E"],
                infected=counts["I"],
                recovered=counts["R"],
                new_infections=new_infections,
                interventions_applied=interventions_applied,
            ))

        return results
