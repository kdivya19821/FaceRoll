from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./faceroll.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    studentId = Column(String, index=True)
    studentName = Column(String)
    time = Column(String)
    fullDate = Column(String)
    period = Column(String)
    teacher = Column(String)
    location = Column(String, nullable=True)
    isLate = Column(Boolean, default=False)
    txHash = Column(String)
    timestamp = Column(String)

class FaceDescriptor(Base):
    __tablename__ = "face_descriptors"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    studentId = Column(String, unique=True, index=True)
    descriptor = Column(String)  # We will store the JSON stringified array here

class TeacherFaceDescriptor(Base):
    __tablename__ = "teacher_face_descriptors"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacherName = Column(String, unique=True, index=True)
    descriptor = Column(String)

class Period(Base):
    __tablename__ = "periods"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacherName = Column(String, index=True)
    periodName = Column(String)

class Leave(Base):
    __tablename__ = "leaves"
    id = Column(String, primary_key=True, index=True)
    studentId = Column(String, index=True)
    date = Column(String)
    reason = Column(String)
    status = Column(String, default="Pending")
    timestamp = Column(String)

# Create all tables
Base.metadata.create_all(bind=engine)
