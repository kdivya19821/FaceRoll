const STORAGE_KEY = 'smart_attendance_logs';
const FACE_DATA_KEY = 'smart_attendance_faces';
const TEACHER_KEY = 'smart_attendance_teacher';
const PERIODS_KEY = 'smart_attendance_periods';
const STUDENT_LIST_KEY = 'smart_attendance_student_list';

const DEFAULT_STUDENTS = [
    { id: 1, name: 'Affrin' },
    { id: 2, name: 'SyedaSafiya' },
    { id: 3, name: 'Sibitha' },
    { id: 4, name: 'Akshita' },
    { id: 5, name: 'Kusuma' },
    { id: 6, name: 'Sheetal' },
    { id: 7, name: 'Divya' },
    { id: 8, name: 'saara' },
    { id: 9, name: 'Gowri' },
    { id: 10, name: 'IfthazNoor' }
];

// Helper to sync local data from backend
async function syncFromBackend(endpoint, key, defaultData = null) {
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
    syncFromBackend('logs', STORAGE_KEY, []);
    syncFromBackend('faces', FACE_DATA_KEY, {});
    syncFromBackend('teacher-faces', TEACHER_FACE_DATA_KEY, {});
    syncFromBackend('leaves', LEAVES_KEY, []);
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
    const existing = students.find(s => s.id === student.id);
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

export const TEACHER_SUBJECTS = {
    'Ms.Soumya': ['AI', 'Web Content System Management'],
    'Ms.Sujatha': ['FDS'],
    'Ms.Selva Priya': ['PHP and MySQL']
};

export const PERIOD_TIMINGS = {
    'AI': '09:00-09:45',
    'Web Content System Management': '10:30-11:15',
    'FDS': '11:45-12:30',
    'PHP and MySQL': '12:30-1:15',
};

export function checkLateStatus(periodName) {
    const periods = getPeriods();
    const period = periods.find(p => (typeof p === 'object' ? p.periodName : p) === periodName);
    
    if (!period || typeof period !== 'object' || !period.startTime || !period.endTime) {
        // Fallback to old hardcoded timings if still in migration
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

    const lateThresholdMinutes = 15;
    const diffMins = (now - startObj) / (1000 * 60);

    if (diffMins > lateThresholdMinutes) {
        return { isLate: true, isAllowed: true, status: 'Late' };
    }
    return { isLate: false, isAllowed: true, status: 'On-time' };
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
        const defaults = TEACHER_SUBJECTS[teacher] || [];
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
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
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
        stats[key].attended.add(log.fullDate);
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

const TEACHER_FACE_DATA_KEY = 'smart_attendance_teacher_faces';

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
    localStorage.setItem(STUDENT_SESSION_KEY, studentId.toString());
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

    // Get all unique subjects that have ever had a session
    const allSubjects = Array.from(new Set(logs.map(l => l.period)));

    const sessionsBySubject = {};
    logs.forEach(log => {
        if (!sessionsBySubject[log.period]) {
            sessionsBySubject[log.period] = new Set();
        }
        sessionsBySubject[log.period].add(log.fullDate);
    });

    return allSubjects.map(subject => {
        const subjectLogs = studentLogs.filter(l => l.period === subject);
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

const LEAVES_KEY = 'smart_attendance_leaves';

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
