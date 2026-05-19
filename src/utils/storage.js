const STORAGE_KEY = 'smart_attendance_logs';
const FACE_DATA_KEY = 'smart_attendance_faces';
const TEACHER_KEY = 'smart_attendance_teacher';
const PERIODS_KEY = 'smart_attendance_periods';
const STUDENT_LIST_KEY = 'smart_attendance_student_list';
const TIMETABLE_KEY = 'smart_attendance_timetable';
const TEACHER_FACE_DATA_KEY = 'smart_attendance_teacher_faces';
const LEAVES_KEY = 'smart_attendance_leaves';
const TEACHER_LIST_KEY = 'smart_attendance_teacher_list';

const DEFAULT_STUDENTS = [
    { id: '1', name: 'Affrin', password: 'affrin@faceroll' },
    { id: '2', name: 'SyedaSafiya', password: 'syedasafiya@faceroll' },
    { id: '3', name: 'Sibitha', password: 'sibitha@faceroll' },
    { id: '4', name: 'Akshita', password: 'akshita@faceroll' },
    { id: '5', name: 'Kusuma', password: 'kusuma@faceroll' },
    { id: '6', name: 'Sheetal', password: 'sheetal@faceroll' },
    { id: '7', name: 'Divya', password: 'divya@faceroll' },
    { id: '8', name: 'saara', password: 'saara@faceroll' },
    { id: '9', name: 'Gowri', password: 'gowri@faceroll' },
    { id: '10', name: 'IfthazNoor', password: 'ifthaznoor@faceroll' }
];

const DEFAULT_TEACHERS = [
    { name: 'Ms.Soumya', password: 'soumya@faceroll', subjects: ['AI', 'Web Content System Management'] },
    { name: 'Ms.Sujatha', password: 'sujatha@faceroll', subjects: ['FDS'] },
    { name: 'Ms.Selva Priya', password: 'selvapriya@faceroll', subjects: ['PHP and MySQL'] },
    { name: 'Ms.Veena', password: 'veena@faceroll', subjects: ['Maths'] }
];

export function getTeacherPasswords() {
    const teachers = getTeachers();
    const passwords = {};
    teachers.forEach(t => { passwords[t.name] = t.password; });
    return passwords;
}

export function getTeacherSubjects() {
    const teachers = getTeachers();
    const subjects = {};
    teachers.forEach(t => { subjects[t.name] = t.subjects || []; });
    return subjects;
}

// Helper to sync local data from backend
export async function syncFromBackend(endpoint, key, defaultData = null) {
    try {
        const res = await fetch(`/api/${endpoint}`);
        if (res.ok) {
            const data = await res.json();
            if (Object.keys(data).length > 0) {
                localStorage.setItem(key, JSON.stringify(data));
            }
        }
    } catch (e) {
        console.error(`Failed to sync ${endpoint} from backend:`, e);
        if (defaultData && !localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(defaultData));
        }
    }
}

// Initial Sync trigger (runs in background)
setTimeout(() => {
    syncFromBackend('students', STUDENT_LIST_KEY, DEFAULT_STUDENTS);
    syncFromBackend('teachers', TEACHER_LIST_KEY, DEFAULT_TEACHERS);
    syncFromBackend('logs', STORAGE_KEY, []);
    syncFromBackend('faces', FACE_DATA_KEY, {});
    syncFromBackend('teacher-faces', TEACHER_FACE_DATA_KEY, {});
    syncFromBackend('leaves', LEAVES_KEY, []);
    
    const teacher = getCurrentTeacher();
    if (teacher) {
        syncFromBackend(`periods/${teacher}`, PERIODS_KEY + '_' + teacher);
    }
}, 1000);


export function getStudents() {
    const list = localStorage.getItem(STUDENT_LIST_KEY);
    if (!list) {
        localStorage.setItem(STUDENT_LIST_KEY, JSON.stringify(DEFAULT_STUDENTS));
        return DEFAULT_STUDENTS;
    }
    return JSON.parse(list);
}

export function saveStudent(student) {
    const students = getStudents();
    const existing = students.find(s => s.id.toString() === student.id.toString());
    if (existing) {
        existing.name = student.name;
    } else {
        students.push(student);
    }
    localStorage.setItem(STUDENT_LIST_KEY, JSON.stringify(students));

    // Sync to backend
    fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
    }).catch(e => console.error(e));
}

export function removeStudent(studentId) {
    const students = getStudents().filter(s => s.id !== studentId);
    localStorage.setItem(STUDENT_LIST_KEY, JSON.stringify(students));

    // Sync to backend
    fetch(`/api/students/${studentId}`, { method: 'DELETE' }).catch(e => console.error(e));
}

export function getTeachers() {
    const list = localStorage.getItem(TEACHER_LIST_KEY);
    if (!list) {
        localStorage.setItem(TEACHER_LIST_KEY, JSON.stringify(DEFAULT_TEACHERS));
        return DEFAULT_TEACHERS;
    }
    return JSON.parse(list);
}

export function saveTeacher(teacher) {
    const teachers = getTeachers();
    const existing = teachers.find(t => t.name === teacher.name);
    if (existing) {
        existing.password = teacher.password;
        existing.subjects = teacher.subjects;
    } else {
        teachers.push(teacher);
    }
    localStorage.setItem(TEACHER_LIST_KEY, JSON.stringify(teachers));

    // Sync to backend
    fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher)
    }).catch(e => console.error(e));
}

export function removeTeacher(teacherId) {
    const teachers = getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    const updated = teachers.filter(t => t.id !== teacherId);
    localStorage.setItem(TEACHER_LIST_KEY, JSON.stringify(updated));

    // Sync to backend
    fetch(`/api/teachers/${teacherId}`, { method: 'DELETE' }).catch(e => console.error(e));
}

export const TEACHER_PASSWORDS = {
    'Ms.Soumya': 'soumya@faceroll',
    'Ms.Sujatha': 'sujatha@faceroll',
    'Ms.Selva Priya': 'selva@faceroll',
    'Ms.Veena': 'veena@faceroll'
};

export const STUDENT_PASSWORDS = {
    '1': 'affrin@faceroll',
    '2': 'safiya@faceroll',
    '3': 'sibitha@faceroll',
    '4': 'akshita@faceroll',
    '5': 'kusuma@faceroll',
    '6': 'sheetal@faceroll',
    '7': 'divya@faceroll',
    '8': 'saara@faceroll',
    '9': 'gowri@faceroll',
    '10': 'ifthaz@faceroll'
};

export const PERIOD_TIMINGS = {
    'Period 1': '09:00-09:45',
    'Period 2': '09:45-10:30',
    'Period 3': '10:45-11:30',
    'Period 4': '11:30-12:30',
    'AI': '09:00-09:45',
    'FDS': '09:00-09:45',
    'PHP and MySQL': '09:45-10:30',
    'Maths': '11:30-12:30',
    'Web Content System Management': '11:30-12:30'
};

// Helper to normalize subject names to fix duplicates like 'PHPandMySQL'
export function normalizeSubject(name) {
    if (!name) return name;
    if (name.toLowerCase().replace(/\s+/g, '') === 'phpandmysql') {
        return 'PHP and MySQL';
    }
    return name;
}

export function checkLateStatus(periodName) {
    // 1. Resolve timing dynamically from the Weekly Timetable for today
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const timetable = getTimetable();
    
    if (timetable && timetable[today]) {
        const todaySchedule = timetable[today];
        const matchedPeriodNum = Object.keys(todaySchedule).find(
            key => normalizeSubject(todaySchedule[key]) === normalizeSubject(periodName)
        );
        
        if (matchedPeriodNum) {
            const periodKey = `Period ${matchedPeriodNum}`;
            const timingRange = PERIOD_TIMINGS[periodKey];
            if (timingRange) {
                const [startStr, endStr] = timingRange.split('-');
                console.log(`[Timetable Match] Resolved ${periodName} as Period ${matchedPeriodNum} (${startStr}-${endStr})`);
                return _calculateLateStatus(startStr, endStr);
            }
        }
    }

    // 2. Fallback: Check custom dynamic teacher periods from database/local storage
    const periods = getPeriods();
    const period = periods.find(p => (typeof p === 'object' ? p.periodName : p) === periodName);

    if (!period || typeof period !== 'object' || !period.startTime || !period.endTime) {
        // Fallback to hardcoded timings map if not resolved
        const fallbackTiming = PERIOD_TIMINGS[periodName];
        if (!fallbackTiming) return { isLate: false, isAllowed: true, status: 'On-time' };

        const [startStr, endStr] = fallbackTiming.split('-');
        return _calculateLateStatus(startStr, endStr);
    }

    return _calculateLateStatus(period.startTime, period.endTime);
}

function _calculateLateStatus(startStr, endStr) {
    const now = new Date();

    const parseTime = (timeStr) => {
        let [hours, minutes] = timeStr.trim().split(':').map(Number);
        // Heuristic: If hours is small (e.g., < 7) it's likely PM (13, 14, etc.)
        if (hours < 7) hours += 12;
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const startObj = parseTime(startStr);
    const endObj = parseTime(endStr);

    if (now < startObj) {
        return { isLate: false, isAllowed: false, status: 'Early' };
    }
    if (now > endObj) {
        return { isLate: false, isAllowed: false, status: 'Absent' };
    }

    const diffMins = (now - startObj) / (1000 * 60);

    // Within 2 minutes: Present
    if (diffMins <= 2) {
        return { isLate: false, isAllowed: true, status: 'Present' };
    }
    
    // Between 2 and 10 minutes: Late
    if (diffMins <= 10) {
        return { isLate: true, isAllowed: true, status: 'Late' };
    }

    // After 10 minutes or past end time: Absent
    return { isLate: false, isAllowed: false, status: 'Absent' };
}

export function login(name) {
    localStorage.setItem(TEACHER_KEY, name.trim());
    const teacher = name.trim();
    // Sync periods for this teacher
    syncFromBackend(`periods/${teacher}`, PERIODS_KEY + '_' + teacher);
}

export function logout() {
    localStorage.removeItem(TEACHER_KEY);
}

export function getCurrentTeacher() {
    return localStorage.getItem(TEACHER_KEY);
}

export function getPeriods() {
    const teacher = getCurrentTeacher();
    if (!teacher) return [];

    const key = PERIODS_KEY + '_' + teacher;
    const periodsStr = localStorage.getItem(key);
    let periods = periodsStr ? JSON.parse(periodsStr) : null;

    if (!periods || periods.length === 0) {
        const subjects = getTeacherSubjects();
        const defaults = subjects[teacher] || [];
        if (defaults.length > 0) {
            localStorage.setItem(key, JSON.stringify(defaults));
            return defaults;
        }
    }

    return periods || [];
}

export function savePeriod(newPeriod, startTime, endTime) {
    const teacher = getCurrentTeacher();
    if (!teacher) return;

    const key = PERIODS_KEY + '_' + teacher;
    const periods = getPeriods();
    const exists = periods.some(p => (typeof p === 'string' ? p : p.periodName) === newPeriod.trim());

    if (newPeriod.trim().length > 0 && !exists) {
        const periodObj = { periodName: newPeriod.trim(), startTime, endTime };
        periods.push(periodObj);
        localStorage.setItem(key, JSON.stringify(periods));

        fetch(`/api/periods/${teacher}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(periodObj)
        }).catch(e => console.error(e));
    }
}

export function removePeriod(periodName) {
    const teacher = getCurrentTeacher();
    if (!teacher) return;

    const key = PERIODS_KEY + '_' + teacher;
    const periods = getPeriods();
    const updated = periods.filter(p => (typeof p === 'string' ? p : p.periodName) !== periodName);
    localStorage.setItem(key, JSON.stringify(updated));

    fetch(`/api/periods/${teacher}/${periodName}`, { method: 'DELETE' }).catch(e => console.error(e));
}

export function getLogs() {
    const logsStr = localStorage.getItem(STORAGE_KEY);
    const logs = logsStr ? JSON.parse(logsStr) : [];
    // Normalize subject names on retrieval
    return logs.map(l => ({ ...l, period: normalizeSubject(l.period) }));
}

export function isAttendanceMarked(studentId, period, date) {
    const logs = getLogs();
    return logs.some(l =>
        l.studentId.toString() === studentId.toString() &&
        l.period === period &&
        l.fullDate === (date || new Date().toDateString())
    );
}

async function generateHash(payload) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveLog(logData) {
    return await saveBatchLogs([logData]);
}

export async function saveBatchLogs(logsDataArray) {
    const logs = getLogs();
    const savedLogs = [];

    for (const logData of logsDataArray) {
        // Prevent duplicates
        if (isAttendanceMarked(logData.studentId, logData.period, logData.fullDate)) {
            console.warn(`Attendance already marked for student ${logData.studentId} in this session.`);
            continue;
        }

        const payloadToHash = {
            studentId: logData.studentId,
            time: logData.time,
            fullDate: logData.fullDate,
            teacher: logData.teacher
        };

        const txHash = await generateHash(payloadToHash);

        const finalLog = {
            ...logData,
            timestamp: new Date().toISOString(),
            location: logData.location || null,
            isLate: logData.isLate || false,
            txHash: txHash
        };

        logs.push(finalLog);
        savedLogs.push(finalLog);

        // Sync individual to backend (or could batch this too if backend supports it)
        fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalLog)
        }).catch(e => console.error(e));
    }

    if (savedLogs.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    return { success: true, count: savedLogs.length };
}

// Existing functions remain unchanged above.

/** Timetable persistence **/
export function getTimetable() {
  const data = localStorage.getItem(TIMETABLE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTimetable(timetable) {
  localStorage.setItem(TIMETABLE_KEY, JSON.stringify(timetable));
  // optional backend sync could be added here
}

export function clearLogs() {
    localStorage.removeItem(STORAGE_KEY);
    fetch('/api/logs', { method: 'DELETE' }).catch(e => console.error(e));
}


export function saveFaceDescriptor(studentId, descriptorArray) {
    const faces = getFaceDescriptors();
    faces[studentId] = descriptorArray;
    localStorage.setItem(FACE_DATA_KEY, JSON.stringify(faces));

    fetch(`/api/faces/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor: descriptorArray })
    }).catch(e => console.error(e));
}

export function getFaceDescriptors() {
    const faces = localStorage.getItem(FACE_DATA_KEY);
    return faces ? JSON.parse(faces) : {};
}

export function getAttendanceStats(timeframe = 'all') {
    const logs = getLogs();
    const teacher = getCurrentTeacher();
    if (!teacher) return [];

    let filteredLogs = logs.filter(l => l.teacher === teacher);

    if (timeframe !== 'all') {
        const now = new Date();
        const daysToFilter = timeframe === 'weekly' ? 7 : 30;
        const cutoffDate = new Date(now.setDate(now.getDate() - daysToFilter));

        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.timestamp || log.fullDate);
            return logDate >= cutoffDate;
        });
    }

    const sessionsBySubject = {};
    filteredLogs.forEach(log => {
        if (!sessionsBySubject[log.period]) {
            sessionsBySubject[log.period] = new Set();
        }
        sessionsBySubject[log.period].add(log.fullDate);
    });

    const stats = {};
    filteredLogs.forEach(log => {
        const key = `${log.studentId}-${log.period}`;
        if (!stats[key]) {
            stats[key] = {
                studentId: log.studentId,
                studentName: log.studentName,
                subject: log.period,
                attended: new Set(),
                lateCount: 0,
                total: sessionsBySubject[log.period].size
            };
        }
        if (!log.isAbsent) {
            stats[key].attended.add(log.fullDate);
        }
        if (log.isLate) stats[key].lateCount += 1;
    });

    return Object.values(stats).map(s => {
        const percentage = s.total > 0 ? Math.round((s.attended.size / s.total) * 100) : 0;

        // AI Predictive Logic:
        // Assume a standard semester has 40 sessions.
        // Current trend projection:
        const totalExpectedSessions = 40;
        const remainingSessions = Math.max(0, totalExpectedSessions - s.total);
        const currentRate = s.total > 0 ? (s.attended.size / s.total) : 0;
        const predictedAttended = s.attended.size + (remainingSessions * currentRate);
        const predictedPercentage = Math.round((predictedAttended / totalExpectedSessions) * 100);

        let riskLevel = 'Low';
        if (percentage < 70 || predictedPercentage < 75) riskLevel = 'High';
        else if (percentage < 80 || predictedPercentage < 85) riskLevel = 'Medium';

        return {
            ...s,
            attended: s.attended.size,
            percentage,
            predictedPercentage,
            riskLevel
        };
    });
}



export function saveTeacherFaceDescriptor(teacherName, descriptorArray) {
    const faces = getTeacherFaceDescriptors();
    faces[teacherName] = descriptorArray;
    localStorage.setItem(TEACHER_FACE_DATA_KEY, JSON.stringify(faces));

    fetch(`/api/teacher-faces/${teacherName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor: descriptorArray })
    }).catch(e => console.error(e));
}

export function getTeacherFaceDescriptors() {
    const faces = localStorage.getItem(TEACHER_FACE_DATA_KEY);
    return faces ? JSON.parse(faces) : {};
}

export function removeFaceDescriptor(studentId) {
    const faces = getFaceDescriptors();
    delete faces[studentId];
    localStorage.setItem(FACE_DATA_KEY, JSON.stringify(faces));

    fetch(`/api/faces/${studentId}`, { method: 'DELETE' }).catch(e => console.error(e));
}

export function removeTeacherFaceDescriptor(teacherName) {
    const faces = getTeacherFaceDescriptors();
    delete faces[teacherName];
    localStorage.setItem(TEACHER_FACE_DATA_KEY, JSON.stringify(faces));

    fetch(`/api/teacher-faces/${teacherName}`, { method: 'DELETE' }).catch(e => console.error(e));
}

const STUDENT_SESSION_KEY = 'smart_attendance_current_student';

export function loginStudent(studentId) {
    localStorage.setItem(STUDENT_SESSION_KEY, studentId);
}

export function logoutStudent() {
    localStorage.removeItem(STUDENT_SESSION_KEY);
}

export function getCurrentStudent() {
    return localStorage.getItem(STUDENT_SESSION_KEY);
}

export function getStudentStats(studentId) {
    const logs = getLogs();
    const studentLogs = logs.filter(l => l.studentId.toString() === studentId.toString());

    // Get all unique subjects defined in the system (from all teachers)
    const teachers = getTeachers();
    const allSubjects = Array.from(new Set(teachers.flatMap(t => t.subjects || []).map(s => normalizeSubject(s))));

    const sessionsBySubject = {};
    logs.forEach(log => {
        const sub = normalizeSubject(log.period);
        if (!sessionsBySubject[sub]) {
            sessionsBySubject[sub] = new Set();
        }
        sessionsBySubject[sub].add(log.fullDate);
    });

    return allSubjects.map(subject => {
        const subjectLogs = studentLogs.filter(l => normalizeSubject(l.period) === subject && !l.isAbsent);
        const attended = new Set(subjectLogs.map(l => l.fullDate)).size;
        const total = sessionsBySubject[subject] ? sessionsBySubject[subject].size : 0;
        const teacher = logs.find(l => l.period === subject)?.teacher || 'N/A';
        const lateCount = subjectLogs.filter(l => l.isLate).length;

        return {
            subject,
            teacher,
            attended,
            total,
            lateCount,
            percentage: total > 0 ? Math.round((attended / total) * 100) : 0
        };
    });
}



export function getLeaves() {
    const leaves = localStorage.getItem(LEAVES_KEY);
    return leaves ? JSON.parse(leaves) : [];
}

export function submitLeave(studentId, fromDate, toDate, reason, subject = '') {
    const leaves = getLeaves();
    const newLeave = {
        id: 'leave_' + Date.now(),
        studentId: studentId.toString(),
        fromDate,
        toDate,
        reason,
        subject,
        status: 'Pending',
        timestamp: new Date().toISOString()
    };
    leaves.push(newLeave);
    localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));

    fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
    }).catch(e => console.error(e));

    return newLeave;
}

export function updateLeaveStatus(leaveId, status) {
    const leaves = getLeaves();
    const updated = leaves.map(l => l.id === leaveId ? { ...l, status } : l);
    localStorage.setItem(LEAVES_KEY, JSON.stringify(updated));

    fetch(`/api/leaves/${leaveId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    }).catch(e => console.error(e));
}
