from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        print("TOKEN RECEIVED:", credentials.credentials)
        decoded_token = auth.verify_id_token(credentials.credentials)
        print("DECODED OK:", decoded)
        return decoded_token  # contains uid
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
