import requests

import os
from dotenv import load_dotenv
load_dotenv()

import base64
from Remove_BG import remove_bg
from Crop_Img import process_image

async def store_image(image):
    # Remove background first
    # bg_cropped_bytes = await process_image(image)
    bg_removed_bytes = await remove_bg(bg_removed_bytes)

    #crop img

    # Encode image
    encoded_image = base64.b64encode(bg_removed_bytes)

    # Upload to imgbb
    response = requests.post(
        "https://api.imgbb.com/1/upload",
        data={
            "key": os.getenv("IMG_API"),
            "image": encoded_image
        }
    )

    print("STATUS:", response.status_code)

    print("RAW RESPONSE:", response.text)

    data = response.json()
    return data["data"]["url"]

