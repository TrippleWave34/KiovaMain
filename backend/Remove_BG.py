import os
from dotenv import load_dotenv
from fastapi import UploadFile
load_dotenv()

import requests

async def remove_bg(image: UploadFile) -> bytes:
    try: 
        api_key = os.getenv("Remove_BG_API")
        image_content = await image.read()
        files = {
            "image_file": (image.filename, image_content, image.content_type)
        }
        data = {
            "format": "png",
            "size": "full"
        }
        headers = {
            "x-api-key": api_key
        }

        bg_response = requests.post(
            "https://api.poof.bg/v1/remove",
            headers=headers,
            files=files,
            data=data
        )
        bg_response.raise_for_status()

        return bg_response.content
    
    except Exception as e:
        print("Error removing background:", e)
        # Return the original image as fallback
        return await image.read()   
    