from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.deps import get_current_attendance_admin
from backend.models import AttendanceGroup, AttendanceSemester, AttendanceStudent, SubjectGrade, Subject
from backend.schemas import GradesDistribution, GradeBucket

router = APIRouter(
    prefix="/api/attendance/analytics",
    tags=["Analytics"],
    dependencies=[Depends(get_current_attendance_admin)],
)

@router.get(
    "/grades-distribution",
    response_model=GradesDistribution,
    summary="Распределение оценок по предмету для заданной группы и семестра"
)
async def grades_distribution(
    group_id:   int            = Query(..., description="ID группы"),
    sem_id:     int            = Query(..., description="ID семестра"),
    subject_id: int            = Query(..., description="ID предмета"),
    db:         AsyncSession   = Depends(get_db),
):
    sem = (await db.execute(
        select(AttendanceSemester)
        .where(AttendanceSemester.id == sem_id,
               AttendanceSemester.group_id == group_id)
    )).scalar_one_or_none()
    if not sem:
        raise HTTPException(404, "Семестр не найден в этой группе")

    subj = (await db.execute(
        select(Subject)
        .where(Subject.id == subject_id,
               Subject.semester_id == sem_id)
    )).scalar_one_or_none()
    if not subj:
        raise HTTPException(404, "Предмет не найден в этом семестре")

    student_ids = [
        sid for (sid,) in (
            await db.execute(
                select(AttendanceStudent.id)
                .where(AttendanceStudent.semester_id == sem_id)
            )
        ).all()
    ]
    if not student_ids:
        return GradesDistribution(subject_id=subject_id, buckets=[])

    rows = await db.execute(
        select(SubjectGrade.exam, func.count())
        .where(
            SubjectGrade.subject_id == subject_id,
            SubjectGrade.student_id.in_(student_ids)
        )
        .group_by(SubjectGrade.exam)
    )
    buckets = [ GradeBucket(grade=g or "—", count=c) for (g, c) in rows.all() ]

    return GradesDistribution(subject_id=subject_id, buckets=buckets)
