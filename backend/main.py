from fastapi import FastAPI
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import firebase_admin
from firebase_admin import credentials, auth
from verify import get_current_user

cred = credentials.Certificate("/Users/tivan/Desktop/hackathon/KiovaMain/backend/hackathon-project-e9087-firebase-adminsdk-fbsvc-948b54a897.json")
firebase_admin.initialize_app(cred)

app = FastAPI()
security = HTTPBearer()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


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


@app.post("/login")
def login_user(id_token: str):
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {
            "message": "Login successful",
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email")
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token"
        )



#TODO: implement token and bearer for protected routes
    
#protected routes
"""
/profile
/wardrobe - return images
/generate-outfit([] items)
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
