import requests
import os
from dotenv import load_dotenv
load_dotenv()
import base64

async def store_image(image):
    contents = await image.read()
    encoded_image = base64.b64encode(contents)

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


