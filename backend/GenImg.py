import os
import requests
import base64
import uuid
import mimetypes

from google import genai
from google.genai import types


def _guess_mime(path: str) -> str:
    mime, _ = mimetypes.guess_type(path)
    return mime or "image/jpeg"


def _load_image_bytes(ref: str) -> tuple[bytes, str]:
    """
    ref can be:
      - a URL (http/https)
      - a local filename (e.g. "shirts.jpg")
      - a local path (absolute or relative)
    We will also try inside ./generated_outfits/
    """
    ref = (ref or "").strip()
    if not ref:
        raise FileNotFoundError("Empty image reference")

    # URL
    if ref.startswith("http://") or ref.startswith("https://"):
        r = requests.get(ref, timeout=30)
        r.raise_for_status()
        # try to use content-type from server, fallback to guess
        mime = r.headers.get("content-type", "").split(";")[0].strip() or "image/jpeg"
        return r.content, mime

    # Local file
    candidates = []

    # if they pass "generated_outfits/shirts.jpg" keep it
    candidates.append(ref)

    # also try inside generated_outfits/
    candidates.append(os.path.join("generated_outfits", ref))

    # try common small mistakes: shirt.png vs shirts.jpg, etc. (only if no extension)
    base, ext = os.path.splitext(ref)
    if not ext:
        candidates.append(os.path.join("generated_outfits", base + ".png"))
        candidates.append(os.path.join("generated_outfits", base + ".jpg"))
        candidates.append(os.path.join("generated_outfits", base + ".jpeg"))

    for path in candidates:
        if os.path.isfile(path):
            with open(path, "rb") as f:
                data = f.read()
            return data, _guess_mime(path)

    raise FileNotFoundError(
        f"Local image not found. Tried: {candidates}"
    )


async def gen_img(image_refs):
    try:
        gemini_key = os.getenv("HARDCODED_API_KEY")  # must exist in .env
        if not gemini_key:
            raise Exception("Missing HARDCODED_API_KEY in environment")

        client = genai.Client(api_key=gemini_key)

        parts = []

        parts.append(
            """
You are a fashion stylist. Generate a stylish outfit based on the following images of clothing items.

Strict Layout & Format Rules:
1. QUANTITY: Generate exactly ONE single outfit. Do NOT create a grid. Do NOT create a collage. Do NOT show multiple angles.
2. FORMAT: Vertical 9:16 Aspect Ratio (Tall Mobile Wallpaper).
3. COMPOSITION: Center the outfit. Leave white space at the top and bottom.

Strict styling Rules:
1. FIDELITY: Use EXACT textures from images.
2. POSE: Vertical ghost mannequin.
3. PHYSICS: 3D volume, realistic drapes.
4. ACCESSORIES: Anatomical placement.
5. ENVIRONMENT: Pure white background (#FFFFFF). Soft studio lighting. No body parts.
            """.strip()
        )

        for ref in image_refs:
            img_bytes, mime = _load_image_bytes(ref)
            parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))

        response = await client.aio.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=1.0,
                max_output_tokens=2048,
            ),
        )

        if hasattr(response, "generated_images") and response.generated_images:
            return response.generated_images[0].image_bytes

        # Fallback for other response shapes
        return response.candidates[0].content.parts[0].inline_data.data

    except Exception as e:
        raise Exception(f"Gemini failed: {str(e)}")


def save_image_locally(image_bytes):
    try:
        folder_path = "generated_outfits"
        os.makedirs(folder_path, exist_ok=True)

        filename = f"outfit_{uuid.uuid4().hex[:8]}.png"
        file_path = os.path.join(folder_path, filename)

        with open(file_path, "wb") as f:
            f.write(image_bytes)

        with open(file_path, "rb") as file_to_upload:
            response = requests.post(
                "https://api.imgbb.com/1/upload",
                params={"key": os.getenv("IMG_API")},
                files={"image": file_to_upload},
                timeout=60,
            )

        res_json = response.json()

        if response.status_code != 200:
            raise Exception(
                f"ImgBB Error: {res_json.get('error', {}).get('message', 'Unknown error')}"
            )

        return res_json["data"]["url"]

    except Exception as e:
        raise Exception(f"Process failed: {str(e)}")