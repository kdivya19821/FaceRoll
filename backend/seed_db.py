import sqlite3
import datetime
import random
import hashlib
import json
import os
import sys

# Add backend folder to path so we can import from database.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import Base, engine

def generate_hash(payload):
    data = json.dumps(payload, sort_keys=True).encode('utf-8')
    return '0x' + hashlib.sha256(data).hexdigest()

def seed():
    # Drop and recreate all tables to ensure the latest schema (including room columns) is applied
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database tables recreated successfully!")

    conn = sqlite3.connect('faceroll.db')
    cursor = conn.cursor()

    students = [
        {'id': '1', 'name': 'Affrin'},
        {'id': '2', 'name': 'SyedaSafiya'},
        {'id': '3', 'name': 'Sibitha'},
        {'id': '4', 'name': 'Akshita'},
        {'id': '5', 'name': 'Kusuma'},
        {'id': '6', 'name': 'Sheetal'},
        {'id': '7', 'name': 'Divya'},
        {'id': '8', 'name': 'saara'},
        {'id': '9', 'name': 'Gowri'},
        {'id': '10', 'name': 'IfthazNoor'}
    ]

    schedule = [
        {'teacher': 'Ms.Soumya', 'period': 'AI', 'time': '09:00'},
        {'teacher': 'Ms.Soumya', 'period': 'Web Content System Management', 'time': '11:30'},
        {'teacher': 'Ms.Sujatha', 'period': 'FDS', 'time': '09:00'},
        {'teacher': 'Ms.Selva Priya', 'period': 'PHP and MySQL', 'time': '09:45'},
        {'teacher': 'Ms.Veena', 'period': 'Maths', 'time': '11:30'}
    ]

    # Seed 2. Periods (Timetable)
    # We will seed slots for different days of the week
    periods_to_insert = [
        # Monday
        ('Ms.Soumya', 'AI', '09:00', '09:45', 'Room 101', '#10b981'),
        ('Ms.Soumya', 'Web Content System Management', '11:30', '12:15', 'Room 102', '#8b5cf6'),
        # Tuesday
        ('Ms.Sujatha', 'FDS', '09:00', '09:45', 'Room 103', '#3b82f6'),
        # Wednesday
        ('Ms.Selva Priya', 'PHP and MySQL', '09:45', '10:30', 'Room 104', '#f59e0b'),
        # Thursday
        ('Ms.Veena', 'Maths', '11:30', '12:15', 'Room 105', '#ec4899')
    ]
    cursor.executemany("""
        INSERT INTO periods (teacherName, periodName, startTime, endTime, room, color)
        VALUES (?, ?, ?, ?, ?, ?);
    """, periods_to_insert)
    print(f"Seeded {len(periods_to_insert)} timetable periods!")

    # Seed 3. Leaves (Leave Requests)
    leaves_to_insert = [
        ('leave_1', '5', '2026-05-18', 'Severe fever and body pain', 'Pending', datetime.datetime.now().isoformat()),
        ('leave_2', '7', '2026-05-19', 'Attending sister\'s wedding ceremony', 'Approved', datetime.datetime.now().isoformat()),
        ('leave_3', '8', '2026-05-15', 'Going to hometown for family function', 'Rejected', datetime.datetime.now().isoformat())
    ]
    cursor.executemany("""
        INSERT INTO leaves (id, studentId, date, reason, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?);
    """, leaves_to_insert)
    print(f"Seeded {len(leaves_to_insert)} student leave requests!")

    today = datetime.date.today()
    logs_to_insert = []
    
    # Generate 30 days of highly realistic historical attendance
    for day_offset in range(30, -1, -1):
        current_date = today - datetime.timedelta(days=day_offset)
        
        # Skip weekends
        if current_date.weekday() >= 5:
            continue
            
        date_str = current_date.strftime('%a %b %d %Y') # e.g. "Mon May 18 2026"
        day_name = current_date.strftime('%A')          # e.g. "Monday"
        
        # For each scheduled subject on this day
        for class_info in schedule:
            # Most days this class happens
            if random.random() > 0.9: 
                continue
                
            # Loop through all students to assign attendance status
            for student in students:
                # 85% attendance rate on average
                is_present = random.random() < 0.85
                is_late = False
                is_absent = False
                
                if is_present:
                    # 15% chance of being late
                    is_late = random.random() < 0.15
                    # Random scan time within the class period
                    min_offset = random.randint(3, 9) if is_late else random.randint(0, 2)
                    hour, minute = map(int, class_info['time'].split(':'))
                    scan_time = datetime.datetime.combine(current_date, datetime.time(hour, minute)) + datetime.timedelta(minutes=min_offset)
                    time_str = scan_time.strftime('%I:%M %p')
                else:
                    is_absent = True
                    time_str = '--:--'

                # We log both present and absent students!
                if is_present or (is_absent and random.random() < 0.3):
                    payload = {
                        'studentId': student['id'],
                        'time': time_str,
                        'fullDate': date_str,
                        'teacher': class_info['teacher']
                    }
                    tx_hash = generate_hash(payload)
                    timestamp_str = datetime.datetime.combine(current_date, datetime.datetime.now().time()).isoformat()
                    
                    logs_to_insert.append((
                        student['id'],
                        student['name'],
                        time_str,
                        date_str,
                        class_info['period'],
                        class_info['teacher'],
                        None, # location
                        1 if is_late else 0,
                        1 if is_absent else 0,
                        tx_hash,
                        timestamp_str
                    ))

    # Insert into SQLite logs table
    cursor.executemany("""
        INSERT INTO logs (studentId, studentName, time, fullDate, period, teacher, location, isLate, isAbsent, txHash, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, logs_to_insert)
    
    conn.commit()
    print(f"Successfully seeded {len(logs_to_insert)} highly realistic attendance records!")
    conn.close()

if __name__ == '__main__':
    seed()
