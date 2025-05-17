from sqlalchemy import Column, Integer, String, ForeignKey, Date, CHAR, TIMESTAMP, CheckConstraint,UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database import Base


# 1. Таблица форматов учета
class Format(Base):
    __tablename__ = "formats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String)

    ppo_units = relationship("PPOUnit", back_populates="format")

    attendance_units = relationship(
        "AttendanceUnit",
        back_populates="format",
        cascade="all, delete-orphan"
    )

#  ПРОФСОЮЗ

# 2. Таблица подразделений ППО
class PPOUnit(Base):
    __tablename__ = "ppo_units"

    id = Column(Integer, primary_key=True, index=True)
    format_id = Column(Integer, ForeignKey("formats.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), unique=True, nullable=False)

    format = relationship("Format", back_populates="ppo_units")
    groups = relationship("Group", back_populates="ppo_unit")

# 3. Таблица администраторов ППО
class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    format_id = Column(Integer, ForeignKey("formats.id"), nullable=False)
    ppo_id = Column(Integer, ForeignKey("ppo_units.id"), nullable=False)
    role = Column(String, default="viewer")

# 4. Таблица групп, относящихся к подразделениям ППО
class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    ppo_id = Column(Integer, ForeignKey("ppo_units.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), unique=True, nullable=False)

    ppo_unit = relationship("PPOUnit", back_populates="groups")
    members = relationship("UnionMember", back_populates="group")


# 5. Таблица членов профсоюза
class UnionMember(Base):
    __tablename__ = "union_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    birth_date = Column(Date, nullable=False)
    gender = Column(CHAR(1), nullable=False)
    phone = Column(String(20))
    email = Column(String(255), unique=True)
    funding_type = Column(String(50))
    created_at = Column(TIMESTAMP)
    year = Column(Integer)
    status = Column(String(50), default="состоит")
    group_suffix = Column(String(10))

    group = relationship("Group", back_populates="members")
    payments = relationship("UnionPayment", back_populates="member")


# 6. Таблица периодов уплаты взносов
class PaymentPeriod(Base):
    __tablename__ = "payment_periods"

    id = Column(Integer, primary_key=True, index=True)
    format_id = Column(Integer, ForeignKey("formats.id", ondelete="CASCADE"), nullable=False)
    period_name = Column(String(20), unique=True, nullable=False)

    payments = relationship("UnionPayment", back_populates="period")


# 7. Таблица отметок об уплате взносов
class UnionPayment(Base):
    __tablename__ = "union_payments"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("union_members.id", ondelete="CASCADE"), nullable=False)
    period_id = Column(Integer, ForeignKey("payment_periods.id", ondelete="CASCADE"), nullable=False)
    paid = Column(String(2), nullable=False)
    paid_at = Column(TIMESTAMP)

    member = relationship("UnionMember", back_populates="payments")
    period = relationship("PaymentPeriod", back_populates="payments")


#  ДЕКАНАТ / УЧЁТ ПОСЕЩАЕМОСТИ

# 2. таблица факультета

class AttendanceUnit(Base):
    __tablename__ = "attendance_units"

    id        = Column(Integer, primary_key=True, index=True)
    format_id = Column(Integer, ForeignKey("formats.id", ondelete="CASCADE"), nullable=False)
    name      = Column(String(255), unique=True, nullable=False)

    format = relationship("Format", back_populates="attendance_units")
    groups = relationship("AttendanceGroup", back_populates="unit")
    admins = relationship("AttendanceAdmin", back_populates="unit")

# 3. таблица администраторов деканата
class AttendanceAdmin(Base):

    __tablename__ = "attendance_admins"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    unit_id = Column(Integer, ForeignKey("attendance_units.id", ondelete="CASCADE"), nullable=False)
    role    = Column(String, default="admin")

    unit = relationship("AttendanceUnit", back_populates="admins")



# 4. таблица групп

class AttendanceGroup(Base):
    __tablename__ = "attendance_groups"

    id      = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("attendance_units.id", ondelete="CASCADE"), nullable=False)
    name    = Column(String(255), unique=True, nullable=False)

    unit      = relationship("AttendanceUnit", back_populates="groups")
    semesters = relationship("AttendanceSemester", back_populates="group")


# 5. таблица семестров

class AttendanceSemester(Base):
    __tablename__ = "attendance_semesters"

    id        = Column(Integer, primary_key=True, index=True)
    group_id  = Column(Integer, ForeignKey("attendance_groups.id", ondelete="CASCADE"), nullable=False)
    name      = Column(String(100), nullable=False)
    start_date = Column(Date)
    end_date   = Column(Date)

    group    = relationship("AttendanceGroup", back_populates="semesters")
    students = relationship("AttendanceStudent", back_populates="semester")
    subjects = relationship("Subject", back_populates="semester")

# 6. таблица студентов

class AttendanceStudent(Base):
    __tablename__ = "attendance_students"

    id             = Column(Integer, primary_key=True, index=True)
    semester_id    = Column(Integer,ForeignKey("attendance_semesters.id", ondelete="CASCADE"),nullable=False,)
    full_name      = Column(String(255), nullable=False)
    student_number = Column(Integer, nullable=False)

    semester    = relationship("AttendanceSemester", back_populates="students")
    attendances = relationship("Attendance",    back_populates="student", passive_deletes=True,)
    grades      = relationship("SubjectGrade",  back_populates="student", passive_deletes=True,)

    __table_args__ = (
        UniqueConstraint("semester_id", "student_number",
                         name="uniq_semester_student_number"),
    )



# 7. таблица предметов

class Subject(Base):
    __tablename__ = "subjects"

    id          = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("attendance_semesters.id", ondelete="CASCADE"), nullable=False)
    name        = Column(String(255), nullable=False)

    semester = relationship("AttendanceSemester", back_populates="subjects")
    lessons  = relationship("Lesson", back_populates="subject")
    grades   = relationship("SubjectGrade", back_populates="subject")


# 8. таблица занятий

class Lesson(Base):
    __tablename__ = "lessons"

    id         = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    lesson_date = Column(Date, nullable=False)

    subject     = relationship("Subject", back_populates="lessons")
    attendances = relationship("Attendance", back_populates="lesson")


# 9. таблица посещаемости

class Attendance(Base):
    __tablename__ = "attendances"

    id         = Column(Integer, primary_key=True, index=True)
    lesson_id  = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("attendance_students.id", ondelete="CASCADE"), nullable=False)
    status     = Column(String(2), nullable=False, server_default="н")  # '+', 'н', 'б'

    lesson  = relationship("Lesson", back_populates="attendances")
    student = relationship("AttendanceStudent", back_populates="attendances")

    __table_args__ = (
        CheckConstraint("status IN ('+', 'н', 'б')", name="attendance_status_chk"),
        UniqueConstraint("lesson_id", "student_id", name="uniq_lesson_student"),
    )

# 10. таблица оценок

class SubjectGrade(Base):
    __tablename__ = "subject_grades"

    id         = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("attendance_students.id", ondelete="CASCADE"), nullable=False)

    control_1 = Column(String(2))
    control_2 = Column(String(2))
    exam      = Column(String(2))
    retake    = Column(String(2))
    commission = Column(String(2))

    subject = relationship("Subject", back_populates="grades")
    student = relationship("AttendanceStudent", back_populates="grades")

    __table_args__ = (
        CheckConstraint("control_1 IS NULL OR control_1 IN ('0', '1', '2','3','4','5','Ня','Нд')", name="grade_ctrl1_chk"),
        CheckConstraint("control_2 IS NULL OR control_2 IN ('0', '1', '2','3','4','5','Ня','Нд')", name="grade_ctrl2_chk"),
        CheckConstraint("exam IS NULL OR exam IN ('0', '1', '2','3','4','5','Ня','Нд', 'Зч')", name="grade_exam_chk"),
        CheckConstraint("retake IS NULL OR retake IN ('0', '1', '2','3','4','5','Ня','Нд', 'Зч')", name="grade_retake_chk"),
        CheckConstraint("commission IS NULL OR commission IN ('0', '1', '2','3','4','5','Ня','Нд', 'Зч')", name="grade_commission_chk"),
        UniqueConstraint("subject_id", "student_id", name="uniq_subject_student"),
    )
