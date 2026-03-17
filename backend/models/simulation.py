from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
import uuid

INTERVENCOES_VALIDAS = {"fact_check", "label", "remove"}


class SimulationConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seed_text: str = Field(..., min_length=10, max_length=2000)
    num_agents: int = Field(default=200, ge=50, le=1000)
    ticks: int = Field(default=50, ge=10, le=200)
    intervention: Optional[Literal["fact_check", "label", "remove"]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("seed_text")
    @classmethod
    def seed_nao_pode_ser_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("seed_text nao pode ser apenas espacos em branco")
        return v.strip()


class SimulationResult(BaseModel):
    simulation_id: str
    tick: int = Field(..., ge=1)
    susceptible: int = Field(..., ge=0)
    exposed: int = Field(..., ge=0)
    infected: int = Field(..., ge=0)
    recovered: int = Field(..., ge=0)
    new_infections: int = Field(..., ge=0)
    interventions_applied: list[str] = Field(default_factory=list)

    @property
    def total_agents(self) -> int:
        return self.susceptible + self.exposed + self.infected + self.recovered

    @property
    def infection_rate(self) -> float:
        total = self.total_agents
        return round(self.infected / total, 4) if total > 0 else 0.0
