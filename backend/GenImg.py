import os
import requests
import base64
from google import genai
from google.genai import types
import uuid


async def gen_img(image_urls):
    try:
        Gemini_API_KEY = os.getenv("HARDCODED_API_KEY")
        client = genai.Client(api_key=Gemini_API_KEY)

        parts = []

        parts.append(
            """

            You are a fashion stylist. Generate a stylish outfit based on the following images of clothing items.Subject Reference:
            1. "dress", "purple", "sleeveless", "tulle", "knee-length", "flared skirt", "formal"
            2. "shoes", "pink", "glitter", "mary jane", "low heel", "dress shoes"
            3. "tiara", "silver", "crown", "hair accessory", "formal"
            4. "coat", "pink", "wool", "tailored", "faux fur collar", "gold buttons"
            5. "outerwear", "long sleeve", "structured fit", "pleated waist detail"
            6. "bracelets", "rose gold", "delicate chain", "lotus charm", "heart charm"
            7. "beaded bracelet", "light blue", "stone beads", "elastic"
            8. "accessories", "minimal jewelry", "stacked bracelets"

            Strict Layout & Format Rules:
            1. QUANTITY: Generate exactly ONE single outfit. Do NOT create a grid. Do NOT create a collage. Do NOT show multiple angles (front/back/side). Just ONE front-facing view in the center.
            2. FORMAT: Vertical 9:16 Aspect Ratio (Tall Mobile Wallpaper). The image must be tall and narrow.
            3. COMPOSITION: Center the outfit. Leave white space at the top and bottom. 

            Strict styling Rules:
            1. FIDELITY: Use EXACT textures from images.
            2. POSE: Vertical ghost mannequin.
            - Order: Hat (top) -> Necklace -> Dress -> Bracelets -> Boots (bottom).
            3. PHYSICS: 3D volume, realistic drapes.
            4. ACCESSORIES: Anatomical placement.
            5. ENVIRONMENT: Pure white background (#FFFFFF). Soft studio lighting. No body parts.


            """
            
        )

        for url in image_urls:
            resp = requests.get(url)
            resp.raise_for_status()

            parts.append(
                types.Part.from_bytes(
                    data=resp.content,
                    mime_type="image/png"
                )
            )

        #the problem
        response = await client.aio.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=1.0, 
                max_output_tokens=2048
            )
       )

        #has attribute 
        if hasattr(response, 'generated_images') and response.generated_images:
            return response.generated_images[0].image_bytes
        
        # Fallback for different SDK versions/models
        return response.candidates[0].content.parts[0].inline_data.data

        return image_bytes

    except Exception as e:
        raise Exception(f"Gemini failed: {str(e)}")
    

def save_image(image_bytes):
    try: 
        encoded_image = base64.b64encode(image_bytes)
        print("Encoded image length:", len(encoded_image))

        response = requests.post(
            "https://api.imgbb.com/1/upload",
            data={
                "key": os.getenv("IMG_API"),
                "image": encoded_image
            }
        )

        return response.json()["data"]["url"]

    except Exception as e:
        raise Exception(f"Image upload failed: {str(e)}")

def save_image_locally(image_bytes):
    try:
        # 1. Save locally first (as you wanted)
        folder_path = "generated_outfits"
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

        filename = f"outfit_{uuid.uuid4().hex[:8]}.png"
        file_path = os.path.join(folder_path, filename)

        with open(file_path, "wb") as f:
            f.write(image_bytes)

        # 2. Upload to ImgBB using the FILE, not the path string
        # We re-open the file in 'rb' (read binary) mode to send it
        with open(file_path, "rb") as file_to_upload:
            response = requests.post(
                "https://api.imgbb.com/1/upload",
                params={"key": os.getenv("IMG_API")},
                files={"image": file_to_upload}
            )
        
        res_json = response.json()
        
        if response.status_code != 200:
            raise Exception(f"ImgBB Error: {res_json.get('error', {}).get('message', 'Unknown error')}")

        return res_json["data"]["url"]

    except Exception as e:
        print(f"DEBUG: Save/Upload failed: {e}")
        raise Exception(f"Process failed: {str(e)}")