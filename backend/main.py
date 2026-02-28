from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi import UploadFile, File, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import firebase_admin
from firebase_admin import credentials, auth, initialize_app
from verify import get_current_user
import requests
from savetoimgserver import store_image
import base64
import pyrebase
import os
import uuid

firebaseKey = "hackathon-project-e9087-firebase-adminsdk-fbsvc-948b54a897.json"


#TODO: change this to env variable and add to gitignore
cred = credentials.Certificate(firebaseKey)
firebase_admin.initialize_app(cred)

app = FastAPI()
security = HTTPBearer()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


fake_db = {}  
# Structure:
# {
#   "uid123": ["image_url1", "image_url2"],
#   "uid456": ["image_url3"]
# }

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

#TODO: implement token and bearer for protected routes
    
#protected routes

# take image 
    



#TODO: add feature to save to real DB 
@app.post("/save-image")
async def save_image(
    image: UploadFile = File(...),
    user=Depends(get_current_user)
):
    uid = user["uid"]

    try:
        # Store image somewhere (your function)
        image_url = await store_image(image)

        # Save to fake DB
        if uid not in fake_db:
            fake_db[uid] = []

        fake_db[uid].append(image_url)

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


#profile page - return user images


# convert to binary
# host it on url service
# genarate image
# return image url to user
    
#TODO: get azure database connection
"""
/profile
/wardrobe - return images
/generate-outfit([] items)
/upload
/
"""

"""
 take the users linked image and generate it with the gemnai prompt

 javascript for logging in:

 import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

 async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // 🔥 This is the UID
  const uid = user.uid;

  // 🔥 This is the JWT token
  const idToken = await user.getIdToken();

  return { uid, idToken };
"""