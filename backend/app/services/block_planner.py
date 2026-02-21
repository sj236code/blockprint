from typing import List, Dict, Tuple, Generator
from app.models import Blueprint
from app.config import get_settings


class BlockPlacement:
    def __init__(self, x: int, y: int, z: int, block_type: str):
        self.x = x
        self.y = y
        self.z = z
        self.block_type = block_type
    
    def __repr__(self):
        return f"Block({self.x}, {self.y}, {self.z}, {self.block_type})"


class BlockPlanner:
    def __init__(self):
        self.settings = get_settings()
        self.placements: List[BlockPlacement] = []
    
    def generate_placements(self, blueprint: Blueprint) -> List[BlockPlacement]:
        """Generate all block placements from blueprint (single or multi-segment)."""
        self.placements = []
        style = blueprint.style
        materials = style.materials
        segments = blueprint.get_segments()

        ox = self.settings.build_origin_x
        oy = self.settings.build_origin_y
        oz = self.settings.build_origin_z

        total_width = sum(s.width_blocks for s in segments)
        max_height = max(s.wall_height_blocks for s in segments)
        segments_with_roof = [s for s in segments if s.roof]
        max_roof = max((s.roof.height_blocks for s in segments_with_roof), default=0)
        max_overhang = max((s.roof.overhang for s in segments_with_roof), default=0)
        depth = segments[0].depth_blocks if segments else 10

        self._add_clear_command(
            ox, oy, oz, total_width, max_height, max_roof, depth, max_overhang
        )

        segment_offset_x = 0
        for building in segments:
            W = building.width_blocks
            H = building.wall_height_blocks
            D = building.depth_blocks
            seg_ox = ox + segment_offset_x

            self._add_floor(seg_ox, oy, oz, W, D, materials.foundation)
            self._add_walls(seg_ox, oy, oz, W, H, D, materials.wall)
            for opening in building.openings:
                self._carve_opening(seg_ox, oy, oz, opening)
            for opening in building.openings:
                if opening.type == "door":
                    self._place_door(seg_ox, oy, oz, opening, materials.door)
                else:
                    self._place_window(seg_ox, oy, oz, opening, materials.window)
            if building.roof:
                R = building.roof.height_blocks
                overhang = building.roof.overhang
                if building.roof.type in ("gable", "hip"):
                    self._add_gable_roof(seg_ox, oy, oz, W, H, D, R, overhang, materials.roof)
                elif building.roof.type == "shed":
                    self._add_shed_roof(seg_ox, oy, oz, W, H, D, R, overhang, materials.roof)
                else:
                    self._add_gable_roof(seg_ox, oy, oz, W, H, D, R, overhang, materials.roof)
            else:
                # No roof: fill the top layer so the structure isn't open
                self._add_roof_cap(seg_ox, oy, oz, W, H, D, materials.roof)
            self._add_decorations(seg_ox, oy, oz, W, H, D, style.decor)

            segment_offset_x += W
        return self.placements
    
    def _add_clear_command(self, ox: int, oy: int, oz: int, W: int, H: int, R: int, D: int, overhang: int):
        """Add clear area command."""
        # We'll use a fill command for clearing
        self.placements.append(BlockPlacement(
            x=ox - overhang - 1,
            y=oy,
            z=oz - overhang - 1,
            block_type=f"CLEAR:{ox + W + overhang + 1},{oy + H + R + 5},{oz + D + overhang + 1}"
        ))
    
    def _add_floor(self, ox: int, oy: int, oz: int, W: int, D: int, material: str):
        """Add foundation floor."""
        for x in range(W):
            for z in range(D):
                self.placements.append(BlockPlacement(
                    x=ox + x,
                    y=oy,
                    z=oz + z,
                    block_type=material
                ))
    
    def _add_walls(self, ox: int, oy: int, oz: int, W: int, H: int, D: int, material: str):
        """Add wall shells."""
        # Front wall
        for x in range(W):
            for y in range(1, H + 1):
                self.placements.append(BlockPlacement(
                    x=ox + x,
                    y=oy + y,
                    z=oz,
                    block_type=material
                ))
        
        # Back wall
        for x in range(W):
            for y in range(1, H + 1):
                self.placements.append(BlockPlacement(
                    x=ox + x,
                    y=oy + y,
                    z=oz + D - 1,
                    block_type=material
                ))
        
        # Left wall
        for z in range(1, D - 1):
            for y in range(1, H + 1):
                self.placements.append(BlockPlacement(
                    x=ox,
                    y=oy + y,
                    z=oz + z,
                    block_type=material
                ))
        
        # Right wall
        for z in range(1, D - 1):
            for y in range(1, H + 1):
                self.placements.append(BlockPlacement(
                    x=ox + W - 1,
                    y=oy + y,
                    z=oz + z,
                    block_type=material
                ))
    
    def _add_roof_cap(self, ox: int, oy: int, oz: int, W: int, H: int, D: int, material: str):
        """Add a single layer on top of the walls to close structures that have no roof."""
        y_top = oy + H + 1
        for x in range(W):
            for z in range(D):
                self.placements.append(BlockPlacement(
                    x=ox + x,
                    y=y_top,
                    z=oz + z,
                    block_type=material
                ))
    
    def _carve_opening(self, ox: int, oy: int, oz: int, opening):
        """Carve out an opening (replace with air). Doors are always 1 block wide and 2 blocks tall in the build."""
        w = 1 if opening.type == "door" else opening.w
        h = 2 if opening.type == "door" else opening.h
        for dx in range(w):
            for dy in range(h):
                self.placements.append(BlockPlacement(
                    x=ox + opening.x + dx,
                    y=oy + 1 + opening.y + dy,
                    z=oz,
                    block_type="air"
                ))
    
    def _place_door(self, ox: int, oy: int, oz: int, opening, material: str):
        """Place a door."""
        # Place door at bottom of opening
        self.placements.append(BlockPlacement(
            x=ox + opening.x,
            y=oy + 1,
            z=oz,
            block_type=f"{material}[half=lower]"
        ))
        if opening.h > 1:
            self.placements.append(BlockPlacement(
                x=ox + opening.x,
                y=oy + 2,
                z=oz,
                block_type=f"{material}[half=upper]"
            ))
    
    def _place_window(self, ox: int, oy: int, oz: int, opening, material: str):
        """Place a window."""
        for dx in range(opening.w):
            for dy in range(opening.h):
                self.placements.append(BlockPlacement(
                    x=ox + opening.x + dx,
                    y=oy + 1 + opening.y + dy,
                    z=oz,
                    block_type=material
                ))
    
    def _add_gable_roof(self, ox: int, oy: int, oz: int, W: int, H: int, D: int, R: int, overhang: int, material: str):
        """Add a gable roof with correctly oriented stair blocks."""
        for i in range(R):
            y = oy + H + 1 + i
            # Each layer steps inward by i blocks on the X axis (gable ridge runs Z axis)
            x1 = ox - overhang + i
            x2 = ox + W - 1 + overhang - i
            z1 = oz - overhang
            z2 = oz + D - 1 + overhang

            for z in range(z1, z2 + 1):
                for x in range(x1, x2 + 1):
                    # Determine if this block is on the perimeter of this layer
                    on_west  = (x == x1)
                    on_east  = (x == x2)
                    on_north = (z == z1)
                    on_south = (z == z2)

                    if on_west:
                        # Bottom step faces west (away from building center)
                        block = f"{material}[facing=east,half=bottom,shape=straight]"
                    elif on_east:
                        block = f"{material}[facing=west,half=bottom,shape=straight]"
                    elif on_north:
                        block = f"{material}[facing=north,half=bottom,shape=straight]"
                    elif on_south:
                        block = f"{material}[facing=south,half=bottom,shape=straight]"
                    else:
                        # Interior fill — use a solid block so there are no gaps
                        block = "spruce_planks"

                    self.placements.append(BlockPlacement(x=x, y=y, z=z, block_type=block))
    
    def _add_shed_roof(self, ox: int, oy: int, oz: int, W: int, H: int, D: int, R: int, overhang: int, material: str):
        """Add a shed (slant) roof: slanted side = stairs, vertical side = solid blocks."""
        for i in range(R):
            y = oy + H + 1 + i
            x1 = ox - overhang + i
            x2 = ox + W - 1 + overhang
            z1 = oz - overhang
            z2 = oz + D - 1 + overhang
            for z in range(z1, z2 + 1):
                for x in range(x1, x2 + 1):
                    on_west = x == x1   # slanted edge (steps up) -> stairs
                    on_east = x == x2   # vertical side -> solid blocks
                    on_north = z == z1
                    on_south = z == z2
                    if on_west:
                        block = f"{material}[facing=east,half=bottom,shape=straight]"
                    elif on_east or on_north or on_south:
                        block = "spruce_planks"
                    else:
                        block = "spruce_planks"
                    self.placements.append(BlockPlacement(x=x, y=y, z=z, block_type=block))
    
    def _add_decorations(self, ox: int, oy: int, oz: int, W: int, H: int, D: int, decor: List[str]):
        """Add decorative elements."""
        # Add lanterns near doors
        if "lantern" in decor:
            # Place lanterns at corners
            self.placements.append(BlockPlacement(
                x=ox - 1,
                y=oy + 2,
                z=oz - 1,
                block_type="lantern[hanging=false]"
            ))
            self.placements.append(BlockPlacement(
                x=ox + W,
                y=oy + 2,
                z=oz - 1,
                block_type="lantern[hanging=false]"
            ))
        
        # Add leaves around the building
        if "leaves" in decor:
            for _ in range(5):
                import random
                lx = ox + random.randint(-2, W + 1)
                lz = oz + random.randint(-2, D + 1)
                self.placements.append(BlockPlacement(
                    x=lx,
                    y=oy + 1,
                    z=lz,
                    block_type="oak_leaves[persistent=true]"
                ))
    
    def generate_commands(self, placements: List[BlockPlacement]) -> Generator[str, None, None]:
        """Generate Minecraft commands from placements."""
        # Group placements by block type for optimization
        by_type: Dict[str, List[BlockPlacement]] = {}
        clear_command = None
        
        for p in placements:
            if p.block_type.startswith("CLEAR:"):
                clear_command = p.block_type
                continue
            
            if p.block_type not in by_type:
                by_type[p.block_type] = []
            by_type[p.block_type].append(p)
        
        # Yield clear command first
        if clear_command:
            coords = clear_command.replace("CLEAR:", "").split(",")
            yield f"/fill {placements[0].x} {placements[0].y} {placements[0].z} {coords[0]} {coords[1]} {coords[2]} air"
        
        # Yield setblock commands
        for block_type, blocks in by_type.items():
            for block in blocks:
                yield f"/setblock {block.x} {block.y} {block.z} {block_type}"


def get_block_count(blueprint) -> int:
    """Estimate total block count for a blueprint (single or multi-segment)."""
    segments = blueprint.get_segments()
    total = 0
    for building in segments:
        floor = building.width_blocks * building.depth_blocks
        wall_perimeter = 2 * (building.width_blocks + building.depth_blocks)
        walls = wall_perimeter * building.wall_height_blocks
        if building.roof and building.roof.type in ("gable", "hip", "shed"):
            roof = building.width_blocks * building.depth_blocks * building.roof.height_blocks // 2
        else:
            roof = building.width_blocks * building.depth_blocks  # one cap layer
        total += floor + walls + roof
    total += len(blueprint.style.decor) * 5
    return total
