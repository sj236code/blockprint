import json
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models import BuildRequest, BuildStatus
from app.services import BlockPlanner, get_block_count, get_rcon_client
from app.config import get_settings

router = APIRouter(prefix="/build", tags=["build"])


@router.post("")
async def build_structure(request: BuildRequest):
    """Build a blueprint in Minecraft via RCON."""
    
    async def generate_status():
        blueprint = request.blueprint
        origin = request.origin
        
        # Initialize planner
        planner = BlockPlanner()
        
        # Generate placements
        placements = planner.generate_placements(blueprint)
        total_blocks = len(placements)
        
        # Update settings with custom origin if provided
        settings = get_settings()
        if origin:
            settings.build_origin_x = origin.x
            settings.build_origin_y = origin.y
            settings.build_origin_z = origin.z
        
        # Connect to RCON
        yield json.dumps({
            "status": "building",
            "progress": 0,
            "blocks_placed": 0,
            "total_blocks": total_blocks,
            "current_action": "Connecting to Minecraft server...",
            "logs": ["Initializing build process...", "Connecting to RCON..."]
        }) + "\n"
        
        rcon = get_rcon_client()
        if not rcon.connect():
            yield json.dumps({
                "status": "error",
                "progress": 0,
                "blocks_placed": 0,
                "total_blocks": total_blocks,
                "current_action": "Connection failed",
                "logs": ["Error: Failed to connect to Minecraft RCON"],
                "error": "Could not connect to Minecraft server. Make sure RCON is enabled."
            }) + "\n"
            return
        
        try:
            # Test connection
            if not rcon.test_connection():
                yield json.dumps({
                    "status": "error",
                    "progress": 0,
                    "blocks_placed": 0,
                    "total_blocks": total_blocks,
                    "current_action": "Connection test failed",
                    "logs": ["Error: RCON connection test failed"],
                    "error": "RCON connection test failed. Check server settings."
                }) + "\n"
                return
            
            yield json.dumps({
                "status": "building",
                "progress": 2,
                "blocks_placed": 0,
                "total_blocks": total_blocks,
                "current_action": "Connected! Starting build...",
                "logs": ["Connected to Minecraft server", f"Building {total_blocks} blocks..."]
            }) + "\n"
            
            # Generate and execute commands
            commands = list(planner.generate_commands(placements))
            blocks_placed = 0
            
            for i, command in enumerate(commands):
                try:
                    response = rcon.send_command(command)
                    blocks_placed += 1
                    
                    # Calculate progress
                    progress = min(100, int((i + 1) / len(commands) * 100))
                    
                    # Determine current action
                    if "air" in command:
                        action = "Clearing area..."
                    elif "foundation" in command or "floor" in command:
                        action = "Placing foundation..."
                    elif "door" in command:
                        action = "Placing doors..."
                    elif "glass" in command:
                        action = "Placing windows..."
                    elif "stairs" in command or "roof" in command:
                        action = "Building roof..."
                    else:
                        action = f"Placing blocks... ({blocks_placed}/{total_blocks})"
                    
                    # Yield status update every 10 blocks or on important milestones
                    if i % 10 == 0 or progress >= 100:
                        yield json.dumps({
                            "status": "building",
                            "progress": progress,
                            "blocks_placed": blocks_placed,
                            "total_blocks": total_blocks,
                            "current_action": action,
                            "logs": [f"{action} ({progress}%)"]
                        }) + "\n"
                    
                    # Small delay to prevent overwhelming the server
                    time.sleep(0.02)
                    
                except Exception as e:
                    yield json.dumps({
                        "status": "building",
                        "progress": progress,
                        "blocks_placed": blocks_placed,
                        "total_blocks": total_blocks,
                        "current_action": f"Error on block {blocks_placed}: {str(e)}",
                        "logs": [f"Warning: {str(e)}"]
                    }) + "\n"
            
            # Build complete
            yield json.dumps({
                "status": "completed",
                "progress": 100,
                "blocks_placed": blocks_placed,
                "total_blocks": total_blocks,
                "current_action": "Build complete!",
                "logs": [
                    f"Build complete! Placed {blocks_placed} blocks.",
                    f"Structure built at X:{origin.x}, Y:{origin.y}, Z:{origin.z}"
                ]
            }) + "\n"
            
        except Exception as e:
            yield json.dumps({
                "status": "error",
                "progress": 0,
                "blocks_placed": blocks_placed,
                "total_blocks": total_blocks,
                "current_action": "Build failed",
                "logs": [f"Error: {str(e)}"],
                "error": str(e)
            }) + "\n"
            
        finally:
            rcon.disconnect()
    
    return StreamingResponse(
        generate_status(),
        media_type="application/x-ndjson"
    )