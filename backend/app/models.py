from pydantic import BaseModel


class RoofSpec(BaseModel):
    type: str  # gable | flat | hip
    height_blocks: int
    overhang: int


class Opening(BaseModel):
    type: str  # door | window
    x: int
    y: int
    w: int
    h: int


class Building(BaseModel):
    width_blocks: int
    wall_height_blocks: int
    depth_blocks: int
    roof: RoofSpec
    openings: list[Opening] = []


class Materials(BaseModel):
    foundation: str = "mossy_cobblestone"
    wall: str = "oak_planks"
    trim: str = "stripped_oak_log"
    roof: str = "spruce_stairs"
    window: str = "glass_pane"
    door: str = "oak_door"


class Style(BaseModel):
    theme: str = "ghibli"
    materials: Materials = Materials()
    decor: list[str] = []
    variation: float = 0.15


class Blueprint(BaseModel):
    view: str = "front"
    building: Building
    style: Style


class BuildOrigin(BaseModel):
    x: int
    y: int
    z: int


class BuildRequest(BaseModel):
    blueprint: Blueprint
    origin: BuildOrigin
