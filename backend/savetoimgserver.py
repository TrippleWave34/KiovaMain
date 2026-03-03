from Crop_Img import process_image


async def store_image(image) -> str:
    """
    Full pipeline:
      1. Remove background  (poof.bg)
      2. Crop to content    (PIL)
      3. Upload to imgbb
    Returns public image URL.
    """
    return await process_image(image)


