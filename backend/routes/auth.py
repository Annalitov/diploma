from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

from backend.database import get_db
from backend.models import Admin
from backend.schemas import AdminCreate, Token
from ..auth import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    oauth2_scheme,
    create_access_token
)

router = APIRouter(tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/api/auth/register", response_model=AdminCreate)
async def register_admin(
    admin: AdminCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Admin).where(Admin.email == admin.email)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = pwd_context.hash(admin.password)
    new_admin = Admin(
        name=admin.name,
        email=admin.email,
        password_hash=hashed_password,
        format_id=admin.format_id,
        ppo_id=admin.ppo_id,
        role=admin.role
    )
    
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)
    
    return new_admin

@router.post("/api/auth/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Admin).where(Admin.email == form_data.username)
    )
    admin = result.scalars().first()

    if not admin or not pwd_context.verify(form_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(
        data={
            "admin_id": admin.id,
            "format_id": admin.format_id,
            "ppo_id": admin.ppo_id,
            "role": admin.role
        }
    )

    return {"access_token": access_token, "token_type": "bearer"}