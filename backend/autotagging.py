import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Map Azure tags → your wardrobe categories
CATEGORY_MAP = {
    # Tops
    "shirt": "Tops", "t-shirt": "Tops", "top": "Tops", "blouse": "Tops",
    "sweater": "Tops", "jumper": "Tops", "cardigan": "Tops", "tank top": "Tops",
    "polo": "Tops", "turtleneck": "Tops", "crop top": "Tops",

    # Bottoms
    "trousers": "Bottoms", "pants": "Bottoms", "jeans": "Bottoms",
    "shorts": "Bottoms", "skirt": "Bottoms", "leggings": "Bottoms",
    "chinos": "Bottoms", "sweatpants": "Bottoms", "joggers": "Bottoms",

    # Outerwear
    "jacket": "Outerwear", "coat": "Outerwear", "hoodie": "Outerwear",
    "blazer": "Outerwear", "parka": "Outerwear", "windbreaker": "Outerwear",
    "overcoat": "Outerwear", "raincoat": "Outerwear",

    # Dresses
    "dress": "Dresses", "gown": "Dresses", "sundress": "Dresses",
    "jumpsuit": "Dresses", "romper": "Dresses",

    # Activewear
    "activewear": "Activewear", "sportswear": "Activewear", "gym": "Activewear",
    "athletic": "Activewear", "yoga": "Activewear", "legging": "Activewear",

    # Shoes
    "shoes": "Shoes", "boots": "Shoes", "sneakers": "Shoes", "heels": "Shoes",
    "sandals": "Shoes", "loafers": "Shoes", "trainers": "Shoes", "footwear": "Shoes",

    # Accessories
    "bag": "Accessories", "handbag": "Accessories", "scarf": "Accessories",
    "hat": "Accessories", "cap": "Accessories", "belt": "Accessories",
    "watch": "Accessories", "sunglasses": "Accessories", "jewellery": "Accessories",
    "jewelry": "Accessories", "necklace": "Accessories", "bracelet": "Accessories",
}


async def autotag_image(image_url: str) -> list[str]:
    """
    Takes a public image URL.
    Returns tags including a mapped category (Tops, Bottoms, etc.)
    plus colour/style tags from Azure.
    """
    endpoint = os.getenv("AZURE_AI_ENDPOINT", "").rstrip("/")
    api_key  = os.getenv("AZURE_AI_KEY")

    response = requests.post(
        f"{endpoint}/computervision/imageanalysis:analyze",
        params={"api-version": "2024-02-01", "features": "tags"},
        headers={
            "Ocp-Apim-Subscription-Key": api_key,
            "Content-Type": "application/json",
        },
        json={"url": image_url},
        timeout=15,
    )
    response.raise_for_status()

    result    = response.json()
    tags_data = result.get("tagsResult", {}).get("values", [])
    raw_tags  = [t["name"] for t in tags_data if t.get("confidence", 0) >= 0.5]
    print(f"[autotag] raw tags: {raw_tags}")

    # Find category from mapping
    category = None
    for tag in raw_tags:
        if tag.lower() in CATEGORY_MAP:
            category = CATEGORY_MAP[tag.lower()]
            break

    # Colour/style tags to keep alongside category
    colour_style_keywords = [
        "red", "blue", "green", "black", "white", "yellow", "pink", "purple",
        "orange", "grey", "gray", "brown", "navy", "beige", "floral", "striped",
        "plaid", "checkered", "patterned", "denim", "leather", "cotton", "silk",
        "casual", "formal", "vintage", "slim", "oversized",
    ]
    extra_tags = [t for t in raw_tags if t.lower() in colour_style_keywords]

    # Build final tag list: category first, then extras
    final_tags = []
    if category:
        final_tags.append(category)
    final_tags.extend(extra_tags)

    # If no category matched, just return top raw tags
    if not final_tags:
        final_tags = raw_tags[:3]

    print(f"[autotag] final tags: {final_tags}")
    return final_tags