from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.database import get_db, engine, Base
from backend.crud import get_members_by_ppo
from backend.auth import get_current_admin
from backend.routes.auth import router as auth_router
from backend.routes.union import router as union_router
from backend.routes.format import router as format_router
from backend.routes.attendance_auth import router as attendance_auth_router
from backend.routes.attendance_unit import router as attendance_unit_router
from backend.routes.attendance      import router as attendance_router
from backend.routes.analytics import router as analytics_router
from backend.schemas import UnionMemberResponse
from fastapi.middleware.cors import CORSMiddleware




app = FastAPI(
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": False
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("startup")
async def startup():
    await create_tables()

@app.get("/")
async def read_root():
    return {"message": "FastAPI + PostgreSQL работает!"}


@app.get("/api/union/members", response_model=list[UnionMemberResponse])
async def get_union_members(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    if admin["format_id"] != 1:
        raise HTTPException(status_code=403, detail="Доступ запрещен для этого формата")

    members = await get_members_by_ppo(db, admin["ppo_id"])
    
    return members

app.include_router(auth_router)
app.include_router(union_router)
app.include_router(format_router)
app.include_router(attendance_auth_router)
app.include_router(attendance_unit_router)
app.include_router(attendance_router)
app.include_router(analytics_router)