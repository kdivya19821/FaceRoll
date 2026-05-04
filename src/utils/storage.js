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
}

export function removeStudent(studentId) {
    const students = getStudents().filter(s => s.id !== studentId);
    localStorage.setItem(STUDENT_LIST_KEY, JSON.stringify(students));
}

export const TEACHER_SUBJECTS = {
    'Ms.Soumya': ['AI', 'Web Content System Management'],
    'Ms.Sujatha': ['FDS'],
    'Ms.Selva Priya': ['PHP and MySQL']
};

/**
 * Default period start times for Late Entry detection.
 * (Adjust these based on actual class timings)
 */
export const PERIOD_TIMINGS = {
    'AI': '09:00',
    'Web Content System Management': '10:30',
    'FDS': '11:45',
    'PHP and MySQL': '14:00'
};

export function checkLateStatus(periodName) {
    const startTime = PERIOD_TIMINGS[periodName];
    if (!startTime) return false;

    const now = new Date();
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startObj = new Date();
    startObj.setHours(startHour, startMin, 0, 0);

    // If current time is 15 minutes later than start time, mark as late.
    const lateThresholdMinutes = 15;
    const diffMs = now - startObj;
    const diffMins = diffMs / (1000 * 60);

    return diffMins > lateThresholdMinutes;
}

export function login(name) {
    localStorage.setItem(TEACHER_KEY, name.trim());
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
    const periods = localStorage.getItem(key);

    if (!periods) {
        // If this teacher has a predefined list in requirements, load it
        const defaults = TEACHER_SUBJECTS[teacher] || [];
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
    }
    return JSON.parse(periods);
}

export function savePeriod(newPeriod) {
    const teacher = getCurrentTeacher();
    if (!teacher) return;

    const key = PERIODS_KEY + '_' + teacher;
    const periods = getPeriods();
    if (newPeriod.trim().length > 0 && !periods.includes(newPeriod.trim())) {
        periods.push(newPeriod.trim());
        localStorage.setItem(key, JSON.stringify(periods));
    }
}

export function removePeriod(periodName) {
    const teacher = getCurrentTeacher();
    if (!teacher) return;

    const key = PERIODS_KEY + '_' + teacher;
    const periods = getPeriods();
    const updated = periods.filter(p => p !== periodName);
    localStorage.setItem(key, JSON.stringify(updated));
}

export function getLogs() {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
}

async function generateHash(payload) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveLog(logData) {
    const logs = getLogs();
    const payloadToHash = {
        studentId: logData.studentId,
        time: logData.time,
        fullDate: logData.fullDate,
        teacher: logData.teacher
    };
    
    const txHash = await generateHash(payloadToHash);

    logs.push({
        ...logData,
        timestamp: new Date().toISOString(),
        location: logData.location || null, // Capture Geo-tag
        isLate: logData.isLate || false,     // Late status
        txHash: txHash
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function clearLogs() {
    localStorage.removeItem(STORAGE_KEY);
}

export function saveFaceDescriptor(studentId, descriptorArray) {
    const faces = getFaceDescriptors();
    faces[studentId] = descriptorArray;
    localStorage.setItem(FACE_DATA_KEY, JSON.stringify(faces));
}

export function getFaceDescriptors() {
    const faces = localStorage.getItem(FACE_DATA_KEY);
    return faces ? JSON.parse(faces) : {};
}

export function getAttendanceStats(timeframe = 'all') {
    const logs = getLogs();
    const teacher = getCurrentTeacher();
    if (!teacher) return [];

    // Filter logs for this teacher
    let filteredLogs = logs.filter(l => l.teacher === teacher);

    // Filter by timeframe
    if (timeframe !== 'all') {
        const now = new Date();
        const daysToFilter = timeframe === 'weekly' ? 7 : 30;
        const cutoffDate = new Date(now.setDate(now.getDate() - daysToFilter));
        
        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.timestamp || log.fullDate);
            return logDate >= cutoffDate;
        });
    }

    // Identify unique sessions for this teacher per subject/period in the filtered timeframe
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

    return Object.values(stats).map(s => ({
        ...s,
        attended: s.attended.size,
        percentage: s.total > 0 ? Math.round((s.attended.size / s.total) * 100) : 0
    }));
}

const TEACHER_FACE_DATA_KEY = 'smart_attendance_teacher_faces';

export function saveTeacherFaceDescriptor(teacherName, descriptorArray) {
    const faces = getTeacherFaceDescriptors();
    faces[teacherName] = descriptorArray;
    localStorage.setItem(TEACHER_FACE_DATA_KEY, JSON.stringify(faces));
}

export function getTeacherFaceDescriptors() {
    const faces = localStorage.getItem(TEACHER_FACE_DATA_KEY);
    return faces ? JSON.parse(faces) : {};
}

export function removeFaceDescriptor(studentId) {
    const faces = getFaceDescriptors();
    delete faces[studentId];
    localStorage.setItem(FACE_DATA_KEY, JSON.stringify(faces));
}

export function removeTeacherFaceDescriptor(teacherName) {
    const faces = getTeacherFaceDescriptors();
    delete faces[teacherName];
    localStorage.setItem(TEACHER_FACE_DATA_KEY, JSON.stringify(faces));
}

// ========================================
// STUDENT PORTAL LOGIC
// ========================================

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
    
    // Identify unique sessions across all teachers for all subjects
    const sessionsBySubject = {};
    logs.forEach(log => {
        if (!sessionsBySubject[log.period]) {
            sessionsBySubject[log.period] = new Set();
        }
        sessionsBySubject[log.period].add(log.fullDate);
    });

    const stats = {};
    studentLogs.forEach(log => {
        if (!stats[log.period]) {
            stats[log.period] = {
                subject: log.period,
                teacher: log.teacher,
                attended: new Set(),
                lateCount: 0,
                total: sessionsBySubject[log.period] ? sessionsBySubject[log.period].size : 0
            };
        }
        stats[log.period].attended.add(log.fullDate);
        if (log.isLate) stats[log.period].lateCount += 1;
    });

    return Object.values(stats).map(s => ({
        ...s,
        attended: s.attended.size,
        percentage: s.total > 0 ? Math.round((s.attended.size / s.total) * 100) : 0
    }));
}

// ========================================
// LEAVE MANAGEMENT LOGIC
// ========================================

const LEAVES_KEY = 'smart_attendance_leaves';

export function getLeaves() {
    const leaves = localStorage.getItem(LEAVES_KEY);
    return leaves ? JSON.parse(leaves) : [];
}

export function submitLeave(studentId, date, reason) {
    const leaves = getLeaves();
    const newLeave = {
        id: 'leave_' + Date.now(),
        studentId: studentId.toString(),
        date,
        reason,
        status: 'Pending', // Pending, Approved, Rejected
        timestamp: new Date().toISOString()
    };
    leaves.push(newLeave);
    localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));
    return newLeave;
}

export function updateLeaveStatus(leaveId, status) {
    const leaves = getLeaves();
    const updated = leaves.map(l => l.id === leaveId ? { ...l, status } : l);
    localStorage.setItem(LEAVES_KEY, JSON.stringify(updated));
}
