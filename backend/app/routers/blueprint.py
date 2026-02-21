import os
import sys
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services import get_ai_client, validate_blueprint
from app.models import BlueprintResponse
from app.config import get_settings
from app.utils import resize_image_for_ai

router = APIRouter(prefix="/blueprint", tags=["blueprint"])

MAX_IMAGE_DIMENSION = 1024


@router.post("", response_model=BlueprintResponse)
async def create_blueprint(
    image: UploadFile = File(...),
    style: str = Form("ghibli")
):
    """Generate a blueprint from an uploaded image."""
    settings = get_settings()

    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file (PNG, JPG, or WebP)."
        )

    # Validate file size
    content = await image.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum size is 10MB."
        )

    # Save uploaded file
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.upload_dir, f"{file_id}_{image.filename}")

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        # Resize to max 1024px before AI to reduce payload and cost
        resize_image_for_ai(file_path, max_dimension=MAX_IMAGE_DIMENSION)

        # Call AI to analyze image
        ai_client = get_ai_client()
        raw_blueprint = await ai_client.analyze_image(file_path, style)

        # Validate and clamp the blueprint
        validated_blueprint, warnings = validate_blueprint(raw_blueprint)

        return BlueprintResponse(
            success=True,
            blueprint=validated_blueprint,
            warnings=warnings,
            raw_ai_json=raw_blueprint
        )

    except HTTPException:
        raise
    except Exception as e:
        # Log full error details for debugging
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Blueprint generation failed:\n{error_details}", file=sys.stderr)
        # User-friendly message; avoid exposing internal details
        raise HTTPException(
            status_code=500,
            detail="We couldn't analyze this image. Try a clearer photo, a front-view sketch, or a different style."
        )

    finally:
        try:
            os.remove(file_path)
        except OSError:
            pass