"""
Avatar upload: resize & EXIF orientation fix.
"""
import io
from PIL import Image


MAX_SIZE = 512
JPEG_QUALITY = 85
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_BYTES = 2 * 1024 * 1024  # 2MB


def _exif_orientation(img: Image.Image) -> Image.Image:
    """Apply EXIF orientation to correct image rotation."""
    try:
        exif = img.getexif()
        if exif is None:
            return img
        orientation = exif.get(0x0112)  # Orientation tag
        if orientation is None:
            return img
        if orientation == 3:
            return img.rotate(180, expand=True)
        if orientation == 6:
            return img.rotate(270, expand=True)
        if orientation == 8:
            return img.rotate(90, expand=True)
    except Exception:
        pass
    return img


def process_avatar(uploaded_file) -> bytes | None:
    """
    Resize avatar to max 512x512, quality 85, EXIF fix.
    Returns PNG bytes or None if processing fails (caller may keep original).
    """
    try:
        img = Image.open(uploaded_file).convert("RGB")
        img = _exif_orientation(img)

        w, h = img.size
        if w > MAX_SIZE or h > MAX_SIZE:
            ratio = min(MAX_SIZE / w, MAX_SIZE / h)
            new_w = max(1, int(w * ratio))
            new_h = max(1, int(h * ratio))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        buf.seek(0)
        return buf.read()
    except Exception:
        return None
