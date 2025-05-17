from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

from backend.database import get_db
from backend.models import AttendanceAdmin
from backend.schemas import AttendanceAdminCreate, AttendanceAdminOut, Token

router = APIRouter(prefix="/api/auth/attendance", tags=["Attendance auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "super_secret_attendance"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRES = 60 * 12 

def create_access_token(data: dict, minutes: int = ACCESS_TOKEN_EXPIRES):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=minutes)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=AttendanceAdminOut, status_code=201)
async def register_admin(payload: AttendanceAdminCreate, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(
        select(AttendanceAdmin).where(AttendanceAdmin.email == payload.email)
    )
    if exists.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    admin = AttendanceAdmin(
        name          = payload.name,
        email         = payload.email,
        password_hash = pwd_context.hash(payload.password),
        unit_id       = payload.unit_id,
        role          = payload.role
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(),
                db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(AttendanceAdmin)
                         .where(AttendanceAdmin.email == form.username))
    admin = q.scalars().first()

    if not admin or not pwd_context.verify(form.password, admin.password_hash):
        raise HTTPException(400, "Incorrect email or password")

    token = create_access_token({
        "attendance_admin_id": admin.id,
        "unit_id": admin.unit_id,
        "role": admin.role,
        "format_id": 2
    })
    return {"access_token": token, "token_type": "bearer"}
