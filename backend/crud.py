import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, insert, update, and_, or_, not_, func
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from backend.models import UnionMember, PaymentPeriod, UnionPayment
from backend.schemas import UnionMemberCreate, UnionMemberUpdate
from datetime import datetime


async def get_members_by_ppo(db: AsyncSession, ppo_id: int):
    query = text("""
        SELECT 
            u.id,
            u.full_name,
            u.group_id, 
            g.name ||
              CASE 
                WHEN u.group_suffix::int <= 23 THEN 
                  CASE WHEN u.group_id < 500 THEN 'Б' ELSE 'М' END
                ELSE 
                  CASE WHEN u.group_id < 500 THEN 'БВ' ELSE 'СВ' END
              END || '-' || u.group_suffix AS group_name, 
            ppo.name AS ppo_name,
            u.birth_date,
            u.gender,
            u.phone,
            u.email,
            u.funding_type,
            u.year,
            u.status,
            u.created_at
        FROM union_members u
        JOIN groups g ON u.group_id = g.id
        JOIN ppo_units ppo ON g.ppo_id = ppo.id
        WHERE ppo.id = :ppo_id
    """)
    result = await db.execute(query, {"ppo_id": ppo_id})
    return [dict(row._mapping) for row in result]




async def create_union_member(db: AsyncSession, member):
    stmt = insert(UnionMember).values(
        group_id=member["group_id"],
        full_name=member["full_name"],
        birth_date=member["birth_date"],
        gender=member["gender"],
        phone=member["phone"],
        email=member["email"],
        funding_type=member["funding_type"],
        year=member["year"],
        status=member.get("status", "состоит"),
        group_suffix=member.get("group_suffix"),
        created_at=datetime.now()
    ).returning(UnionMember.id)

    result = await db.execute(stmt)
    new_member_id = result.scalar_one()
    await db.commit()

    format_query = text("""
        SELECT f.id
        FROM groups g
        JOIN ppo_units p ON g.ppo_id = p.id
        JOIN formats f ON p.format_id = f.id
        WHERE g.id = :group_id
    """)
    format_res = await db.execute(format_query, {"group_id": member["group_id"]})
    format_id = format_res.scalar_one_or_none()

    if format_id:
        periods_query = select(PaymentPeriod).where(PaymentPeriod.format_id == format_id)
        periods_res = await db.execute(periods_query)
        periods = periods_res.scalars().all()

        now = datetime.now()
        for period in periods:
            db.add(UnionPayment(
                member_id=new_member_id,
                period_id=period.id,
                paid="-",
                paid_at=now
            ))
        await db.commit()

    query = text("""
        SELECT 
            u.id,
            u.full_name,
            g.name ||
              CASE 
                WHEN u.group_suffix::int <= 23 THEN 
                  CASE WHEN u.group_id < 500 THEN 'Б' ELSE 'М' END
                ELSE 
                  CASE WHEN u.group_id < 500 THEN 'БВ' ELSE 'СВ' END
              END || '-' || u.group_suffix AS group_name,
            p.name AS ppo_name,
            u.birth_date,
            u.gender,
            u.phone,
            u.email,
            u.funding_type,
            u.year,
            u.status,
            u.created_at
        FROM union_members u
        JOIN groups g ON u.group_id = g.id
        JOIN ppo_units p ON g.ppo_id = p.id
        WHERE u.id = :id
    """)
    enriched_result = await db.execute(query, {"id": new_member_id})
    return enriched_result.mappings().first()





async def update_union_member(db: AsyncSession, member_id: int, update_data: dict):
    query = select(UnionMember).where(UnionMember.id == member_id)
    result = await db.execute(query)
    member = result.scalars().first()
    if not member:
        raise Exception("Member not found")
    
    if "group_input" in update_data and update_data["group_input"]:
        group_input = update_data.pop("group_input")
        pattern = r"^(.*?)-?(\d+)((?:БВ|Б|СВ|М))-(\d{2})$"
        match = re.match(pattern, group_input)
        if not match:
            raise Exception("Неверный формат group_input. Ожидается, например, 'М8О-202БВ-23'")
        inst_code = match.group(1)           # "М8О"
        try:
            base_number = int(match.group(2))  # "202"
        except ValueError:
            raise Exception("Неверная числовая часть в group_input")
        input_type = match.group(3)  # "Б", "БВ", "М" или "СВ"
        suffix_str = match.group(4)  # "23"
        try:
            suffix_num = int(suffix_str)
        except ValueError:
            raise Exception("Неверный формат суффикса в group_input")
        #  если бакалавр
        is_bachelor = input_type in ["Б", "БВ"]
        if suffix_num <= 23:
            correct_prefix = "Б" if is_bachelor else "М"
        else:
            correct_prefix = "БВ" if is_bachelor else "СВ"
        derived_group_id = base_number if is_bachelor else base_number + 400
        update_data["group_id"] = derived_group_id
        update_data["group_suffix"] = suffix_str

    for key, value in update_data.items():
        setattr(member, key, value)
    await db.commit()
    await db.refresh(member)
    
    query = text("""
        SELECT 
            u.id,
            u.full_name,
            g.name ||
              CASE 
                WHEN u.group_suffix IS NULL THEN 'БВ-' || RIGHT(u.year::TEXT, 2)
                WHEN u.group_suffix::int <= 23 THEN 
                  CASE WHEN u.group_id < 500 THEN 'Б' ELSE 'М' END
                ELSE 
                  CASE WHEN u.group_id < 500 THEN 'БВ' ELSE 'СВ' END
              END || '-' || u.group_suffix AS group_name,
            p.name AS ppo_name,
            u.birth_date,
            u.gender,
            u.phone,
            u.email,
            u.funding_type,
            u.year,
            u.status,
            u.created_at
        FROM union_members u
        JOIN groups g ON u.group_id = g.id
        JOIN ppo_units p ON g.ppo_id = p.id
        WHERE u.id = :id
    """)
    enriched_result = await db.execute(query, {"id": member_id})
    return enriched_result.mappings().first()





async def next_academic_year(db: AsyncSession):
    excluded_statuses = ["вышел", "академ", "отчислен", "выпущен"]

    query = select(UnionMember).where(
        not_(UnionMember.status.in_(excluded_statuses))
    )
    result = await db.execute(query)
    students = result.scalars().all()

    updated_count = 0

    for student in students:
        if str(student.group_id).startswith("4") or str(student.group_id).startswith("6"):
            student.status = "выпущен"
            updated_count += 1
        else:
            student.group_id += 100
            updated_count += 1

    await db.commit()
    return {"message": f"Переход завершён. Обработано {updated_count} записей.", "count": updated_count}




async def previous_academic_year(db: AsyncSession):
    result = await db.execute(
        text("""
        SELECT id, group_id, status 
        FROM union_members
        """)
    )
    members = result.mappings().all()

    updated_count = 0

    for member in members:
        uid = member["id"]
        gid = member["group_id"]
        status = member["status"]
    
        if status in ["выпущен", "академ", "отчислен", "вышел"]:
            continue
    
        new_gid = gid - 100
        if new_gid < 100:
            continue

        await db.execute(
            update(UnionMember)
            .where(UnionMember.id == uid)
            .values(group_id=new_gid)
        )
        updated_count += 1

    await db.commit()
    return {"message": f"Откат завершён. Обработано {updated_count} записей.", "count": updated_count}



async def get_payments_by_period(db: AsyncSession, period_name: str = ""):
    result = await db.execute(
        select(UnionMember)
        .options(
            joinedload(UnionMember.group),
            joinedload(UnionMember.payments).joinedload(UnionPayment.period)
        )
    )
    members = result.unique().scalars().all()

    data = []
    for member in members:
        if not period_name:
            payment = next(iter(member.payments), None)
        else:
            payment = next(
                (p for p in member.payments if p.period and period_name in p.period.period_name),
                None
            )
        paid_status = payment.paid if payment else "-"

        raw_name = member.group.name if member.group else ""
        inst_code = raw_name.split("-", 1)[0]  # "М8О"
        suffix = getattr(member, "group_suffix", None)

        if suffix is None:
            full_group_name = inst_code
        else:
            num = member.group_id  # 101
            suffix_num = int(suffix)
            is_bachelor = num < 500

            if suffix_num <= 23:
                prefix = "Б" if is_bachelor else "М"
            else:
                prefix = "БВ" if is_bachelor else "СВ"

            full_group_name = f"{inst_code}-{num}{prefix}-{suffix}"

        data.append({
            "id":         member.id,
            "full_name":  member.full_name,
            "group_name": full_group_name,
            "paid":       paid_status,
        })

    return data






async def get_all_payment_periods(db: AsyncSession):
    result = await db.execute(select(PaymentPeriod))
    return result.unique().scalars().all()


async def update_payment_status(db: AsyncSession, member_id: int, period_name: str, paid: str):
    period = await db.execute(select(PaymentPeriod).where(PaymentPeriod.period_name == period_name))
    period_obj = period.scalar_one_or_none()
    if not period_obj:
        raise ValueError("Такой период не найден")

    payment = await db.execute(
        select(UnionPayment)
        .where(UnionPayment.member_id == member_id, UnionPayment.period_id == period_obj.id)
    )
    payment_record = payment.scalar_one_or_none()

    if payment_record:
        payment_record.paid = paid
        payment_record.paid_at = datetime.now()
    else:
        new_payment = UnionPayment(
            member_id=member_id,
            period_id=period_obj.id,
            paid=paid,
            paid_at=datetime.now()
        )
        db.add(new_payment)

    await db.commit()
    return paid


async def create_payment_period(db: AsyncSession, format_id: int, period_name: str):
    stmt = insert(PaymentPeriod).values(
        format_id=format_id,
        period_name=period_name
    ).returning(PaymentPeriod.id)
    result = await db.execute(stmt)
    new_period_id = result.scalar_one()
    await db.commit()

    members_result = await db.execute(select(UnionMember.id))
    member_ids = members_result.scalars().all()

    payments_to_add = [
        UnionPayment(
            member_id=member_id,
            period_id=new_period_id,
            paid='-',
            paid_at=None
        )
        for member_id in member_ids
    ]
    db.add_all(payments_to_add)
    await db.commit()

    return {"message": "Период создан и записи добавлены", "added_for": len(member_ids)}
