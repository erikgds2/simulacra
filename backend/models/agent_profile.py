from pydantic import BaseModel, Field
from typing import Literal
import uuid


class AgentProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    state: Literal["S", "E", "I", "R"] = "S"
    credibility: float = Field(default=0.5, ge=0.0, le=1.0)
    reach: int = Field(default=10, ge=1)
    bias: float = Field(default=0.0, ge=-1.0, le=1.0)
    platform: Literal["twitter", "whatsapp", "facebook", "news"] = "twitter"
    tick_exposed: int | None = None
    tick_infected: int | None = None
