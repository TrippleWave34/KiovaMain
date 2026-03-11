import io
import base64
import requests
from PIL import Image
import os


async def fetch_and_process_url(image_url: str) -> str:
    """
    Pipeline for URL-shared items:
    1. Fetch image from URL
    2. Crop to bounding box (PIL)
    3. Upload to imgbb
    Returns public image URL.
    """
    # ── Step 1: Fetch image from URL ─────────────────────────────────────────
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    resp = requests.get(image_url, headers=headers, timeout=30)
    resp.raise_for_status()
    img_bytes = resp.content
    print(f"[fetch_and_process_url] fetched {len(img_bytes)} bytes from {image_url}")

    # ── Step 2: Crop to bounding box ─────────────────────────────────────────
    try:
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        print(f"[fetch_and_process_url] image size before crop: {pil_image.size}")
        bbox = pil_image.getbbox()
        if bbox:
            left, upper, right, lower = bbox
            padding = 10
            w, h = pil_image.size
            left  = max(0, left  - padding)
            upper = max(0, upper - padding)
            right = min(w, right + padding)
            lower = min(h, lower + padding)
            pil_image = pil_image.crop((left, upper, right, lower))
            print(f"[fetch_and_process_url] cropped to: {pil_image.size}")
        else:
            print("[fetch_and_process_url] no bounding box — keeping full image")
    except Exception as e:
        print(f"[fetch_and_process_url] crop exception: {e} — using original")
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

    # ── Step 3: Encode and upload to imgbb ────────────────────────────────────
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)
    encoded_image = base64.b64encode(buffer.read()).decode()

    imgbb_key = os.getenv("IMG_API")
    response = requests.post(
        "https://api.imgbb.com/1/upload",
        data={"key": imgbb_key, "image": encoded_image},
        timeout=30,
    )
    response.raise_for_status()
    url = response.json()["data"]["url"]
    print(f"[fetch_and_process_url] uploaded to: {url}")
    return url
