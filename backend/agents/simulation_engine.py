import logging
import networkx as nx
import numpy as np
from typing import List
from models.agent_profile import AgentProfile
from models.simulation import SimulationConfig, SimulationResult

logger = logging.getLogger(__name__)

# Parametros SEIR padrao — podem ser sobrescritos via SimulationConfig no futuro
BETA: float = 0.3   # taxa de transmissao por contato infectado
SIGMA: float = 0.2  # taxa de transicao Exposto -> Infectado
GAMMA: float = 0.1  # taxa de recuperacao Infectado -> Recuperado

# Reducao de BETA quando intervencao "label" esta ativa
LABEL_BETA_REDUCAO: float = 0.5
# Prob. extra de recuperacao por tick quando "remove" ou "fact_check" esta ativo
INTERVENCAO_GAMMA_BONUS: float = 0.05


class SimulationEngine:
    """Motor de simulacao SEIR em grafo Barabasi-Albert."""

    def __init__(self, config: SimulationConfig) -> None:
        self.config = config
        logger.info(
            "[simulation_engine] iniciando: %d agentes, %d ticks, intervencao=%s",
            config.num_agents, config.ticks, config.intervention
        )
        self.graph = nx.barabasi_albert_graph(config.num_agents, 3, seed=42)
        self.agents: List[AgentProfile] = self._init_agents()

    def _init_agents(self) -> List[AgentProfile]:
        platforms = ["twitter", "whatsapp", "facebook", "news"]
        agents = []
        for i in range(self.config.num_agents):
            agents.append(AgentProfile(
                name=f"agente_{i}",
                state="I" if i == 0 else "S",
                credibility=float(np.random.beta(2, 5)),
                reach=int(np.random.pareto(2) * 10) + 1,
                bias=float(np.random.uniform(-1, 1)),
                platform=platforms[i % len(platforms)],
                tick_infected=0 if i == 0 else None,
            ))
        logger.debug("[simulation_engine] %d agentes criados (agente_0 = I)", len(agents))
        return agents

    def _beta_efetivo(self) -> float:
        if self.config.intervention == "label":
            return BETA * (1 - LABEL_BETA_REDUCAO)
        return BETA

    def run(self) -> List[SimulationResult]:
        """Executa a simulacao e retorna lista de SimulationResult por tick."""
        results: List[SimulationResult] = []
        states = [a.state for a in self.agents]
        beta = self._beta_efetivo()

        for tick in range(1, self.config.ticks + 1):
            new_states = states[:]
            new_infections = 0
            interventions_applied: list[str] = []

            for node in self.graph.nodes():
                current = states[node]

                if current == "S":
                    neighbors = list(self.graph.neighbors(node))
                    k_infectados = sum(1 for n in neighbors if states[n] == "I")
                    if k_infectados > 0:
                        prob = 1 - (1 - beta) ** k_infectados
                        if np.random.random() < prob:
                            new_states[node] = "E"
                            new_infections += 1

                elif current == "E":
                    if np.random.random() < SIGMA:
                        new_states[node] = "I"
                        self.agents[node].tick_infected = tick

                elif current == "I":
                    gamma_tick = GAMMA
                    if self.config.intervention in ("remove", "fact_check"):
                        gamma_tick += INTERVENCAO_GAMMA_BONUS
                        if self.config.intervention not in interventions_applied:
                            interventions_applied.append(self.config.intervention)
                    if np.random.random() < gamma_tick:
                        new_states[node] = "R"

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

        pico = max(results, key=lambda r: r.infected)
        logger.info(
            "[simulation_engine] concluido: pico %d infectados no tick %d, %d recuperados ao final",
            pico.infected, pico.tick, results[-1].recovered
        )
        return results
