from fastapi import APIRouter, File, Form, UploadFile

router = APIRouter()


@router.post("/blueprint")
async def generate_blueprint(
    image: UploadFile = File(...),
    style: str = Form("ghibli"),
):
    # TODO: AI vision + validator
    return {
        "success": False,
        "message": "Blueprint generation not implemented yet",
        "style": style,
    }
