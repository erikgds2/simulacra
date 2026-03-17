from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class SimulationConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seed_text: str
    num_agents: int = Field(default=200, ge=50, le=1000)
    ticks: int = Field(default=50, ge=10, le=200)
    intervention: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SimulationResult(BaseModel):
    simulation_id: str
    tick: int
    susceptible: int
    exposed: int
    infected: int
    recovered: int
    new_infections: int
    interventions_applied: list[str] = Field(default_factory=list)
