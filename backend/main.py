from dotenv import load_dotenv
load_dotenv()
import os
import uuid
import requests

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from verify import get_current_user

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Image, Base

import firebase_admin
from firebase_admin import credentials, auth

from savetoimgserver import store_image  

# -------------------------
# Database dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Firebase Admin setup
# -------------------------
firebase_key = "hackathon-project-e9087-firebase-adminsdk-fbsvc-948b54a897.json"
cred = credentials.Certificate(firebase_key)
firebase_admin.initialize_app(cred)

# -------------------------
# FastAPI setup
# -------------------------
app = FastAPI()
security = HTTPBearer()


# -------------------------
# Models
# -------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

# Create tables
Base.metadata.create_all(bind=engine)
# -------------------------
# Helper: Firebase REST sign-in (for testing / Postman)
# -------------------------

# -------------------------
# Helper: Firebase REST sign-in (for testing / Postman)
# -------------------------
FIREBASE_API_KEY = os.getenv("API_KEY")  # your Firebase Web API key


# -------------------------
# Routes
# -------------------------
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

@app.post("/save-image")
async def save_image(
    image: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
        image_urls = [img.image_url for img in images]

        return {
            "message": "Wardrobe retrieved",
            "uid": uid,
            "images": image_urls
        }
    except Exception as e:
        return {
            "message": "Error retrieving wardrobe",
            "error": str(e)
        }
#generate outfit route to return generated outfit based on user images and gemnai prompt
@app.post("/generate-outfit")
async def generate_outfit(user = Depends(get_current_user), items: list[str] = Form(...)):
    uid = user["uid"]

    return ""


