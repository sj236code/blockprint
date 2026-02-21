from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Literal, Optional
from enum import Enum


class OpeningType(str, Enum):
    DOOR = "door"
    WINDOW = "window"


class RoofType(str, Enum):
    GABLE = "gable"
    HIP = "hip"


class Opening(BaseModel):
    type: OpeningType
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    w: int = Field(..., ge=1)
    h: int = Field(..., ge=1)


class Roof(BaseModel):
    type: RoofType
    height_blocks: int = Field(..., ge=2, le=8)
    overhang: int = Field(..., ge=0, le=2)


class Materials(BaseModel):
    foundation: str = "mossy_cobblestone"
    wall: str = "oak_planks"
    trim: str = "stripped_oak_log"
    roof: str = "spruce_stairs"
    window: str = "glass_pane"
    door: str = "oak_door"


class Style(BaseModel):
    theme: str = "ghibli"
    materials: Materials = Field(default_factory=Materials)
    decor: List[str] = Field(default_factory=list)
    variation: float = Field(0.15, ge=0, le=1)


class Building(BaseModel):
    width_blocks: int = Field(..., ge=6, le=80)
    wall_height_blocks: int = Field(..., ge=4, le=60)
    depth_blocks: int = Field(..., ge=6, le=60)
    roof: Optional[Roof] = None  # Omit or null when segment has no triangular roof (e.g. connector)
    openings: List[Opening] = Field(default_factory=list)


class Blueprint(BaseModel):
    view: Literal["front"] = "front"
    building: Optional[Building] = None
    segments: Optional[List[Building]] = None
    style: Style = Field(default_factory=Style)

    @model_validator(mode="after")
    def require_building_or_segments(self):
        if not self.segments and not self.building:
            raise ValueError("Either 'building' or 'segments' must be set")
        if self.segments and len(self.segments) == 0:
            raise ValueError("'segments' must not be empty when set")
        if self.building is None and self.segments:
            object.__setattr__(self, "building", self.segments[0])
        return self

    def get_segments(self) -> List[Building]:
        """Return the list of building segments (single building as one segment)."""
        if self.segments:
            return self.segments
        if self.building:
            return [self.building]
        return []


class BlueprintResponse(BaseModel):
    success: bool
    blueprint: Blueprint
    warnings: List[str] = Field(default_factory=list)
    raw_ai_json: Optional[dict] = None


class Origin(BaseModel):
    x: int
    y: int
    z: int


class BuildRequest(BaseModel):
    blueprint: Blueprint
    origin: Origin


class BuildStatus(BaseModel):
    status: Literal["idle", "building", "completed", "error"]
    progress: float = Field(0, ge=0, le=100)
    blocks_placed: int = 0
    total_blocks: int = 0
    current_action: str = ""
    logs: List[str] = Field(default_factory=list)
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str