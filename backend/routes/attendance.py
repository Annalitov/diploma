from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from sqlalchemy import func, select, update, delete, insert, cast, Integer, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased
import io, csv
from backend.database import get_db
from backend.deps import get_current_attendance_admin
from backend.models import (
    AttendanceGroup,
    AttendanceSemester,
    AttendanceStudent,
    Subject,
    Lesson,
    Attendance,
    SubjectGrade,
)
from backend.schemas import (
    AttendanceGroupCreate,
    AttendanceGroupOut,
    AttendanceGroupUpdate,
    AttendanceSemesterCreate,
    AttendanceSemesterOut,
    AttendanceStudentCreate,
    AttendanceStudentOut,
    SubjectCreate,
    SubjectOut,
    LessonCreate,
    LessonOut,
    AttendanceUpdate,
    AttendanceOut,
    GradeUpdate,
    GradeOut,
)

router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance"],
    dependencies=[Depends(get_current_attendance_admin)],
)


# ─────────── ГРУППЫ ───────────
@router.get("/groups", response_model=list[AttendanceGroupOut])
async def list_groups(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_attendance_admin),
):
    q = await db.execute(
        select(AttendanceGroup).where(AttendanceGroup.unit_id == admin.unit_id)
    )
    return q.scalars().all()


@router.post("/groups", response_model=AttendanceGroupOut, status_code=201)
async def create_group(
    payload: AttendanceGroupCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_attendance_admin),
):
    dup = await db.execute(
        select(AttendanceGroup)
        .where(
            AttendanceGroup.unit_id == admin.unit_id,
            AttendanceGroup.name == payload.name,
        )
    )
    if dup.scalars().first():
        raise HTTPException(400, "Группа с таким именем уже существует")

    new = AttendanceGroup(unit_id=admin.unit_id, name=payload.name)
    db.add(new)
    await db.commit()
    await db.refresh(new)
    return new


@router.get("/groups/{group_id}", response_model=AttendanceGroupOut)
async def get_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_attendance_admin),
):
    q = await db.execute(
        select(AttendanceGroup)
        .where(
            AttendanceGroup.id == group_id,
            AttendanceGroup.unit_id == admin.unit_id,
        )
    )
    grp = q.scalars().first()
    if not grp:
        raise HTTPException(404, "Группа не найдена")
    return grp


@router.put("/groups/{group_id}", response_model=AttendanceGroupOut)
async def update_group(
    group_id: int,
    payload: AttendanceGroupUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_attendance_admin),
):
    q = await db.execute(
        select(AttendanceGroup)
        .where(
            AttendanceGroup.id == group_id,
            AttendanceGroup.unit_id == admin.unit_id,
        )
    )
    grp = q.scalars().first()
    if not grp:
        raise HTTPException(404, "Группа не найдена")
    grp.name = payload.name
    await db.commit()
    await db.refresh(grp)
    return grp


# ─────────── СЕМЕСТРЫ ───────────
@router.get("/groups/{group_id}/semesters", response_model=list[AttendanceSemesterOut])
async def list_semesters(
    group_id: int,
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(
        select(AttendanceSemester).where(AttendanceSemester.group_id == group_id)
    )
    return q.scalars().all()


@router.post("/groups/{group_id}/semesters", response_model=AttendanceSemesterOut, status_code=201)
async def create_semester(
    group_id: int,
    payload: AttendanceSemesterCreate,
    db: AsyncSession = Depends(get_db),
):
    sem = AttendanceSemester(
        group_id=group_id,
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(sem)
    await db.commit()
    await db.refresh(sem)
    return sem


# ─────────── СТУДЕНТЫ ───────────
@router.get("/semesters/{sem_id}/students", response_model=list[AttendanceStudentOut])
async def list_students(
    sem_id: int,
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(
        select(AttendanceStudent).where(AttendanceStudent.semester_id == sem_id)
    )
    return q.scalars().all()


@router.post(
    "/semesters/{sem_id}/students",
    response_model=AttendanceStudentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить студента в семестр с автонумерацией"
)
async def create_student(
    sem_id: int,
    data: AttendanceStudentCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_attendance_admin),
):
    
    result = await db.execute(
        select(func.coalesce(func.max(AttendanceStudent.student_number), 0))
        .where(AttendanceStudent.semester_id == sem_id)
    )
    max_num = result.scalar_one()

    new_student = AttendanceStudent(
        semester_id    = sem_id,
        full_name      = data.full_name,
        student_number = max_num + 1,
    )
    db.add(new_student)
    await db.flush()

    lessons_q = await db.execute(
        select(Lesson.id)
        .join(Subject, Lesson.subject_id == Subject.id)
        .where(Subject.semester_id == sem_id)
    )
    lesson_ids = [row[0] for row in lessons_q.all()]
    
    if lesson_ids:
        await db.execute(
            insert(Attendance),
            [
                {"lesson_id": lid, "student_id": new_student.id, "status": "н"}
                for lid in lesson_ids
            ]
        )
    
    subjects_q = await db.execute(
        select(Subject.id).where(Subject.semester_id == sem_id)
    )
    subject_ids = [row[0] for row in subjects_q.all()]

    if subject_ids:
        await db.execute(
            insert(SubjectGrade),
            [
                {
                    "subject_id": sid,
                    "student_id": new_student.id,
                    "control_1":  None,
                    "control_2":  None,
                    "exam":       None,
                    "retake":     None,
                }
                for sid in subject_ids
            ]
        )
    
    await db.commit()
    await db.refresh(new_student)
    return new_student


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_attendance_admin),
):

    q = await db.execute(
        select(AttendanceStudent)
        .join(AttendanceSemester)
        .join(AttendanceGroup)
        .where(
            AttendanceStudent.id == student_id,
            AttendanceGroup.unit_id == admin.unit_id,
        )
    )
    stud = q.scalars().first()
    if not stud:
        raise HTTPException(404, "Студент не найден")
    await db.delete(stud)
    await db.commit()


# ─────────── ПРЕДМЕТЫ ───────────
@router.get("/semesters/{sem_id}/subjects", response_model=list[SubjectOut])
async def list_subjects(
    sem_id: int,
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(
        select(Subject).where(Subject.semester_id == sem_id)
    )
    return q.scalars().all()


@router.post(
    "/semesters/{sem_id}/subjects",
    response_model=SubjectOut,
    status_code=201,
    summary="Создать предмет и сразу инициализировать пустые оценки"
)
async def create_subject(
    sem_id: int,
    data: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_attendance_admin),
):
    subj = Subject(semester_id=sem_id, name=data.name)
    db.add(subj)
    await db.commit()
    await db.refresh(subj)

    q = await db.execute(
        select(AttendanceStudent.id)
        .where(AttendanceStudent.semester_id == sem_id)
    )
    student_ids = [row[0] for row in q.all()]

    for sid in student_ids:
        db.add(SubjectGrade(subject_id=subj.id, student_id=sid))
    await db.commit()

    return subj



@router.get(
    "/subjects/{subj_id}",
    response_model=SubjectOut,
    summary="Информация по одному предмету",
)
async def get_subject(
    subj_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_attendance_admin),
):
    q = await db.execute(
        select(Subject).where(Subject.id == subj_id)
    )
    subj = q.scalars().first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subj

# ─────────── УРОКИ ───────────
@router.get("/subjects/{subj_id}/lessons", response_model=list[LessonOut])
async def list_lessons(
    subj_id: int,
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(
        select(Lesson)
        .where(Lesson.subject_id == subj_id)
        .order_by(Lesson.id)
    )
    return q.scalars().all()


@router.post(
    "/subjects/{subj_id}/lessons",
    response_model=LessonOut,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить занятие (дату) по предмету"
)
async def create_lesson(subj_id: int, data: LessonCreate, db: AsyncSession = Depends(get_db)):
    lesson = Lesson(subject_id=subj_id, lesson_date=data.lesson_date)
    db.add(lesson)
    await db.flush()

    semester_id = (
        await db.execute(
          select(Subject.semester_id).where(Subject.id == subj_id)
        )
    ).scalar_one()

    student_ids = (
        await db.execute(
          select(AttendanceStudent.id).where(AttendanceStudent.semester_id == semester_id)
        )
    ).scalars().all()

    for sid in student_ids:
        db.add(Attendance(
            lesson_id=lesson.id,
            student_id=sid,
            status="н"
        ))

    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.delete(
    "/lessons/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить занятие"
)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_attendance_admin)
):
    q = await db.execute(
        select(Lesson)
        .join(Subject).join(AttendanceSemester).join(AttendanceGroup)
        .where(
            Lesson.id == lesson_id,
            AttendanceGroup.unit_id == admin.unit_id
        )
    )
    lesson = q.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Занятие не найдено")

    await db.execute(delete(Lesson).where(Lesson.id == lesson_id))
    await db.commit()


# ─────────── ПОСЕЩАЕМОСТЬ ───────────
@router.get("/lessons/{lesson_id}/attendances", response_model=list[AttendanceOut])
async def list_attendances(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(
        select(Attendance)
        .where(Attendance.lesson_id == lesson_id)
        .order_by(Attendance.student_id)
    )
    return q.scalars().all()




@router.put(
    "/attendances",
    response_model=list[AttendanceOut],
    summary="Массовое обновление статусов посещения"
)
async def update_attendances(
    updates: list[AttendanceUpdate],
    db: AsyncSession = Depends(get_db)
):
    for upd in updates:
        await db.execute(
            update(Attendance)
            .where(
                Attendance.lesson_id  == upd.lesson_id,
                Attendance.student_id == upd.student_id
            )
            .values(status=upd.status)
        )
    await db.commit()

    updated_rows = []
    for upd in updates:
        q = await db.execute(
            select(Attendance)
            .where(
                Attendance.lesson_id  == upd.lesson_id,
                Attendance.student_id == upd.student_id
            )
        )
        att = q.scalar_one_or_none()
        if att:
            updated_rows.append(att)

    return updated_rows


# ─────────── ОЦЕНКИ ───────────
@router.get("/subjects/{subj_id}/grades", response_model=list[GradeOut])
async def list_grades(
    subj_id: int,
    db: AsyncSession = Depends(get_db),
):
    q = await db.execute(
        select(SubjectGrade)
        .where(SubjectGrade.subject_id == subj_id)
        .order_by(SubjectGrade.student_id)
    )
    return q.scalars().all()


@router.put(
    "/grades",
    response_model=list[GradeOut],
    summary="Массовое обновление оценок"
)
async def update_grades(
    updates: list[GradeUpdate],
    db: AsyncSession = Depends(get_db)
):
    for upd in updates:
        await db.execute(
            update(SubjectGrade)
            .where(
                SubjectGrade.subject_id == upd.subject_id,
                SubjectGrade.student_id == upd.student_id
            )
            .values(
                control_1 = upd.control_1,
                control_2 = upd.control_2,
                exam      = upd.exam,
                retake    = upd.retake,
                commission = upd.commission
            )

        )
    await db.commit()

    refreshed: list[SubjectGrade] = []
    for upd in updates:
        q = await db.execute(
            select(SubjectGrade)
            .where(
                SubjectGrade.subject_id == upd.subject_id,
                SubjectGrade.student_id == upd.student_id
            )
        )
        grade = q.scalar_one_or_none()
        if grade:
            refreshed.append(grade)

    return refreshed

# ─────────── ПОСТРОЕНИЕ ТАБЛИЦ С ОЦЕНКАМИ ───────────
@router.get(
    "/analytics/grades-distribution",
    summary="Распределение оценок",
)
async def grades_distribution(
    sem_name:      str            = Query(..., description="Название семестра"),
    subject_name:  str            = Query(..., description="Название предмета"),
    grade_field:   str            = Query(
        "exam",
        regex="^(control_1|control_2|exam|retake|commission)$",
        description="Поле оценки"
    ),
    group_ids:     list[int] | None = Query(
        None, alias="group_ids[]",
        description="Список ID групп, `?group_ids[]=1&group_ids[]=2`"
    ),
    course:        int   | None   = Query(None, ge=1, le=4, description="Номер курса"),
    db:            AsyncSession   = Depends(get_db),
):
    sem_q = (
        select(AttendanceSemester.id)
        .join(AttendanceGroup, AttendanceSemester.group_id == AttendanceGroup.id)
        .where(AttendanceSemester.name == sem_name)
    )
    if group_ids is not None:
        sem_q = sem_q.where(AttendanceGroup.id.in_(group_ids))
    elif course is not None:
        sem_q = sem_q.where(
            func.substr(func.split_part(AttendanceGroup.name, "-", 2), 1, 1) == str(course)
        )
    else:
        raise HTTPException(400, "Нужно указать либо group_ids[], либо course")
    sem_ids = [r[0] for r in (await db.execute(sem_q)).all()]
    if not sem_ids:
        return {"buckets": []}

    stud_q = select(AttendanceStudent.id).where(
        AttendanceStudent.semester_id.in_(sem_ids)
    )
    student_ids = [r[0] for r in (await db.execute(stud_q)).all()]
    if not student_ids:
        return {"buckets": []}

    subj_q = select(Subject.id).where(
        Subject.name == subject_name,
        Subject.semester_id.in_(sem_ids)
    )
    subj_ids = [r[0] for r in (await db.execute(subj_q)).all()]
    if not subj_ids:
        return {"buckets": []}

    SG = SubjectGrade
    field_col = getattr(SG, grade_field)
    dist_q = await db.execute(
        select(
            func.coalesce(field_col, "–").label("grade"),
            func.count().label("count")
        )
        .where(
            SG.subject_id.in_(subj_ids),
            SG.student_id.in_(student_ids)
        )
        .group_by("grade")
        .order_by("grade")
    )
    buckets = [{"grade": g, "count": c} for g, c in dist_q.all()]
    return {"buckets": buckets}



@router.get(
    "/analytics/grades-summary",
    summary="Сводная статистика по экзаменам/доп.аттестации/комиссии",
    response_model=dict[str, int],
)
async def grades_summary(
    sem_name:      str            = Query(..., description="Название семестра"),
    subject_name:  str            = Query(..., description="Название предмета"),
    group_ids:     list[int] | None = Query(
        None, alias="group_ids[]",
        description="Список ID групп"
    ),
    course:        int   | None   = Query(None, ge=1, le=4, description="Номер курса"),
    db:            AsyncSession   = Depends(get_db),
):

    sem_q = (
        select(AttendanceSemester.id)
        .join(AttendanceGroup, AttendanceSemester.group_id == AttendanceGroup.id)
        .where(AttendanceSemester.name == sem_name)
    )
    if group_ids is not None:
        sem_q = sem_q.where(AttendanceGroup.id.in_(group_ids))
    elif course is not None:
        sem_q = sem_q.where(
            func.substr(func.split_part(AttendanceGroup.name, "-", 2), 1, 1) == str(course)
        )
    else:
        raise HTTPException(400, "Нужно указать либо group_ids[], либо course")
    sem_ids = [r[0] for r in (await db.execute(sem_q)).all()]
    if not sem_ids:
        return {k: 0 for k in ("total","exam_pass","retake_pass","commission_pass","commission_fail_2","commission_fail_ny")}

    stud_q = select(AttendanceStudent.id).where(
        AttendanceStudent.semester_id.in_(sem_ids)
    )
    student_ids = [r[0] for r in (await db.execute(stud_q)).all()]
    total = len(student_ids)

    subj_q = select(Subject.id).where(
        Subject.name == subject_name,
        Subject.semester_id.in_(sem_ids)
    )
    subj_ids = [r[0] for r in (await db.execute(subj_q)).all()]

    base = and_(
        SubjectGrade.subject_id.in_(subj_ids),
        SubjectGrade.student_id.in_(student_ids)
    )

    async def cnt(pred):
        q = await db.execute(
            select(func.count()).select_from(SubjectGrade).where(pred)
        )
        return q.scalar_one()

    exam_pass        = await cnt(base & SubjectGrade.exam.op('~')('^[0-9]+$') &
                                (cast(SubjectGrade.exam, Integer) >= 3))
    retake_pass      = await cnt(base & SubjectGrade.retake.op('~')('^[0-9]+$') &
                                (cast(SubjectGrade.retake, Integer) >= 3))
    commission_pass  = await cnt(base & SubjectGrade.commission.op('~')('^[0-9]+$') &
                                (cast(SubjectGrade.commission, Integer) >= 3))
    commission_fail_2 = await cnt(base & SubjectGrade.commission.op('~')('^[0-9]+$') &
                                (cast(SubjectGrade.commission, Integer) == 2))
    commission_fail_ny = await cnt(base & (SubjectGrade.commission == "Ня"))

    return {
        "total": total,
        "exam_pass":         exam_pass,
        "retake_pass":       retake_pass,
        "commission_pass":   commission_pass,
        "commission_fail_2": commission_fail_2,
        "commission_fail_ny":commission_fail_ny
    }

# ─────────── ФОРМИРОВАНИЕ СПИСКА ДОЛЖНИКОВ ───────────

@router.get("/analytics/debtors-export", summary="Экспорт списка должников")
async def export_debtors(
    sem_id:      int              = Query(..., description="ID семестра"),
    subject_id:  int              = Query(..., description="ID предмета"),
    grade_field: str             = Query(
        ..., regex="^(control_1|control_2|exam|retake|commission)$",
        description="Поле оценки"
    ),
    group_ids:   list[int] | None = Query(
        None, alias="group_ids[]",
        description="Список ID групп"
    ),
    course:      int | None       = Query(None, ge=1, le=4, description="Курс"),
    db:          AsyncSession     = Depends(get_db),
):
    stmt = (
        select(AttendanceStudent.id, AttendanceStudent.full_name)
        .join(AttendanceSemester,
              AttendanceStudent.semester_id == AttendanceSemester.id)
        .join(AttendanceGroup,
              AttendanceSemester.group_id == AttendanceGroup.id)
        .where(AttendanceSemester.id == sem_id)
    )
    if group_ids is not None:
        stmt = stmt.where(AttendanceGroup.id.in_(group_ids))
    elif course is not None:
        stmt = stmt.where(
            func.substr(func.split_part(AttendanceGroup.name, "-", 2), 1, 1)
            == str(course)
        )
    else:
        raise HTTPException(400, "Нужно указать либо group_ids, либо course")
    rows = (await db.execute(stmt)).all()
    if not rows:
        # пустой Excel
        df_empty = pd.DataFrame(columns=["Группа", "ФИО", "Семестр", "Дисциплина", "Форма", "Оценка"])
        buf = io.BytesIO()
        df_empty.to_excel(buf, index=False)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=debtors.xlsx"},
        )

    student_ids = [r[0] for r in rows]
    student_names = {r[0]: r[1] for r in rows}

    SG = SubjectGrade
    field_col = getattr(SG, grade_field)
    passed_cond = and_(
        field_col.op("~")("^[0-9]+$"),
        func.cast(field_col, func.INTEGER) >= 3
    )
    fail_cond = ~passed_cond

    q = (
        select(
            AttendanceGroup.name.label("Группа"),
            AttendanceStudent.full_name.label("ФИО"),
            AttendanceSemester.name.label("Семестр"),
            func.literal_column(f"'{grade_field}'").label("Форма"),
            field_col.label("Оценка"),
        )
        .select_from(SG)
        .join(AttendanceStudent, SG.student_id == AttendanceStudent.id)
        .join(AttendanceSemester, AttendanceStudent.semester_id == AttendanceSemester.id)
        .join(AttendanceGroup, AttendanceSemester.group_id == AttendanceGroup.id)
        .where(
            SG.subject_id == subject_id,
            AttendanceStudent.id.in_(student_ids),
            fail_cond
        )
        .order_by(AttendanceGroup.name, AttendanceStudent.full_name)
    )

    result = await db.execute(q)
    data = result.all()

    df = pd.DataFrame(data, columns=["Группа", "ФИО", "Семестр", "Форма", "Оценка"])
    df["Семестр №"] = df["Семестр"].str.extract(r"(\d+)$")

    buf = io.BytesIO()
    df.to_excel(buf, index=False)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=debtors.xlsx"},
    )

# ─────────── ИМПОРТ СТУДЕНТОВ ───────────

@router.post(
    "/semesters/{sem_id}/students/import",
    response_model=list[AttendanceStudentOut],
    status_code=status.HTTP_201_CREATED,
    summary="Импорт списка студентов из CSV/XLSX"
)
async def import_students(
    sem_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_attendance_admin),
):
    data = await file.read()
    if file.filename.lower().endswith(".csv"):
        text = data.decode("utf-8").splitlines()
        rows = list(csv.reader(text))
    else:
        import pandas as pd, io as _io
        df = pd.read_excel(_io.BytesIO(data), header=None)
        rows = df.fillna("").values.tolist()

    created = []
    for row in rows:
        if len(row) >= 2 and str(row[1]).strip():
            raw_num, raw_name = row[0], row[1]
        elif len(row) >= 1 and str(row[0]).strip():
            raw_num, raw_name = None, row[0]
        else:
            continue

        full_name = str(raw_name).strip()
        if raw_num is not None:
            try:
                num = int(raw_num)
            except:
                num = None
        else:
            num = None

        if num is None:
            res = await db.execute(
                select(func.coalesce(func.max(AttendanceStudent.student_number), 0))
                .where(AttendanceStudent.semester_id == sem_id)
            )
            num = res.scalar_one() + 1

        stud = AttendanceStudent(
            semester_id    = sem_id,
            full_name      = full_name,
            student_number = num
        )
        db.add(stud)
        await db.flush()

        lesson_ids = [
            lid for (lid,) in (
                await db.execute(
                    select(Lesson.id)
                    .join(Subject, Lesson.subject_id == Subject.id)
                    .where(Subject.semester_id == sem_id)
                )
            ).all()
        ]
        if lesson_ids:
            await db.execute(
                insert(Attendance),
                [{"lesson_id": lid, "student_id": stud.id, "status": "н"} for lid in lesson_ids]
            )

        subject_ids = [
            sid for (sid,) in (
                await db.execute(
                    select(Subject.id).where(Subject.semester_id == sem_id)
                )
            ).all()
        ]
        if subject_ids:
            await db.execute(
                insert(SubjectGrade),
                [{"subject_id": sid, "student_id": stud.id} for sid in subject_ids]
            )

        created.append(stud)

    await db.commit()
    for s in created:
        await db.refresh(s)
    return created


# ─────────── ПЕРЕВОД В СЛЕДУЮЩИЙ СЕМЕСТР ───────────
@router.post(
    "/semesters/{sem_id}/students/clone",
    response_model=list[AttendanceStudentOut],
    status_code=status.HTTP_201_CREATED,
    summary="Перевести студентов в другой семестр"
)
async def clone_students(
    sem_id: int,
    to_sem: int = Query(..., description="Куда клонировать студентов"),
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_attendance_admin),
):

    orig = (await db.execute(
        select(AttendanceStudent).where(AttendanceStudent.semester_id == sem_id)
    )).scalars().all()

    created = []
    for s in orig:
        clone = AttendanceStudent(
            semester_id     = to_sem,
            full_name       = s.full_name,
            student_number  = s.student_number,
        )
        db.add(clone)
        await db.flush()

        lesson_ids = [
            lid for (lid,) in (
                await db.execute(
                    select(Lesson.id)
                    .join(Subject, Lesson.subject_id == Subject.id)
                    .where(Subject.semester_id == to_sem)
                )
            ).all()
        ]
        if lesson_ids:
            await db.execute(
                insert(Attendance),
                [{"lesson_id": lid, "student_id": clone.id, "status": "н"} for lid in lesson_ids]
            )

        subject_ids = [
            sid for (sid,) in (
                await db.execute(
                    select(Subject.id).where(Subject.semester_id == to_sem)
                )
            ).all()
        ]
        if subject_ids:
            await db.execute(
                insert(SubjectGrade),
                [{"subject_id": sid, "student_id": clone.id} for sid in subject_ids]
            )

        created.append(clone)

    await db.commit()
    for c in created:
        await db.refresh(c)
    return created