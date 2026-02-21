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
        """Generate all block placements from blueprint."""
        self.placements = []
        
        building = blueprint.building
        style = blueprint.style
        materials = style.materials
        
        # Get origin
        ox = self.settings.build_origin_x
        oy = self.settings.build_origin_y
        oz = self.settings.build_origin_z
        
        W = building.width_blocks
        H = building.wall_height_blocks
        D = building.depth_blocks
        R = building.roof.height_blocks
        overhang = building.roof.overhang
        
        # 1. Clear area
        self._add_clear_command(ox, oy, oz, W, H, R, D, overhang)
        
        # 2. Foundation/Floor
        self._add_floor(ox, oy, oz, W, D, materials.foundation)
        
        # 3. Walls (shell)
        self._add_walls(ox, oy, oz, W, H, D, materials.wall)
        
        # 4. Carve openings
        for opening in building.openings:
            self._carve_opening(ox, oy, oz, opening)
        
        # 5. Place doors and windows
        for opening in building.openings:
            if opening.type == "door":
                self._place_door(ox, oy, oz, opening, materials.door)
            else:
                self._place_window(ox, oy, oz, opening, materials.window)
        
        # 6. Build roof
        if building.roof.type == "gable":
            self._add_gable_roof(ox, oy, oz, W, H, D, R, overhang, materials.roof)
        elif building.roof.type == "flat":
            self._add_flat_roof(ox, oy, oz, W, H, D, overhang, materials.roof)
        
        # 7. Add decorations
        self._add_decorations(ox, oy, oz, W, H, D, style.decor)
        
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
        """Add a gable roof."""
        for i in range(R):
            y = oy + H + 1 + i
            x1 = ox - overhang + i
            x2 = ox + W + overhang - 1 - i
            
            for x in range(x1, x2 + 1):
                for z in range(oz - overhang, oz + D + overhang):
                    self.placements.append(BlockPlacement(
                        x=x,
                        y=y,
                        z=z,
                        block_type=material
                    ))
    
    def _add_flat_roof(self, ox: int, oy: int, oz: int, W: int, H: int, D: int, overhang: int, material: str):
        """Add a flat roof."""
        y = oy + H + 1
        for x in range(ox - overhang, ox + W + overhang):
            for z in range(oz - overhang, oz + D + overhang):
                self.placements.append(BlockPlacement(
                    x=x,
                    y=y,
                    z=z,
                    block_type=material
                ))
    
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
    """Estimate total block count for a blueprint."""
    building = blueprint.building
    
    # Floor
    floor = building.width_blocks * building.depth_blocks
    
    # Walls (approximate)
    wall_perimeter = 2 * (building.width_blocks + building.depth_blocks)
    walls = wall_perimeter * building.wall_height_blocks
    
    # Roof (approximate)
    if building.roof.type == "gable":
        roof = building.width_blocks * building.depth_blocks * building.roof.height_blocks // 2
    else:
        roof = building.width_blocks * building.depth_blocks
    
    # Decorations
    decor = len(blueprint.style.decor) * 5
    
    return floor + walls + roof + decor
