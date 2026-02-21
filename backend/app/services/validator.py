"""Validate and clamp AI-generated blueprint JSON to the schema."""
from typing import List, Tuple
from app.models import Blueprint


def validate_blueprint(raw: dict) -> Tuple[Blueprint, List[str]]:
    """
    Validate raw AI blueprint dict and return a Blueprint model plus any warnings.
    Pydantic validation will clamp values to allowed ranges and coerce types.
    """
    warnings: List[str] = []
    # Normalize keys (AI might return different casing)
    data = _normalize_blueprint_dict(raw)
    # Let Pydantic validate and clamp; catch validation errors and surface as warnings
    try:
        blueprint = Blueprint.model_validate(data)
    except Exception as e:
        # If full validation fails, try with defaults for optional parts
        warnings.append(f"Validation adjustment: {str(e)}")
        data = _apply_safe_defaults(data)
        blueprint = Blueprint.model_validate(data)
    return blueprint, warnings


def _normalize_blueprint_dict(d: dict) -> dict:
    """Ensure dict structure matches Blueprint schema (e.g. building, style, view)."""
    out = {"view": d.get("view", "front")}
    if "building" in d:
        out["building"] = d["building"]
    else:
        out["building"] = {}
    if "style" in d:
        out["style"] = d["style"]
    else:
        out["style"] = {}
    return out


def _apply_safe_defaults(data: dict) -> dict:
    """Fill missing required fields with schema defaults so validation can succeed."""
    b = data.get("building") or {}
    if "width_blocks" not in b:
        b["width_blocks"] = 24
    if "wall_height_blocks" not in b:
        b["wall_height_blocks"] = 12
    if "depth_blocks" not in b:
        b["depth_blocks"] = 10
    if "roof" not in b:
        b["roof"] = {"type": "gable", "height_blocks": 7, "overhang": 1}
    if "openings" not in b:
        b["openings"] = []
    for op in b["openings"]:
        if not isinstance(op, dict):
            continue
        if "w" not in op or op.get("w") is None:
            op["w"] = 1
        if "h" not in op or op.get("h") is None:
            op["h"] = 4 if op.get("type") == "door" else 3
    data["building"] = b
    if "style" not in data:
        data["style"] = {}
    return data


class BlueprintValidator:
    """Validator for blueprint JSON; use validate_blueprint() for the main API."""

    @staticmethod
    def validate(raw: dict) -> Tuple[Blueprint, List[str]]:
        return validate_blueprint(raw)
