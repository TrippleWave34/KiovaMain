from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import json
import requests

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from pydantic import BaseModel, EmailStr
from verify import get_current_user

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Image, FavouriteImage, UserTokens, ProcessedPayment

import firebase_admin
from firebase_admin import credentials, auth

from savetoimgserver import store_image
from autotagging import autotag_image
from GenImg import gen_img, save_image_locally
from tokens import get_token_balance, deduct_token, credit_tokens

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── Database ───────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Firebase ───────────────────────────────────────────────────────────────────
if not firebase_admin._apps:
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_creds_json:
        firebase_creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(firebase_creds_dict)
    else:
        cred = credentials.Certificate("kiova-cddb5-firebase-adminsdk-fbsvc-0ae9b336ca.json")
    firebase_admin.initialize_app(cred)

# ── FastAPI ────────────────────────────────────────────────────────────────────
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

# ── Create DB tables ───────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

FIREBASE_API_KEY = os.getenv("API_KEY")

# ── PayPal ─────────────────────────────────────────────────────────────────────
PAYPAL_CLIENT_ID     = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_BASE_URL      = "https://api-m.sandbox.paypal.com"  # change to https://api-m.paypal.com for live
BASE_URL             = "https://kiovamain.onrender.com"

PLAN_TOKENS    = {"basic": 5, "pro": 10}
PLAN_PRICES    = {"basic": "1.99", "pro": "2.99"}
MAX_TOKENS     = 20

def get_paypal_access_token():
    resp = requests.post(
        f"{PAYPAL_BASE_URL}/v1/oauth2/token",
        headers={"Accept": "application/json"},
        data={"grant_type": "client_credentials"},
        auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/payment-success", response_class=HTMLResponse)
async def payment_success(token: str = "", PayerID: str = "", uid: str = "", plan: str = ""):
    # If we have all params, capture the payment and credit tokens
    tokens_added = 0
    error_msg = ""

    if token and PayerID and uid and plan:
        try:
            access_token = get_paypal_access_token()
            # Capture the order
            capture_resp = requests.post(
                f"{PAYPAL_BASE_URL}/v2/checkout/orders/{token}/capture",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}",
                },
            )
            capture_data = capture_resp.json()
            status = capture_data.get("status")

            if status == "COMPLETED":
                # Check not already processed
                db = SessionLocal()
                try:
                    already = db.query(ProcessedPayment).filter(ProcessedPayment.payment_intent == token).first()
                    if not already:
                        amount = PLAN_TOKENS.get(plan, 0)
                        # Get current tokens and cap at MAX_TOKENS
                        current = get_token_balance(uid, db)
                        current_tokens = current.get("tokens", 0)
                        space = MAX_TOKENS - current_tokens
                        to_add = min(amount, space)
                        if to_add > 0:
                            credit_tokens(uid, to_add, db)
                        tokens_added = to_add
                        db.add(ProcessedPayment(payment_intent=token, uid=uid, plan=plan))
                        db.commit()
                finally:
                    db.close()
        except Exception as e:
            error_msg = str(e)

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful — Kiova</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .card {{
                background: white;
                border-radius: 24px;
                padding: 48px 40px;
                text-align: center;
                max-width: 420px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            }}
            .icon {{
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                font-size: 36px;
            }}
            h1 {{ font-size: 28px; font-weight: 800; color: #1a1a1a; margin-bottom: 12px; }}
            p {{ color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 8px; }}
            .tokens-badge {{
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                font-size: 18px;
                font-weight: 800;
                padding: 12px 28px;
                border-radius: 50px;
                display: inline-block;
                margin: 20px 0;
            }}
            .btn {{
                display: inline-block;
                margin-top: 24px;
                background: #1a1a1a;
                color: white;
                padding: 14px 32px;
                border-radius: 50px;
                font-weight: 700;
                font-size: 15px;
                text-decoration: none;
                cursor: pointer;
                border: none;
            }}
            .countdown {{ color: #aaa; font-size: 13px; margin-top: 12px; }}
        </style>
        <script>
            let secs = 5;
            function tick() {{
                document.getElementById('cd').textContent = secs;
                if (secs <= 0) window.close();
                secs--;
                setTimeout(tick, 1000);
            }}
            window.onload = function() {{
                tick();
                setTimeout(() => window.close(), 5000);
            }};
        </script>
    </head>
    <body>
        <div class="card">
            <div class="icon">✅</div>
            <h1>Payment Successful!</h1>
            {'<div class="tokens-badge">+' + str(tokens_added) + ' tokens added!</div>' if tokens_added > 0 else '<p>Your tokens are being added to your account.</p>'}
            <p>Head back to Kiova — your tokens are ready to use.</p>
            <button class="btn" onclick="window.close()">Return to Kiova</button>
            <p class="countdown">This tab closes in <span id="cd">5</span>s</p>
        </div>
    </body>
    </html>
    """


@app.get("/payment-cancel", response_class=HTMLResponse)
async def payment_cancel():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Cancelled — Kiova</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .card {
                background: white;
                border-radius: 24px;
                padding: 48px 40px;
                text-align: center;
                max-width: 420px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            }
            .icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #f87171, #dc2626);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                font-size: 36px;
            }
            h1 { font-size: 28px; font-weight: 800; color: #1a1a1a; margin-bottom: 12px; }
            p { color: #666; font-size: 16px; line-height: 1.6; }
            .btn {
                display: inline-block;
                margin-top: 28px;
                background: #1a1a1a;
                color: white;
                padding: 14px 32px;
                border-radius: 50px;
                font-weight: 700;
                font-size: 15px;
                text-decoration: none;
                cursor: pointer;
                border: none;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">❌</div>
            <h1>Payment Cancelled</h1>
            <p>No charges were made. You can close this tab and try again in Kiova.</p>
            <button class="btn" onclick="window.close()">Close Tab</button>
        </div>
    </body>
    </html>
    """


@app.post("/register")
@limiter.limit("5/minute")
def register_user(request: Request, body: RegisterRequest):
    try:
        user = auth.create_user(email=body.email, password=body.password)
        return {"message": "User created successfully", "uid": user.uid}
    except Exception as e:
        return {"message": "Error creating user", "error": str(e)}


@app.post("/save-image")
async def save_image_route(
    image: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = user["uid"]
    try:
        image_url = await store_image(image)
        try:
            tags = await autotag_image(image_url)
        except Exception as tag_err:
            print(f"Autotagging failed (non-fatal): {tag_err}")
            tags = []
        tags_str = ",".join(tags)
        new_id = str(uuid.uuid4())
        db.add(Image(id=new_id, uid=uid, image_url=image_url, tags=tags_str))
        db.commit()
        return {"id": new_id, "image_url": image_url, "tags": tags}
    except Exception as e:
        return {"message": "Error saving image", "error": str(e)}


@app.post("/save-favourite")
async def save_favourite(
    image: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = user["uid"]
    try:
        image_url = await store_image(image)
        try:
            tags = await autotag_image(image_url)
        except Exception as tag_err:
            print(f"Autotagging failed (non-fatal): {tag_err}")
            tags = []
        tags_str = ",".join(tags)
        fav_id = str(uuid.uuid4())
        db.add(FavouriteImage(id=fav_id, uid=uid, image_url=image_url, tags=tags_str))
        db.commit()
        return {"id": fav_id, "image_url": image_url, "tags": tags}
    except Exception as e:
        return {"message": "Error saving favourite image", "error": str(e)}


@app.get("/wardrobe")
async def get_wardrobe(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = user["uid"]
    try:
        images    = db.query(Image).filter(Image.uid == uid).all()
        favimages = db.query(FavouriteImage).filter(FavouriteImage.uid == uid).all()
        return {
            "message": "Wardrobe retrieved",
            "uid": uid,
            "images": [
                {"id": img.id, "image_url": img.image_url, "tags": img.tags.split(",") if img.tags else []}
                for img in images
            ],
            "favourites": [
                {"id": img.id, "image_url": img.image_url, "tags": img.tags.split(",") if img.tags else []}
                for img in favimages
            ],
        }
    except Exception as e:
        return {"message": "Error retrieving wardrobe", "error": str(e)}


@app.delete("/delete-image/{image_id}")
async def delete_image(
    image_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = user["uid"]
    img = db.query(Image).filter(Image.id == image_id, Image.uid == uid).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(img)
    db.commit()
    return {"message": "Image deleted"}


@app.delete("/delete-favourite/{image_id}")
async def delete_favourite(
    image_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = user["uid"]
    img = db.query(FavouriteImage).filter(FavouriteImage.id == image_id, FavouriteImage.uid == uid).first()
    if not img:
        raise HTTPException(status_code=404, detail="Favourite not found")
    db.delete(img)
    db.commit()
    return {"message": "Favourite deleted"}


@app.get("/tokens")
async def get_tokens(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_token_balance(user["uid"], db)


class OutfitRequest(BaseModel):
    items: list[str]

@app.post("/generate-outfit")
async def generate_outfit(
    request: OutfitRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = user["uid"]
    deduct_token(uid, db)
    p = 0
    try:
        outfit_image_bytes = await gen_img(request.items)
        p = 1
        outfit_url = save_image_locally(outfit_image_bytes)
        p = 2
        return {"message": "Outfit generated", "outfit_url": outfit_url}
    except Exception as e:
        credit_tokens(uid, 1, db)
        return {"message": "Error generating outfit", "p": p, "error": str(e)}


# ── PayPal Payment Routes ──────────────────────────────────────────────────────

class PayPalOrderRequest(BaseModel):
    plan: str
    uid: str

@app.post("/payments/create-paypal-order")
async def create_paypal_order(body: PayPalOrderRequest):
    plan = body.plan.lower().strip()
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan. Use 'basic' or 'pro'.")

    try:
        access_token = get_paypal_access_token()
        order_resp = requests.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {
                        "currency_code": "GBP",
                        "value": PLAN_PRICES[plan],
                    },
                    "description": f"Kiova {plan.title()} — {PLAN_TOKENS[plan]} tokens",
                }],
                "application_context": {
                    "return_url": f"{BASE_URL}/payment-success?uid={body.uid}&plan={plan}",
                    "cancel_url": f"{BASE_URL}/payment-cancel",
                    "brand_name": "Kiova",
                    "user_action": "PAY_NOW",
                },
            },
        )
        order_data = order_resp.json()
        if order_resp.status_code != 201:
            raise HTTPException(status_code=400, detail=str(order_data))

        # Get the approval URL to redirect user to PayPal
        approval_url = next(
            link["href"] for link in order_data["links"] if link["rel"] == "approve"
        )
        return {"order_id": order_data["id"], "approval_url": approval_url}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class RefreshTokensRequest(BaseModel):
    uid: str

@app.post("/payments/refresh-tokens")
async def refresh_tokens(body: RefreshTokensRequest, db: Session = Depends(get_db)):
    """Called by frontend after returning from PayPal to get updated token balance."""
    result = get_token_balance(body.uid, db)
    return result
