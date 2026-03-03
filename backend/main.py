from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import requests

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, EmailStr
from verify import get_current_user

from sqlalchemy.orm import Session
from database import SessionLocal, engine,Base
from models import Image, FavouriteImage

import firebase_admin
from firebase_admin import credentials, auth

from savetoimgserver import store_image  
from GenImg import gen_img, save_image_locally



# ✅ NEW: Stripe
import stripe

# Database dependency

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Firebase Admin setup

firebase_key = "hackathon-project-e9087-firebase-adminsdk-fbsvc-948b54a897.json"
cred = credentials.Certificate(firebase_key)

firebase_admin.initialize_app(cred)



# Avoid re-init error if app reloads (uvicorn --reload)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

custom_token = auth.create_custom_token("user-uid")
print("CUSTOM: ", custom_token)

# FastAPI setup

app = FastAPI()
security = HTTPBearer()


# ✅ NEW: CORS (important for Expo / mobile)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production: put your app domain(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


# Create tables
Base.metadata.create_all(bind=engine)



FIREBASE_API_KEY = os.getenv("API_KEY")  # your Firebase Web API key



def sign_in_user(email: str, password: str) -> str:
    """Sign in a user via Firebase REST API and get a valid ID token"""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    return data["idToken"]  # <-- this token works with Firebase Admin SDK


# -------------------------
# ✅ Stripe setup
# -------------------------
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

SUCCESS_URL = os.getenv("FRONTEND_SUCCESS_URL", "https://example.com/success")
CANCEL_URL = os.getenv("FRONTEND_CANCEL_URL", "https://example.com/cancel")



# Routes

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/register")
def register_user(request: RegisterRequest):
    try:
        user = auth.create_user(
            email=request.email,
            password=request.password
        )
        return {
            "message": "User created successfully",
            "uid": user.uid
        }
    except Exception as e:
        return {
            "message": "Error creating user",
            "error": str(e)
        }



#TODO: Remove overlap between save-image and save-favourite, maybe merge into one route with a "favourite" flag in the request body?
@app.post("/save-favourite")
async def save_favourite(
    image: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uid = user["uid"]

    try:
        # store image and get URL
        image_url = await store_image(image)

        new_fav_image = FavouriteImage(
            id=str(uuid.uuid4()),
            uid=uid,
            image_url=image_url
        )

        db.add(new_fav_image)
        db.commit()

        return {
            "message": "Favourite image saved",
            "uid": uid,
            "image_url": image_url
        }
    except Exception as e:
        return {
            "message": "Error saving favourite image",
            "error": str(e)
        }
    
@app.post("/save-image")
async def save_image_route(
    image: UploadFile = File(...),
):
    try:
        # store image and get URL
        image_url = await store_image(image)

        return {
            "message": "Image saved",
            "image_url": image_url
        }
    except Exception as e:
        return {
            "message": "Error saving image",
            "error": str(e)
        }
    uid = user["uid"]

    try:
        # store image and get URL
        image_url = await store_image(image)

        new_image = Image(
            id=str(uuid.uuid4()),
            uid=uid,
            image_url=image_url
        )

        db.add(new_image)
        db.commit()

        return {
            "message": "Image saved",
            "uid": uid,
            "image_url": image_url
        }
    except Exception as e:
        return {
            "message": "Error saving image",
            "error": str(e)
        }


@app.get("/wardrobe")
async def get_wardrobe(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uid = user["uid"]

    try:
        images = db.query(Image).filter(Image.uid == uid).all()
        favimages = db.query(FavouriteImage).filter(FavouriteImage.uid == uid).all()
        image_urls = [img.image_url for img in images]
        favimages_urls = [img.image_url for img in favimages]

        return {
            "message": "Wardrobe retrieved",
            "uid": uid,
            "images": image_urls,
            "favourites": favimages_urls
        }
    except Exception as e:
        return {
            "message": "Error retrieving wardrobe",
            "error": str(e)
        }


# generate outfit route to return generated outfit based on user images and gemnai prompt
class OutfitRequest(BaseModel):
    items: list[str]

#add the image urls in a file that you want to combine
@app.post("/generate-outfit")
async def generate_outfit(
    request: OutfitRequest,
):
    p = 0
    try:

        # Generate outfit image bytes
        outfit_image_bytes = await gen_img(request.items)
        p = 1
        print("TYPE OF outfit_image_bytes:", type(outfit_image_bytes))
        p = 2

        # Save image to imgbb (sync call)
        outfit_url = save_image_locally(outfit_image_bytes)
        p = 3

        return {
            "message": "Outfit generated",
            "outfit_url": outfit_url
        }

    except Exception as e:
        return {
            "message": "Error generating outfit",
            "p": p,
            "error": str(e)
        }


# -------------------------
# ✅ NEW: Stripe - Create Checkout Session
# -------------------------
class CheckoutRequest(BaseModel):
    amount: int  # in smallest unit (pence for GBP). Example: 499 = £4.99
    currency: str = "gbp"
    description: str = "Kiova Payment"


@app.post("/payments/create-checkout-session")
async def create_checkout_session(
    body: CheckoutRequest,
    # user=Depends(get_current_user)
):
    """
    Creates a Stripe Checkout session and returns the URL to open.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Missing STRIPE_SECRET_KEY")

    uid = "test-user" #user["uid"]  

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": body.currency,
                        "product_data": {"name": body.description},
                        "unit_amount": int(body.amount),
                    },
                    "quantity": 1,
                }
            ],
            success_url=SUCCESS_URL,
            cancel_url=CANCEL_URL,
            metadata={"uid": uid},  # link payment to your Firebase user
        )
        return {"id": session.id, "url": session.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------
# ✅ NEW: Stripe - Webhook (payment confirmation)
# -------------------------
@app.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe sends events here. We verify signature then handle events.
    """
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Missing STRIPE_WEBHOOK_SECRET")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=STRIPE_WEBHOOK_SECRET,
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # ✅ Most common: Checkout finished successfully
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        uid = session.get("metadata", {}).get("uid")
        session_id = session.get("id")

        # TODO: Here is where you mark the user as premium in DB / Firebase
        # Example: print only for now
        print(f"✅ PAYMENT OK uid={uid} session={session_id}")

    return {"received": True}

# -------------------------
# ✅ NEW: Stripe - Create Checkout Session (Plan-based: 1.99 / 2.99)
# -------------------------
class PlanCheckoutRequest(BaseModel):
    plan: str  # "basic" or "pro"


PLAN_PRICES_GBP = {
    "basic": 199,  # £1.99
    "pro": 299,    # £2.99
}

@app.post("/payments/create-checkout-session-plan")
async def create_checkout_session_plan(body: PlanCheckoutRequest):
    """
    Creates a Stripe Checkout session based on plan ("basic" or "pro").
    Returns URL to open in Expo.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Missing STRIPE_SECRET_KEY")

    plan = body.plan.lower().strip()
    if plan not in PLAN_PRICES_GBP:
        raise HTTPException(status_code=400, detail="Invalid plan. Use 'basic' or 'pro'.")

    amount = PLAN_PRICES_GBP[plan]
    uid = "test-user"  # later: replace with Firebase uid when you re-enable auth

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "gbp",
                        "product_data": {"name": f"Kiova {plan.title()}"},
                        "unit_amount": int(amount),
                    },
                    "quantity": 1,
                }
            ],
            success_url=SUCCESS_URL,
            cancel_url=CANCEL_URL,
            metadata={"uid": uid, "plan": plan},
        )
        return {"id": session.id, "url": session.url, "plan": plan}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# TODO: get azure database connection

