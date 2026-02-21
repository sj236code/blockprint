from fastapi import APIRouter

from app.models import BuildRequest

router = APIRouter()


@router.post("/build")
async def build_in_minecraft(request: BuildRequest):
    # TODO: RCON + block planner
    return {
        "status": "pending",
        "message": "Build endpoint not implemented yet",
    }
