from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import json
import datetime

from database import SessionLocal, engine, Student, Log, FaceDescriptor, TeacherFaceDescriptor, Period, Leave

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Models ---
class StudentCreate(BaseModel):
    id: int
    name: str

class LogCreate(BaseModel):
    studentId: str
    studentName: str
    time: str
    fullDate: str
    period: str
    teacher: str
    location: str | None = None
    isLate: bool = False
    txHash: str

class FaceDescriptorCreate(BaseModel):
    descriptor: Dict[str, Any]

class PeriodCreate(BaseModel):
    periodName: str

class LeaveCreate(BaseModel):
    studentId: str
    date: str
    reason: str

class LeaveStatusUpdate(BaseModel):
    status: str

# --- Routes ---

# 1. Students
@app.get("/api/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    if not students:
        # Default students
        default_students = [
            {"id": 1, "name": "Affrin"}, {"id": 2, "name": "SyedaSafiya"},
            {"id": 3, "name": "Sibitha"}, {"id": 4, "name": "Akshita"},
            {"id": 5, "name": "Kusuma"}, {"id": 6, "name": "Sheetal"},
            {"id": 7, "name": "Divya"}, {"id": 8, "name": "saara"},
            {"id": 9, "name": "Gowri"}, {"id": 10, "name": "IfthazNoor"}
        ]
        for ds in default_students:
            db.add(Student(id=ds["id"], name=ds["name"]))
        db.commit()
        students = db.query(Student).all()
    return students

@app.post("/api/students")
def save_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(Student).filter(Student.id == student.id).first()
    if db_student:
        db_student.name = student.name
    else:
        new_student = Student(id=student.id, name=student.name)
        db.add(new_student)
    db.commit()
    return {"message": "Success"}

@app.delete("/api/students/{student_id}")
def remove_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if db_student:
        db.delete(db_student)
        db.commit()
    return {"message": "Success"}

# 2. Periods
@app.get("/api/periods/{teacher}")
def get_periods(teacher: str, db: Session = Depends(get_db)):
    periods = db.query(Period).filter(Period.teacherName == teacher).all()
    if not periods:
        default_subjects = {
            'Ms.Soumya': ['AI', 'Web Content System Management'],
            'Ms.Sujatha': ['FDS'],
            'Ms.Selva Priya': ['PHP and MySQL']
        }
        defaults = default_subjects.get(teacher, [])
        for d in defaults:
            db.add(Period(teacherName=teacher, periodName=d))
        db.commit()
        periods = db.query(Period).filter(Period.teacherName == teacher).all()
    return [p.periodName for p in periods]

@app.post("/api/periods/{teacher}")
def save_period(teacher: str, period: PeriodCreate, db: Session = Depends(get_db)):
    existing = db.query(Period).filter(Period.teacherName == teacher, Period.periodName == period.periodName).first()
    if not existing and period.periodName.strip():
        db.add(Period(teacherName=teacher, periodName=period.periodName.strip()))
        db.commit()
    return {"message": "Success"}

@app.delete("/api/periods/{teacher}/{period_name}")
def remove_period(teacher: str, period_name: str, db: Session = Depends(get_db)):
    period = db.query(Period).filter(Period.teacherName == teacher, Period.periodName == period_name).first()
    if period:
        db.delete(period)
        db.commit()
    return {"message": "Success"}

# 3. Logs
@app.get("/api/logs")
def get_logs(db: Session = Depends(get_db)):
    logs = db.query(Log).all()
    # return logs with boolean parsed correctly
    return [
        {
            "id": log.id,
            "studentId": log.studentId,
            "studentName": log.studentName,
            "time": log.time,
            "fullDate": log.fullDate,
            "period": log.period,
            "teacher": log.teacher,
            "location": log.location,
            "isLate": log.isLate,
            "txHash": log.txHash,
            "timestamp": log.timestamp
        }
        for log in logs
    ]

@app.post("/api/logs")
def save_log(log: LogCreate, db: Session = Depends(get_db)):
    new_log = Log(
        studentId=log.studentId,
        studentName=log.studentName,
        time=log.time,
        fullDate=log.fullDate,
        period=log.period,
        teacher=log.teacher,
        location=log.location,
        isLate=log.isLate,
        txHash=log.txHash,
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    db.add(new_log)
    db.commit()
    return {"message": "Success"}

@app.delete("/api/logs")
def clear_logs(db: Session = Depends(get_db)):
    db.query(Log).delete()
    db.commit()
    return {"message": "Success"}

# 4. Faces
@app.get("/api/faces")
def get_face_descriptors(db: Session = Depends(get_db)):
    faces = db.query(FaceDescriptor).all()
    result = {}
    for f in faces:
        result[f.studentId] = json.loads(f.descriptor)
    return result

@app.post("/api/faces/{student_id}")
def save_face_descriptor(student_id: str, descriptor_data: FaceDescriptorCreate, db: Session = Depends(get_db)):
    existing = db.query(FaceDescriptor).filter(FaceDescriptor.studentId == student_id).first()
    desc_str = json.dumps(descriptor_data.descriptor)
    if existing:
        existing.descriptor = desc_str
    else:
        db.add(FaceDescriptor(studentId=student_id, descriptor=desc_str))
    db.commit()
    return {"message": "Success"}

@app.delete("/api/faces/{student_id}")
def remove_face_descriptor(student_id: str, db: Session = Depends(get_db)):
    existing = db.query(FaceDescriptor).filter(FaceDescriptor.studentId == student_id).first()
    if existing:
        db.delete(existing)
        db.commit()
    return {"message": "Success"}

# 5. Teacher Faces
@app.get("/api/teacher-faces")
def get_teacher_face_descriptors(db: Session = Depends(get_db)):
    faces = db.query(TeacherFaceDescriptor).all()
    result = {}
    for f in faces:
        result[f.teacherName] = json.loads(f.descriptor)
    return result

@app.post("/api/teacher-faces/{teacher_name}")
def save_teacher_face_descriptor(teacher_name: str, descriptor_data: FaceDescriptorCreate, db: Session = Depends(get_db)):
    existing = db.query(TeacherFaceDescriptor).filter(TeacherFaceDescriptor.teacherName == teacher_name).first()
    desc_str = json.dumps(descriptor_data.descriptor)
    if existing:
        existing.descriptor = desc_str
    else:
        db.add(TeacherFaceDescriptor(teacherName=teacher_name, descriptor=desc_str))
    db.commit()
    return {"message": "Success"}

@app.delete("/api/teacher-faces/{teacher_name}")
def remove_teacher_face_descriptor(teacher_name: str, db: Session = Depends(get_db)):
    existing = db.query(TeacherFaceDescriptor).filter(TeacherFaceDescriptor.teacherName == teacher_name).first()
    if existing:
        db.delete(existing)
        db.commit()
    return {"message": "Success"}

# 6. Leaves
@app.get("/api/leaves")
def get_leaves(db: Session = Depends(get_db)):
    leaves = db.query(Leave).all()
    return [
        {
            "id": l.id,
            "studentId": l.studentId,
            "date": l.date,
            "reason": l.reason,
            "status": l.status,
            "timestamp": l.timestamp
        } for l in leaves
    ]

@app.post("/api/leaves")
def submit_leave(leave: LeaveCreate, db: Session = Depends(get_db)):
    new_id = "leave_" + str(int(datetime.datetime.now().timestamp() * 1000))
    new_leave = Leave(
        id=new_id,
        studentId=leave.studentId,
        date=leave.date,
        reason=leave.reason,
        status="Pending",
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    db.add(new_leave)
    db.commit()
    return {"message": "Success", "id": new_id}

@app.put("/api/leaves/{leave_id}/status")
def update_leave_status(leave_id: str, update_data: LeaveStatusUpdate, db: Session = Depends(get_db)):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if leave:
        leave.status = update_data.status
        db.commit()
    return {"message": "Success"}
