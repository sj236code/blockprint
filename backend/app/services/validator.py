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
    """Ensure dict structure matches Blueprint schema (building, segments, style, view)."""
    out = {"view": d.get("view", "front")}
    if "segments" in d and isinstance(d["segments"], list) and len(d["segments"]) > 0:
        out["segments"] = [_normalize_building_dict(s) for s in d["segments"]]
        out["building"] = None
    elif "building" in d:
        out["building"] = _normalize_building_dict(d["building"])
        out["segments"] = None
    else:
        out["building"] = {}
        out["segments"] = None
    if "style" in d:
        out["style"] = d["style"]
    else:
        out["style"] = {}
    return out


def _normalize_building_dict(b: dict) -> dict:
    """Normalize a single building/segment dict (openings, door 1x2, etc.)."""
    if not isinstance(b, dict):
        return b
    out = dict(b)
    if "openings" not in out:
        out["openings"] = []
    for op in out["openings"]:
        if not isinstance(op, dict):
            continue
        if "w" not in op or op.get("w") is None:
            op["w"] = 1
        if "h" not in op or op.get("h") is None:
            op["h"] = 2 if op.get("type") == "door" else 3
        if op.get("type") == "door":
            op["w"] = 1
            op["h"] = 2
    return out


def _apply_safe_defaults(data: dict) -> dict:
    """Fill missing required fields with schema defaults so validation can succeed."""
    if "segments" in data and isinstance(data["segments"], list):
        for i, seg in enumerate(data["segments"]):
            if isinstance(seg, dict):
                data["segments"][i] = _apply_building_defaults(seg)
        if "building" not in data or data["building"] is None:
            data["building"] = data["segments"][0] if data["segments"] else {}
    else:
        b = data.get("building") or {}
        data["building"] = _apply_building_defaults(b)
        if "segments" not in data:
            data["segments"] = None
    if "style" not in data:
        data["style"] = {}
    return data


def _apply_building_defaults(b: dict) -> dict:
    """Fill defaults for a single building/segment."""
    if not isinstance(b, dict):
        return b
    if "width_blocks" not in b:
        b["width_blocks"] = 24
    if "wall_height_blocks" not in b:
        b["wall_height_blocks"] = 12
    if "depth_blocks" not in b:
        b["depth_blocks"] = 10
    # Do not default roof when missing: segment has no roof (e.g. flat connector)
    if "openings" not in b:
        b["openings"] = []
    for op in b["openings"]:
        if not isinstance(op, dict):
            continue
        if "w" not in op or op.get("w") is None:
            op["w"] = 1
        if "h" not in op or op.get("h") is None:
            op["h"] = 2 if op.get("type") == "door" else 3
        if op.get("type") == "door":
            op["w"] = 1
            op["h"] = 2
    return b


class BlueprintValidator:
    """Validator for blueprint JSON; use validate_blueprint() for the main API."""

    @staticmethod
    def validate(raw: dict) -> Tuple[Blueprint, List[str]]:
        return validate_blueprint(raw)
