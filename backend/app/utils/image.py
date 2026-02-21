"""Image preprocessing for AI analysis."""
from PIL import Image


def resize_image_for_ai(file_path: str, max_dimension: int = 1024) -> None:
    """
    Resize image in place so the longest side is at most max_dimension.
    Reduces payload size and cost for vision API. Keeps aspect ratio and format.
    """
    try:
        with Image.open(file_path) as img:
            img.load()
            w, h = img.size
            if w <= max_dimension and h <= max_dimension:
                return
            if w >= h:
                new_w = max_dimension
                new_h = int(h * max_dimension / w)
            else:
                new_h = max_dimension
                new_w = int(w * max_dimension / h)
            resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            fmt = img.format or "PNG"
            save_kw: dict = {}
            if fmt.upper() in ("JPEG", "JPG", "WEBP"):
                save_kw["quality"] = 90
            resized.save(file_path, format=fmt, **save_kw)
    except Exception:
        # If resize fails, leave file unchanged so AI can still try to process it
        pass