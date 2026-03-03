import io
import base64
import requests
from PIL import Image
import os


async def process_image(image) -> str:
    """
    Pipeline:
    1. Remove background (poof.bg)
    2. Crop to content (PIL)
    3. Upload to imgbb
    Returns public image URL.
    """

    # Read image bytes once
    image_content = await image.read()
    print(f"[process_image] read {len(image_content)} bytes, filename={image.filename}, type={image.content_type}")

    # ── Step 1: Remove background ─────────────────────────────────────────────
    img_bytes = image_content  # fallback = original
    try:
        api_key_bg = os.getenv("REMOVE_BG_API")
        print(f"[process_image] Remove_BG_API key present: {bool(api_key_bg)}")

        files   = {"image_file": (image.filename or "image.jpg", image_content, image.content_type or "image/jpeg")}
        headers = {"x-api-key": api_key_bg}

        resp = requests.post(
            "https://api.poof.bg/v1/remove",
            headers=headers,
            files=files,
            data={"format": "png", "size": "full"},
            timeout=30,
        )
        print(f"[process_image] poof.bg status: {resp.status_code}")

        if resp.status_code == 200 and len(resp.content) > 1000:
            img_bytes = resp.content
            print(f"[process_image] background removed, got {len(img_bytes)} bytes")
        else:
            print(f"[process_image] bg removal failed or returned tiny image ({len(resp.content)} bytes), using original")
            print(f"[process_image] poof.bg response: {resp.text[:300]}")

    except Exception as e:
        print(f"[process_image] bg removal exception: {e} — using original image")

    # ── Step 2: Crop to bounding box ──────────────────────────────────────────
    try:
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        print(f"[process_image] image size before crop: {pil_image.size}")

        bbox = pil_image.getbbox()
        print(f"[process_image] bounding box: {bbox}")

        if bbox:
            left, upper, right, lower = bbox
            padding = 10
            w, h = pil_image.size
            left   = max(0, left   - padding)
            upper  = max(0, upper  - padding)
            right  = min(w, right  + padding)
            lower  = min(h, lower  + padding)
            pil_image = pil_image.crop((left, upper, right, lower))
            print(f"[process_image] cropped to: {pil_image.size}")
        else:
            print("[process_image] no bounding box found — image may be fully transparent, keeping original size")
            # If fully transparent after bg removal, fall back to original image
            pil_image = Image.open(io.BytesIO(image_content)).convert("RGBA")

    except Exception as e:
        print(f"[process_image] crop exception: {e} — using original image")
        pil_image = Image.open(io.BytesIO(image_content)).convert("RGBA")

    # ── Step 3: Encode and upload to imgbb ────────────────────────────────────
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)
    encoded_image = base64.b64encode(buffer.read()).decode()

    imgbb_key = os.getenv("IMG_API")
    print(f"[process_image] IMG_API key present: {bool(imgbb_key)}")

    response = requests.post(
        "https://api.imgbb.com/1/upload",
        data={"key": imgbb_key, "image": encoded_image},
        timeout=30,
    )
    print(f"[process_image] imgbb status: {response.status_code}")
    response.raise_for_status()

    url = response.json()["data"]["url"]
    print(f"[process_image] uploaded to: {url}")
    return url