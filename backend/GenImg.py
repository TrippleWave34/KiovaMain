import os
import requests
import base64
from google import genai
from google.genai import types


def gen_img(image_urls):
    try:
        Gemini_API_KEY = os.getenv("Gemini_API")
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
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=1.0, 
                max_output_tokens=2048
            )
       )

        image_bytes = response.candidates[0].content.parts[0]

        return image_bytes

    except Exception as e:
        raise Exception(f"Gemini failed: {str(e)}")
    

def save_image(image_bytes):

    encoded_image = base64.b64encode(image_bytes).decode('utf-8')

    response =  requests.post(
        "https://api.imgbb.com/1/upload",
        data={
            "key": os.getenv("IMG_API"),
            "image": encoded_image
        }
    )

    response.raise_for_status()
    return response.json()["data"]["url"]

