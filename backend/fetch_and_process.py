import io
import json
import base64
import requests
from PIL import Image
from bs4 import BeautifulSoup
import os


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}

IMAGE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.google.com/",
}


def scrape_product_image(page_url: str) -> str:
    # Route through allorigins free proxy to bypass bot detection
    proxy_url = f"https://api.allorigins.win/get?url={requests.utils.quote(page_url)}"
    print(f"[scrape] fetching via allorigins: {page_url}")
    resp = requests.get(proxy_url, timeout=45)
    resp.raise_for_status()
    data = resp.json()
    html = data.get("contents", "")
    if not html:
        raise Exception("allorigins returned empty content")

    soup = BeautifulSoup(html, "html.parser")

    # Strategy 1: og:image meta tag
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        url = og_image["content"]
        if url.startswith("//"):
            url = "https:" + url
        print(f"[scrape] og:image found: {url}")
        return url

    # Strategy 2: JSON-LD structured data
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            if isinstance(data, list):
                data = data[0]
            image = data.get("image")
            if isinstance(image, list):
                image = image[0]
            if isinstance(image, str) and image.startswith("http"):
                print(f"[scrape] JSON-LD image found: {image}")
                return image
        except Exception:
            continue

    # Strategy 3: largest img tag
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        if src.startswith("//"):
            src = "https:" + src
        if any(x in src.lower() for x in ["logo", "icon", "sprite", "pixel", "blank"]):
            continue
        if src.startswith("http") and any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
            print(f"[scrape] img tag fallback: {src}")
            return src

    raise Exception("Could not find a product image on this page.")


async def fetch_and_process_url(image_url: str) -> str:
    direct_extensions = (".jpg", ".jpeg", ".png", ".webp", ".gif")
    is_direct_image = any(image_url.lower().split("?")[0].endswith(ext) for ext in direct_extensions)

    if not is_direct_image:
        print(f"[fetch_and_process_url] Product page detected, scraping via proxy...")
        image_url = scrape_product_image(image_url)

    resp = requests.get(image_url, headers=IMAGE_HEADERS, timeout=30)
    resp.raise_for_status()
    img_bytes = resp.content
    print(f"[fetch_and_process_url] fetched {len(img_bytes)} bytes")

    try:
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        bbox = pil_image.getbbox()
        if bbox:
            left, upper, right, lower = bbox
            padding = 10
            w, h = pil_image.size
            left  = max(0, left  - padding)
            upper = max(0, upper - padding)
            right = min(w, right + padding)
            lower = min(h, lower + padding)
            pil_image = pil_image.crop((left, upper, right, lower))
            print(f"[fetch_and_process_url] cropped to: {pil_image.size}")
    except Exception as e:
        print(f"[fetch_and_process_url] crop exception: {e}")
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)
    encoded_image = base64.b64encode(buffer.read()).decode()

    imgbb_key = os.getenv("IMG_API")
    response = requests.post(
        "https://api.imgbb.com/1/upload",
        data={"key": imgbb_key, "image": encoded_image},
        timeout=30,
    )
    response.raise_for_status()
    url = response.json()["data"]["url"]
    print(f"[fetch_and_process_url] uploaded to: {url}")
    return url
