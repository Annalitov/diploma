# routes/attendance_unit.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models import AttendanceUnit

router = APIRouter(prefix="/api/attendance", tags=["Attendance units"])

@router.get("/units")
async def get_units(format_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AttendanceUnit).where(AttendanceUnit.format_id == format_id))
    return result.scalars().all()
