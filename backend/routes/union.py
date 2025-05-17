import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.schemas import UnionMemberCreate, UnionMemberUpdate, UnionMemberResponse, PaymentStatusResponse, PaymentUpdateRequest, PaymentPeriodCreate
from backend.database import get_db
from backend.crud import create_union_member, update_union_member, next_academic_year, previous_academic_year
from backend.crud import get_payments_by_period, get_all_payment_periods, update_payment_status, create_payment_period
from backend.auth import get_current_admin
from backend.models import Group, Admin, PPOUnit 


router = APIRouter(prefix="/api/union", tags=["Профсоюз"])

@router.get("/ppos")
async def get_ppo_units(format_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PPOUnit).where(PPOUnit.format_id == format_id))
    return result.scalars().all()

@router.post("/members/add", response_model=UnionMemberResponse)
async def add_member(
    member: UnionMemberCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    if admin["role"] not in ["admin", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения операции"
        )
    
    group_input = member.group_input
    pattern = r"^(.*?)-?(\d+)((?:БВ|Б|СВ|М))-(\d{2})$"
    match = re.match(pattern, group_input)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат группы. Ожидается, например: М8О-202БВ-23"
        )
    
    inst_code = match.group(1)           # "М8О"
    try:
        base_number = int(match.group(2))  # 202
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверная числовая часть группы")
    
    input_type = match.group(3)  # "Б", "БВ", "М" "СВ"
    suffix_str = match.group(4)  # "23"
    try:
        suffix_num = int(suffix_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат суффикса группы")
    
    is_bachelor = input_type in ["Б", "БВ"]
    
    if suffix_num <= 23:
        correct_prefix = "Б" if is_bachelor else "М"
    else:
        correct_prefix = "БВ" if is_bachelor else "СВ"
    
    derived_group_id = base_number if is_bachelor else base_number + 400

    group_result = await db.execute(
        select(Group)
        .where(Group.id == derived_group_id)
        .where(Group.ppo_id == admin["ppo_id"])
    )
    group = group_result.scalars().first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Группа не найдена или не принадлежит вашему подразделению"
        )

    full_group_name = f"{inst_code}-{base_number}{correct_prefix}-{suffix_str}"

    member_data = member.dict(exclude={"group_input"})
    member_data["group_id"] = derived_group_id
    member_data["group_suffix"] = suffix_str
    
    try:
        new_member = await create_union_member(db, member_data)
        await db.commit()
        return new_member
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании члена профсоюза: {str(e)}"
        )


@router.put("/members/{member_id}", response_model=UnionMemberResponse)
async def update_member(
    member_id: int,
    update_data: UnionMemberUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    try:
        updated_member = await update_union_member(db, member_id, update_data.dict(exclude_unset=True))
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    return updated_member


@router.post("/members/next-year")
async def next_year(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    return await next_academic_year(db)


@router.post("/members/previous-year")
async def previous_year(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    return await previous_academic_year(db)


@router.get("/payments", response_model=list[PaymentStatusResponse])
async def payments(period: str, db: AsyncSession = Depends(get_db)):
    return await get_payments_by_period(db, period)


@router.get("/payments/periods")
async def payment_periods(db: AsyncSession = Depends(get_db)):
    periods = await get_all_payment_periods(db)
    return [p.period_name for p in periods]


@router.put("/payments/update")
async def update_payment(data: PaymentUpdateRequest, db: AsyncSession = Depends(get_db)):
    result = await update_payment_status(db, data.member_id, data.period_name, data.paid)
    return {"success": True, "new_status": result}


@router.post("/payments/periods", dependencies=[Depends(get_current_admin)])
async def add_payment_period(
    data: PaymentPeriodCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_payment_period(db, data.format_id, data.period_name)

