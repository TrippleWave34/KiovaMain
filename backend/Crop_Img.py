import io
import base64
import uuid
import requests
from PIL import Image
import os

async def process_image(image):
    # Remove background
    api_key_bg = os.getenv("Remove_BG_API")
    image_content = await image.read()
    files = {"image_file": (image.filename, image_content, image.content_type)}
    data = {"format": "png", "size": "full"}
    headers = {"x-api-key": api_key_bg}

    resp = requests.post("https://api.poof.bg/v1/remove", headers=headers, files=files, data=data)
    resp.raise_for_status()
    img_bytes = resp.content  
    # raw bytes

    # Crop image
    pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    bbox = pil_image.getbbox()
    if bbox:
        left, upper, right, lower = bbox
        padding = 10
        width, height = pil_image.size
        left = max(0, left - padding)
        upper = max(0, upper - padding)
        right = min(width, right + padding)
        lower = min(height, lower + padding)
        pil_image = pil_image.crop((left, upper, right, lower))

    # Encode image to base64 for imgbb
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)
    encoded_image = base64.b64encode(buffer.read()).decode()

    # Upload to imgbb
    imgbb_key = os.getenv("IMG_API")
    response = requests.post(
        "https://api.imgbb.com/1/upload",
        data={
            "key": imgbb_key,
            "image": encoded_image
        }
    )
    response.raise_for_status()
    data = response.json()
    return data["data"]["url"]