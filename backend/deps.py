from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models import AttendanceAdmin

oauth2_attendance = OAuth2PasswordBearer(tokenUrl="/api/auth/attendance/login")
SECRET_KEY        = "super_secret_attendance"
ALGORITHM         = "HS256"

async def get_current_attendance_admin(
    token: str = Depends(oauth2_attendance),
    db: AsyncSession = Depends(get_db)
):
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                 detail="Could not validate credentials",
                                 headers={"WWW-Authenticate": "Bearer"})

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: int = payload.get("attendance_admin_id")
        if admin_id is None:
            raise unauthorized
    except JWTError:
        raise unauthorized

    q = await db.execute(select(AttendanceAdmin).where(AttendanceAdmin.id == admin_id))
    admin = q.scalars().first()
    if not admin:
        raise unauthorized
    return admin
