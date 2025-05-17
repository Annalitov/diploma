from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Annotated, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models import Admin
from sqlalchemy import select


SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_admin(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: int = payload.get("admin_id")
        format_id: int = payload.get("format_id")
        ppo_id: int = payload.get("ppo_id")
        role: str = payload.get("role")
        
        if None in (admin_id, format_id, ppo_id, role):
            raise credentials_exception
            
        result = await db.execute(select(Admin).where(Admin.id == admin_id))
        admin = result.scalars().first()
        if not admin:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    return {
        "admin_id": admin_id,
        "format_id": format_id,
        "ppo_id": ppo_id,
        "role": role
    }