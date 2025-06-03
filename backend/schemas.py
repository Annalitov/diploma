from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import List, Optional

class AdminCreate(BaseModel):
    name: str
    email: str
    password: str
    format_id: int
    ppo_id: int
    role: str = "viewer"

class Token(BaseModel):
    access_token: str
    token_type: str

class FormatBase(BaseModel):
    name: str
    description: Optional[str]

class FormatOut(FormatBase):
    id: int
    class Config:
        from_attributes = True


class PPOUnitBase(BaseModel):
    name: str
    format_id: int

class PPOUnitOut(PPOUnitBase):
    id: int
    class Config:
        from_attributes = True


class GroupBase(BaseModel):
    name: str
    ppo_id: int

class GroupOut(GroupBase):
    id: int
    class Config:
        from_attributes = True


class UnionMemberBase(BaseModel):
    full_name: str
    birth_date: date
    gender: str
    phone: Optional[str]
    email: Optional[str]
    funding_type: str
    group_id: int
    year: int
    status: Optional[str] = "состоит"

class UnionMemberOut(UnionMemberBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


class PaymentPeriodBase(BaseModel):
    period_name: str
    format_id: int

class PaymentPeriodOut(PaymentPeriodBase):
    id: int
    class Config:
        from_attributes = True


class UnionPaymentBase(BaseModel):
    member_id: int
    period_id: int
    paid: str
    paid_at: Optional[datetime]

class UnionPaymentOut(UnionPaymentBase):
    id: int
    class Config:
        from_attributes = True

class UnionMemberCreate(BaseModel):
    group_input: str
    year: int
    full_name: str
    birth_date: date
    gender: str
    phone: str | None = None
    email: EmailStr | None = None
    funding_type: str  # 'Бюджет' или 'Платное'
    year: int
    status: Optional[str] = "состоит"

class UnionMemberResponse(BaseModel):
    id: int
    full_name: str
    group_name: str
    ppo_name: str
    birth_date: date
    gender: str
    phone: Optional[str]
    email: Optional[str]
    funding_type: str
    year: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UnionMemberUpdate(BaseModel):
    group_input: Optional[str] = None
    group_id: Optional[int] = None
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    funding_type: Optional[str] = None
    year: Optional[int] = None
    status: Optional[str] = None


class PaymentStatusResponse(BaseModel):
    id:         int
    full_name:  str
    group_name: str
    paid:       str

class PaymentPeriodResponse(BaseModel):
    period_name: str


class PaymentDetailResponse(BaseModel):
    period_name: str
    paid:        str

class PaymentUpdateRequest(BaseModel):
    member_id: int
    period_name: str
    paid: str  # "-", "0", "1"

from pydantic import BaseModel

class PaymentPeriodCreate(BaseModel):
    format_id: int
    period_name: str



class AttendanceAdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    unit_id: int               # ссылка на attendance_units.id
    role: str = "viewer" 


class AttendanceAdminOut(BaseModel):
    id:             int
    name:           str
    email:          EmailStr
    unit_id:        int
    role:           str

    class Config:
        orm_mode = True

class AttendanceGroupCreate(BaseModel):
    name: str

class AttendanceGroupOut(BaseModel):
    id:   int
    name: str

    model_config = {"from_attributes": True}


class AttendanceSemesterOut(BaseModel):
    id:         int
    name:       str
    start_date: date | None
    end_date:   date | None

    model_config = {"from_attributes": True}


class AttendanceSemesterCreate(BaseModel):
    name:       str
    start_date: date | None = None
    end_date:   date | None = None

class AttendanceGroupUpdate(BaseModel):
    name: str

class AttendanceStudentCreate(BaseModel):
    full_name: str

class AttendanceStudentOut(BaseModel):
    id: int
    full_name: str
    student_number: int

    model_config = {"from_attributes": True}

class SubjectCreate(BaseModel):
    name: str


class SubjectOut(BaseModel):
    id:   int
    name: str

    model_config = {"from_attributes": True}

class LessonCreate(BaseModel):
    lesson_date: date

class LessonOut(LessonCreate):
    id: int
    subject_id: int

    model_config = {"from_attributes": True}


class AttendanceUpdate(BaseModel):
    lesson_id: int
    student_id: int
    status: str  # '+', 'н', 'б'


class AttendanceOut(AttendanceUpdate):
    id: int

    model_config = {"from_attributes": True}


class GradeUpdate(BaseModel):
    subject_id: int
    student_id: int
    control_1: Optional[str] = None
    control_2: Optional[str] = None
    exam:      Optional[str] = None
    retake:    Optional[str] = None
    commission: Optional[str] = None

class GradeOut(BaseModel):
    id:         int
    subject_id: int
    student_id: int
    control_1:  Optional[str]
    control_2:  Optional[str]
    exam:       Optional[str]
    retake:     Optional[str]
    commission: Optional[str]

    model_config = {
        "from_attributes": True
    }

class GradeBucket(BaseModel):
    grade: str
    count: int

class GradesDistribution(BaseModel):
    subject_id: int
    buckets: list[GradeBucket]