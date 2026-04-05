const STORAGE_KEY = 'smart_attendance_logs';
const FACE_DATA_KEY = 'smart_attendance_faces';
const TEACHER_KEY = 'smart_attendance_teacher';
const PERIODS_KEY = 'smart_attendance_periods';

export const STUDENTS = [
    { id: 1, name: 'Affrin' },
    { id: 2, name: 'SyedaSafiya' },
    { id: 3, name: 'Sibitha' },
    { id: 4, name: 'Akshita' },
    { id: 5, name: 'Kusuma' },
    { id: 6, name: 'Sheetal' },
    { id: 7, name: 'Divya' },
    { id: 8, name: 'saraa' },
    { id: 9, name: 'Gowri' },
    { id: 10, name: 'IfthazNoor' }
];

export const TEACHER_SUBJECTS = {
    'Ms.Soumya': ['AI', 'WebContentSystem Managemwnt'],
    'Ms.Sujatha': ['FDS'],
    'Ms.Selva Priya': ['PHPandMySQL']
};

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

export function saveLog(logData) {
    const logs = getLogs();
    logs.push({ ...logData, timestamp: new Date().toISOString() });
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

export function getAttendanceStats() {
    const logs = getLogs();
    const teacher = getCurrentTeacher();
    if (!teacher) return [];

    // Filter logs for this teacher
    const teacherLogs = logs.filter(l => l.teacher === teacher);
    
    // Identify unique sessions for this teacher per subject/period
    // A session is unique by (subject + fullDate)
    const sessionsBySubject = {};
    teacherLogs.forEach(log => {
        if (!sessionsBySubject[log.period]) {
            sessionsBySubject[log.period] = new Set();
        }
        sessionsBySubject[log.period].add(log.fullDate);
    });

    const stats = {};
    teacherLogs.forEach(log => {
        const key = `${log.studentId}-${log.period}`;
        if (!stats[key]) {
            stats[key] = {
                studentId: log.studentId,
                studentName: log.studentName,
                subject: log.period,
                attended: new Set(), // use set to avoid double-counting same student in same session
                total: sessionsBySubject[log.period].size
            };
        }
        stats[key].attended.add(log.fullDate);
    });

    // Convert sets to numbers and flatten
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
