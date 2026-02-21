import asyncio
import ast
import base64
import json
import os
import re
from typing import Optional
import httpx
from app.config import get_settings

# #region agent log
# Calculate workspace root: go up from backend/app/services/ai_client.py -> backend -> workspace root
_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # backend/
_workspace_root = os.path.dirname(_backend_dir)  # workspace root
DEBUG_LOG_PATH = os.path.join(_workspace_root, ".cursor", "debug.log")
# #endregion

STYLE_PALETTES = {
    "ghibli": {
        "foundation": "mossy_cobblestone",
        "wall": "oak_planks",
        "trim": "stripped_oak_log",
        "roof": "spruce_stairs",
        "window": "glass_pane",
        "door": "oak_door",
    },
    "medieval": {
        "foundation": "cobblestone",
        "wall": "stone_bricks",
        "trim": "oak_log",
        "roof": "stone_brick_stairs",
        "window": "glass_pane",
        "door": "iron_door",
    },
    "modern": {
        "foundation": "smooth_stone",
        "wall": "white_concrete",
        "trim": "iron_block",
        "roof": "smooth_stone_slab",
        "window": "tinted_glass",
        "door": "iron_door",
    },
    "fantasy": {
        "foundation": "purpur_block",
        "wall": "end_stone_bricks",
        "trim": "purpur_pillar",
        "roof": "purpur_stairs",
        "window": "magenta_stained_glass_pane",
        "door": "dark_oak_door",
    },
}

def _log_debug(message: str, data: dict):
    """Write debug log entry."""
    import sys
    log_entry = {
        "location": "ai_client.py",
        "message": message,
        "data": data,
        "timestamp": int(__import__("time").time() * 1000)
    }
    try:
        os.makedirs(os.path.dirname(DEBUG_LOG_PATH), exist_ok=True)
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        # Fallback: also try writing to backend directory and stderr
        try:
            fallback_path = os.path.join(_backend_dir, "debug.log")
            with open(fallback_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
        except:
            try:
                print(f"[DEBUG] {message}: {json.dumps(data)}", file=sys.stderr)
            except:
                pass  # Don't fail on logging errors


def _extract_outer_json_object(text: str) -> Optional[str]:
    """Find the outermost {...} in text by bracket matching. Handles nested braces."""
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    in_string = False
    escape = False
    quote_char = None
    i = start
    while i < len(text):
        c = text[i]
        if escape:
            escape = False
            i += 1
            continue
        if c == "\\" and in_string:
            escape = True
            i += 1
            continue
        if not in_string:
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
            elif c in ('"', "'"):
                in_string = True
                quote_char = c
        else:
            if c == quote_char:
                in_string = False
        i += 1
    return None


def _remove_trailing_commas(json_str: str) -> str:
    """Remove trailing commas before ] or } (invalid in JSON but common in LLM output)."""
    return re.sub(r",(\s*[}\]])", r"\1", json_str)


def _repair_truncated_json(json_str: str) -> str:
    """Attempt to repair JSON truncated mid-output (e.g. 'y':  with no value)."""
    s = json_str.rstrip()
    if not s:
        return s
    # If ends with ": " or "," (incomplete value), append 0 so we have a value
    if re.search(r':\s*$', s) or (s.endswith(",") and '"' not in s[-10:]):
        s = re.sub(r',\s*$', '', s)
        s = re.sub(r':\s*$', ': 0', s)
    # Count unclosed brackets (ignore inside strings)
    depth_curly = 0
    depth_square = 0
    in_string = False
    escape = False
    quote_char = None
    i = 0
    while i < len(s):
        c = s[i]
        if escape:
            escape = False
            i += 1
            continue
        if c == '\\' and in_string:
            escape = True
            i += 1
            continue
        if not in_string:
            if c == '{':
                depth_curly += 1
            elif c == '}':
                depth_curly -= 1
            elif c == '[':
                depth_square += 1
            elif c == ']':
                depth_square -= 1
            elif c in ('"', "'"):
                in_string = True
                quote_char = c
        else:
            if c == quote_char:
                in_string = False
        i += 1
    # Close any open arrays then objects
    s += ']' * depth_square + '}' * depth_curly
    return s


def _extract_json_from_content(content: str) -> dict:
    """Extract and parse JSON from model output, handling various formats."""
    # #region agent log
    _log_debug("_extract_json_from_content: raw input", {"content_length": len(content), "content_preview": content[:200]})
    # #endregion
    
    # Normalize: strip BOM and whitespace
    content = content.strip().lstrip("\ufeff")
    
    # Strategy 1: Direct parsing
    try:
        result = json.loads(content)
        # #region agent log
        _log_debug("_extract_json_from_content: direct json.loads success", {})
        # #endregion
        return result
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Extract from markdown code blocks
    extracted = content
    if "```json" in content:
        parts = content.split("```json")
        if len(parts) > 1:
            extracted = parts[1].split("```")[0].strip().lstrip("\ufeff")
    elif "```" in content:
        parts = content.split("```")
        if len(parts) > 1:
            extracted = parts[1].split("```")[0].strip().lstrip("\ufeff")
    
    # #region agent log
    _log_debug("_extract_json_from_content: after markdown strip", {"content_length": len(extracted), "content_preview": extracted[:200]})
    # #endregion
    
    # Strategy 3: Bracket-matching extract (find outermost { ... })
    json_error = None
    bracket_extracted = _extract_outer_json_object(extracted)
    candidates = [extracted]
    if bracket_extracted and bracket_extracted != extracted:
        candidates.append(bracket_extracted)
    
    for candidate in candidates:
        # Strategy 3a: Try as-is
        try:
            result = json.loads(candidate)
            # #region agent log
            _log_debug("_extract_json_from_content: json.loads success", {})
            # #endregion
            return result
        except json.JSONDecodeError as e:
            json_error = e
        # Strategy 3b: Remove trailing commas then parse
        try:
            fixed = _remove_trailing_commas(candidate)
            result = json.loads(fixed)
            # #region agent log
            _log_debug("_extract_json_from_content: json.loads after trailing comma fix success", {})
            # #endregion
            return result
        except json.JSONDecodeError:
            pass
        # Strategy 3c: Python literal eval (single quotes)
        try:
            result = ast.literal_eval(candidate)
            if isinstance(result, dict):
                # #region agent log
                _log_debug("_extract_json_from_content: ast.literal_eval success", {})
                # #endregion
                return result
        except (ValueError, SyntaxError):
            pass
        # Strategy 3d: Repair truncated JSON (close brackets, complete incomplete "key": )
        try:
            repaired = _repair_truncated_json(candidate)
            result = json.loads(repaired)
            # #region agent log
            _log_debug("_extract_json_from_content: repair_truncated then json.loads success", {})
            # #endregion
            return result
        except json.JSONDecodeError:
            pass
    
    # All strategies failed - write full content to file for debugging
    dump_path = os.path.join(_backend_dir, "last_gemini_response.txt")
    try:
        with open(dump_path, "w", encoding="utf-8") as f:
            f.write(extracted)
    except Exception:
        pass
    preview = extracted[:500] if len(extracted) > 500 else extracted
    json_err_msg = str(json_error) if json_error else "N/A"
    # #region agent log
    _log_debug("_extract_json_from_content: all strategies failed", {"full_content": extracted[:1000]})
    # #endregion
    raise ValueError(
        f"AI returned invalid JSON. Full response saved to {dump_path}. "
        f"Preview: {preview[:200]}... JSON error: {json_err_msg}"
    ) from None


def _get_blueprint_prompt(style: str) -> str:
    palette = STYLE_PALETTES.get(style, STYLE_PALETTES["ghibli"])
    
    return f"""
    Analyze the uploaded image of a front-view building outline (pen on white paper). Infer a simple parametric building.
    Scale conservatively — a typical small house fits in 12×8 blocks footprint. Only go larger if the drawing clearly shows a very wide or tall structure.

Rules:
- view must be "front"
- width_blocks: integer 8..20, default 14 if unsure
- wall_height_blocks: integer 4..10, default 6 if unsure
- depth_blocks: integer 6..14, default 8 if unsure
- roof.type in ["gable","flat","hip"]
- roof.height_blocks: integer 2..8, default 4 if unsure
- roof.overhang: integer 0..2, default 1 if unsure
- openings: include a door if visible; include windows if visible; else empty list. Door is always 1 block wide and 2 blocks tall (w: 1, h: 2).
- style.theme must be "{style}"
- You MUST use exactly these blocks and no others:
  foundation: {palette['foundation']}
  wall:       {palette['wall']}
  trim:       {palette['trim']}
  roof:       {palette['roof']}
  window:     {palette['window']}
  door:       {palette['door']}
- Return ONLY JSON. No markdown. No extra keys.

JSON Schema:
{{
  "view": "front",
  "building": {{
    "width_blocks": 14,
    "wall_height_blocks": 6,
    "depth_blocks": 8,
    "roof": {{
      "type": "gable",
      "height_blocks": 4,
      "overhang": 1
    }},
    "openings": [
      {{"type":"door","x":6,"y":0,"w":1,"h":2}},
      {{"type":"window","x":2,"y":2,"w":2,"h":2}}
    ]
  }},
  "style": {{
    "theme": "{style}",
    "materials": {{
      "foundation": "{palette['foundation']}",
      "wall": "{palette['wall']}",
      "trim": "{palette['trim']}",
      "roof": "{palette['roof']}",
      "window": "{palette['window']}",
      "door": "{palette['door']}"
    }},
    "decor": ["lantern", "leaves"],
    "variation": 0.15
  }}
}}"""


class AIClient:
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.ai_api_key
        self.model = self.settings.ai_model
        self.provider = (self.settings.ai_provider or "openai").strip().lower()

    def _analyze_image_gemini_sync(self, image_path: str, style: str) -> dict:
        """Synchronous Gemini API call (run in thread from async)."""
        for base in (_backend_dir, os.getcwd()):
            try:
                with open(os.path.join(base, "last_gemini_response.txt"), "w", encoding="utf-8") as f:
                    f.write("GEMINI_CALL_STARTED")
            except Exception:
                pass
        from google import genai
        from google.genai import types

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        # Determine MIME type from extension
        mime_type = "image/jpeg"
        if image_path.lower().endswith(".png"):
            mime_type = "image/png"
        elif image_path.lower().endswith(".webp"):
            mime_type = "image/webp"

        client = genai.Client(api_key=self.api_key)
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        prompt = (
            "You are a blueprint extraction engine. Your response must be exactly one JSON object, "
            "no other text, no markdown code blocks, no explanation. Use double quotes for all keys and strings.\n\n"
            + _get_blueprint_prompt(style)
        )

        try:
            response = client.models.generate_content(
                model=self.model,
                contents=[image_part, prompt],
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=4096,
                ),
            )
        except Exception as api_error:
            # #region agent log
            _log_debug("_analyze_image_gemini_sync: API call failed", {"error": str(api_error), "error_type": type(api_error).__name__})
            # #endregion
            for base in (_backend_dir, os.getcwd()):
                try:
                    with open(os.path.join(base, "last_gemini_response.txt"), "w", encoding="utf-8") as f:
                        f.write(f"API_ERROR: {type(api_error).__name__}: {api_error}")
                except Exception:
                    pass
            raise ValueError(f"Gemini API error: {str(api_error)}") from api_error
        
        # Check for errors in response
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
            if hasattr(response.prompt_feedback, 'block_reason') and response.prompt_feedback.block_reason:
                raise ValueError(f"Gemini blocked the request: {response.prompt_feedback.block_reason}")
        
        content = response.text
        # #region agent log
        _log_debug("_analyze_image_gemini_sync: raw response", {"has_content": bool(content), "content_length": len(content) if content else 0, "content_preview": content[:300] if content else None, "response_type": type(response).__name__})
        # #endregion
        if not content:
            # Check if there are candidates with content
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts'):
                        parts_text = []
                        for part in candidate.content.parts:
                            if hasattr(part, 'text'):
                                parts_text.append(part.text)
                        if parts_text:
                            content = "".join(parts_text)
                            # #region agent log
                            _log_debug("_analyze_image_gemini_sync: extracted from candidates", {"content_preview": content[:300]})
                            # #endregion
            
            if not content:
                for base in (_backend_dir, os.getcwd()):
                    try:
                        with open(os.path.join(base, "last_gemini_response.txt"), "w", encoding="utf-8") as f:
                            f.write("EMPTY_RESPONSE")
                    except Exception:
                        pass
                raise ValueError("Gemini returned empty response")
        
        # Always write last response to file for debugging (overwritten each request)
        for base in (_backend_dir, os.getcwd()):
            try:
                with open(os.path.join(base, "last_gemini_response.txt"), "w", encoding="utf-8") as f:
                    f.write(content)
            except Exception:
                pass
        
        return _extract_json_from_content(content)

    async def analyze_image(self, image_path: str, style: str = "ghibli") -> dict:
        """Analyze building image and return blueprint JSON."""
        if not self.api_key:
            return self._get_mock_blueprint(style)

        if self.provider == "gemini":
            return await asyncio.to_thread(
                self._analyze_image_gemini_sync,
                image_path,
                style,
            )

        # OpenAI
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        system_prompt = "You are a blueprint extraction engine. Return ONLY valid JSON that matches the schema exactly."
        user_prompt = _get_blueprint_prompt(style)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": user_prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_data}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.2,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return _extract_json_from_content(content)
    
    def _get_mock_blueprint(self, style: str) -> dict:
        """Return a mock blueprint for testing."""
        return {
            "view": "front",
            "building": {
                "width_blocks": 24,
                "wall_height_blocks": 12,
                "depth_blocks": 10,
                "roof": {
                    "type": "gable",
                    "height_blocks": 7,
                    "overhang": 1
                },
                "openings": [
                    {"type": "door", "x": 11, "y": 0, "w": 1, "h": 2},
                    {"type": "window", "x": 4, "y": 5, "w": 3, "h": 3},
                    {"type": "window", "x": 17, "y": 5, "w": 3, "h": 3}
                ]
            },
            "style": {
                "theme": style,
                "materials": {
                    "foundation": "mossy_cobblestone",
                    "wall": "oak_planks",
                    "trim": "stripped_oak_log",
                    "roof": "spruce_stairs",
                    "window": "glass_pane",
                    "door": "oak_door"
                },
                "decor": ["lantern", "leaves", "flower_pot"],
                "variation": 0.15
            }
        }


# Singleton instance
_ai_client: Optional[AIClient] = None


def get_ai_client() -> AIClient:
    global _ai_client
    if _ai_client is None:
        _ai_client = AIClient()
    return _ai_client
