from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import requests

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, EmailStr
from verify import get_current_user

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Image, FavouriteImage, UserTokens

import firebase_admin
from firebase_admin import credentials, auth

from savetoimgserver import store_image
from autotagging import autotag_image
from GenImg import gen_img, save_image_locally
from tokens import get_token_balance, deduct_token, credit_tokens

import stripe


# ── Database ───────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Firebase ───────────────────────────────────────────────────────────────────
firebase_key = "hackathon-project-e9087-firebase-adminsdk-fbsvc-948b54a897.json"
cred = credentials.Certificate(firebase_key)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

custom_token = auth.create_custom_token("user-uid")
print("CUSTOM: ", custom_token)


# ── FastAPI ────────────────────────────────────────────────────────────────────
app = FastAPI()
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


def sign_in_user(email: str, password: str) -> str:
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
    resp = requests.post(url, json={"email": email, "password": password, "returnSecureToken": True})
    resp.raise_for_status()
    return resp.json()["idToken"]


# ── Stripe ─────────────────────────────────────────────────────────────────────
stripe.api_key        = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
SUCCESS_URL           = os.getenv("FRONTEND_SUCCESS_URL", "https://example.com/success")
CANCEL_URL            = os.getenv("FRONTEND_CANCEL_URL",  "https://example.com/cancel")

# How many tokens each plan grants
PLAN_TOKENS = {"basic": 5, "pro": 10}
PLAN_PRICES_GBP = {"basic": 199, "pro": 299}


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/register")
def register_user(request: RegisterRequest):
    try:
        user = auth.create_user(email=request.email, password=request.password)
        return {"message": "User created successfully", "uid": user.uid}
    except Exception as e:
        return {"message": "Error creating user", "error": str(e)}


# ── /save-image  →  user's OWN clothes (wardrobe tab) ─────────────────────────
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


# ── /save-favourite  →  items user WANTS TO BUY (saved tab) ───────────────────
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


# ── /wardrobe  →  fetch all items ─────────────────────────────────────────────
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


# ── /delete-image ──────────────────────────────────────────────────────────────
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


# ── /delete-favourite ──────────────────────────────────────────────────────────
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


# ── Token routes ───────────────────────────────────────────────────────────────

@app.get("/tokens")
async def get_tokens(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns current token balance and time until weekly reset."""
    return get_token_balance(user["uid"], db)


# ── /generate-outfit  (deducts 1 token) ───────────────────────────────────────
class OutfitRequest(BaseModel):
    items: list[str]

@app.post("/generate-outfit")
async def generate_outfit(
    request: OutfitRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = user["uid"]

    # Deduct token first — raises 402 if balance is 0
    deduct_token(uid, db)

    p = 0
    try:
        outfit_image_bytes = await gen_img(request.items)
        p = 1
        outfit_url = save_image_locally(outfit_image_bytes)
        p = 2
        return {"message": "Outfit generated", "outfit_url": outfit_url}
    except Exception as e:
        # Refund the token if generation failed
        credit_tokens(uid, 1, db)
        return {"message": "Error generating outfit", "p": p, "error": str(e)}


# ── Stripe: checkout ───────────────────────────────────────────────────────────
class CheckoutRequest(BaseModel):
    amount: int
    currency: str = "gbp"
    description: str = "Kiova Payment"

@app.post("/payments/create-checkout-session")
async def create_checkout_session(body: CheckoutRequest):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Missing STRIPE_SECRET_KEY")
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{"price_data": {"currency": body.currency, "product_data": {"name": body.description}, "unit_amount": int(body.amount)}, "quantity": 1}],
            success_url=SUCCESS_URL,
            cancel_url=CANCEL_URL,
            metadata={"uid": "test-user"},
        )
        return {"id": session.id, "url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Stripe: plan-based checkout ────────────────────────────────────────────────
class PlanCheckoutRequest(BaseModel):
    plan: str
    uid: str   # pass the Firebase uid from the frontend so webhook can credit it

@app.post("/payments/create-checkout-session-plan")
async def create_checkout_session_plan(body: PlanCheckoutRequest):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Missing STRIPE_SECRET_KEY")
    plan = body.plan.lower().strip()
    if plan not in PLAN_PRICES_GBP:
        raise HTTPException(status_code=400, detail="Invalid plan. Use 'basic' or 'pro'.")
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{"price_data": {"currency": "gbp", "product_data": {"name": f"Kiova {plan.title()} — {PLAN_TOKENS[plan]} tokens"}, "unit_amount": PLAN_PRICES_GBP[plan]}, "quantity": 1}],
            success_url=SUCCESS_URL,
            cancel_url=CANCEL_URL,
            # Store uid + plan so webhook knows who to credit
            metadata={"uid": body.uid, "plan": plan},
        )
        return {"id": session.id, "url": session.url, "plan": plan}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Stripe: webhook  (credits tokens after confirmed payment) ──────────────────
@app.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Missing STRIPE_WEBHOOK_SECRET")
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        uid      = metadata.get("uid")
        plan     = metadata.get("plan")

        if uid and plan and plan in PLAN_TOKENS:
            amount = PLAN_TOKENS[plan]
            result = credit_tokens(uid, amount, db)
            print(f"✅ PAYMENT OK uid={uid} plan={plan} → +{amount} tokens (new balance: {result['tokens']})")
        else:
            print(f"⚠️ Webhook received but missing uid/plan in metadata: {metadata}")

    return {"received": True}