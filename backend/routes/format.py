from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models import Format
from sqlalchemy.future import select

router = APIRouter()

@router.get("/api/formats")
async def get_formats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Format))
    return result.scalars().all()
