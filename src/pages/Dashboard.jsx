import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Download, Database, 
    LayoutDashboard, Users, BookOpen, BarChart3, Settings, 
    LogOut, Bell, Calendar, UserCheck, 
    TrendingUp, AlertCircle, Clock, List, Landmark, MapPin
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, BarChart, Bar, Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts';
import { getLogs, clearLogs, getStudents, getCurrentTeacher, logout, getPeriods, PERIOD_TIMINGS } from '../utils/storage';

const getStatusColor = (percentage) => {
    if (percentage >= 75) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (percentage >= 50) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
};

const getBarColor = (percentage) => {
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
};

const generateHeatmapData = (logs, days) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString();
        const count = logs.filter(l => l.fullDate === dateStr).length;
        data.push({ date: dateStr, count });
    }
    return data;
};

export default function Dashboard() {
    const navigate = useNavigate();
    const teacher = getCurrentTeacher();
    const [viewMode, setViewMode] = useState('recent'); // 'recent', 'stats', 'sessions', 'reports'
    const [timeframe, setTimeframe] = useState('all'); // 'all', 'weekly', 'monthly'
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    const logs = useMemo(() => getLogs().filter(l => l.teacher === teacher).reverse(), [teacher]);
    const studentsList = getStudents();
    const subjects = useMemo(() => Array.from(new Set(logs.map(l => l.period))), [logs]);

    const filteredLogs = useMemo(() => {
        let filtered = logs;
        
        // Timeframe filter
        if (timeframe !== 'all') {
            const now = new Date();
            const days = timeframe === 'weekly' ? 7 : 30;
            const cutoff = new Date(now.setDate(now.getDate() - days));
            filtered = filtered.filter(log => new Date(log.fullDate) >= cutoff);
        }

        // Subject filter
        if (selectedSubject !== 'all') {
            filtered = filtered.filter(l => l.period === selectedSubject);
        }

        // Student filter
        if (selectedStudent !== 'all') {
            filtered = filtered.filter(l => l.studentId.toString() === selectedStudent.toString());
        }

        // Search query
        if (searchQuery) {
            filtered = filtered.filter(l => 
                l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.studentId.toString().includes(searchQuery)
            );
        }

        return filtered;
    }, [logs, timeframe, selectedSubject, selectedStudent, searchQuery]);

    const stats = useMemo(() => {
        const studentStats = [];
        const uniqueStudents = Array.from(new Set(logs.map(l => l.studentId)));
        
        uniqueStudents.forEach(id => {
            const studentLogs = logs.filter(l => l.studentId === id);
            const student = studentsList.find(s => s.id === id) || { name: studentLogs[0]?.studentName || 'Unknown' };
            
            // For each subject the student attends
            const studentSubjects = Array.from(new Set(studentLogs.map(l => l.period)));
            studentSubjects.forEach(sub => {
                const subLogs = studentLogs.filter(l => l.period === sub);
                const totalSessions = Array.from(new Set(logs.filter(l => l.period === sub).map(l => l.fullDate))).length;
                const attended = subLogs.length;
                const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
                
                studentStats.push({
                    studentId: id,
                    studentName: student.name,
                    subject: sub,
                    attended,
                    total: totalSessions,
                    percentage,
                    predictedPercentage: Math.min(100, percentage + 5),
                    riskLevel: percentage >= 75 ? 'Low' : percentage >= 50 ? 'Medium' : 'High'
                });
            });
        });
        return studentStats;
    }, [logs, studentsList]);

    const downloadCSV = (content, name) => {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', name);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleExport = () => {
        if (filteredLogs.length === 0) {
            alert("No records to export!");
            return;
        }

        const headers = ["Student ID", "Name", "Subject", "Teacher", "Date", "Time", "Day", "Is Late", "Latitude", "Longitude"];
        
        if (selectedSubject === 'all' && subjects.length > 1) {
            if (confirm("Export each subject as a SEPARATE file?")) {
                subjects.forEach(subject => {
                    const subjectLogs = filteredLogs.filter(l => l.period === subject);
                    if (subjectLogs.length === 0) return;
                    
                    const csvRows = subjectLogs.map(log => [
                        log.studentId,
                        `"${log.studentName}"`,
                        `"${log.period}"`,
                        `"${log.teacher}"`,
                        log.fullDate,
                        log.time,
                        log.day,
                        log.isLate ? "YES" : "NO",
                        log.location?.lat || "N/A",
                        log.location?.lng || "N/A"
                    ].join(","));

                    const csvContent = [headers.join(","), ...csvRows].join("\n");
                    downloadCSV(csvContent, `Attendance_${subject}_${new Date().toLocaleDateString()}.csv`);
                });
                return;
            }
        }

        const sortedLogs = [...filteredLogs].sort((a, b) => a.period.localeCompare(b.period));
        const csvRows = [headers.join(",")];
        let currentSub = "";
        
        sortedLogs.forEach(log => {
            if (log.period !== currentSub) {
                if (currentSub !== "") csvRows.push("");
                csvRows.push(`"SECTION: ${log.period.toUpperCase()}"`);
                currentSub = log.period;
            }
            csvRows.push([
                log.studentId,
                `"${log.studentName}"`,
                `"${log.period}"`,
                `"${log.teacher}"`,
                log.fullDate,
                log.time,
                log.day,
                log.isLate ? "YES" : "NO",
                log.location?.lat || "N/A",
                log.location?.lng || "N/A"
            ].join(","));
        });

        const csvContent = csvRows.join("\n");
        downloadCSV(csvContent, `Attendance_Report_${new Date().toLocaleDateString()}.csv`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const totalTeacherSessions = useMemo(() => 
        Array.from(new Set(filteredLogs.map(l => `${l.period}-${l.fullDate}`))).length
    , [filteredLogs]);

    return (
        <div className="flex flex-col h-[100dvh] p-4 animate-in fade-in duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2 mt-2">
                <button onClick={() => navigate('/')} className="p-2 glass rounded-full hover:bg-white/10 transition">
                    <ArrowLeft className="w-5 h-5 text-zinc-300" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">Analytics</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate('/database')} className="p-2 bg-indigo-500/10 rounded-full hover:bg-indigo-500/20 transition group border border-indigo-500/20" title="DB Explorer">
                        <Database className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    </button>
                    <button onClick={handleExport} className="p-2 bg-emerald-500/10 rounded-full hover:bg-emerald-500/20 transition group border border-emerald-500/20" title="Export Raw Logs">
                        <Download className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </button>
                    <button onClick={handleLogout} className="p-2 bg-rose-500/10 rounded-full hover:bg-rose-500/20 transition group border border-rose-500/20" title="Sign Out">
                        <LogOut className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex space-x-2 mb-6 px-1">
                {['all', 'monthly', 'weekly'].map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`flex-1 py-3 px-3 text-[10px] font-black rounded-2xl border transition-all duration-300 ${
                            timeframe === tf
                                ? (tf === 'all' ? 'bg-emerald-500 border-emerald-500 text-black shadow-xl' : 
                                   tf === 'monthly' ? 'bg-amber-500 border-amber-500 text-black shadow-xl' : 
                                   'bg-cyan-500 border-cyan-500 text-black shadow-xl')
                                : 'glass border-white/5 text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {tf === 'all' ? 'OVERALL' : tf === 'monthly' ? 'THIS MONTH' : 'THIS WEEK'}
                    </button>
                ))}
            </div>

            {/* Filters Row */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center space-x-3">
                    <div className={`h-6 w-1 rounded-full ${timeframe === 'all' ? 'bg-emerald-500' : timeframe === 'monthly' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                        {timeframe === 'all' ? 'Overall Attendance' : timeframe === 'monthly' ? 'Monthly Report' : 'Weekly Summary'}
                    </h3>
                </div>
                
                <div className="flex space-x-2">
                    <select 
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase px-2 py-1 rounded-lg focus:outline-none"
                    >
                        <option value="all">All Students</option>
                        {studentsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase px-2 py-1 rounded-lg focus:outline-none"
                    >
                        <option value="all">All Subjects</option>
                        {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex glass rounded-2xl p-1 mb-6 mx-1">
                {[
                    { id: 'recent', label: 'LOGS', icon: <List className="w-3.5 h-3.5" /> },
                    { id: 'stats', label: 'STATS', icon: <UserCheck className="w-3.5 h-3.5" /> },
                    { id: 'sessions', label: 'SESSIONS', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'reports', label: 'REPORTS', icon: <BarChart3 className="w-3.5 h-3.5" /> }
                ].map(view => (
                    <button 
                        key={view.id}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === view.id ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                        onClick={() => setViewMode(view.id)}
                    >
                        {view.icon}
                        <span>{view.label}</span>
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-1 pb-10 scrollbar-hide">
                {viewMode === 'recent' && (
                    filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                            <BookOpen className="w-12 h-12 mb-4" />
                            <p className="text-lg font-semibold">No records found</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className="glass-dark rounded-2xl p-5 shadow-xl mb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-0.5">
                                        <h3 className="text-lg font-bold text-white">{log.studentName}</h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID: #{log.studentId}</p>
                                    </div>
                                    <div className="glass border-indigo-500/20 px-3 py-1 rounded-full">
                                        <p className="text-[10px] font-black text-indigo-400">{log.period}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 border-t border-zinc-800/80 pt-4">
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold">{log.time}</span>
                                        {log.isLate && <span className="bg-rose-500/10 text-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/20">LATE</span>}
                                    </div>
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold">{log.day}</span>
                                    </div>
                                    {log.location && (
                                        <div className="flex items-center space-x-2 text-emerald-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">Location Logged</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                )}

                {viewMode === 'stats' && (
                    stats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                            <AlertCircle className="w-12 h-12 mb-4" />
                            <p className="text-lg font-semibold">No stats available</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {subjects.map(subject => (
                                <div key={subject} className="space-y-4">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-2">{subject} Report</h3>
                                    {stats.filter(s => s.subject === subject).map((stat, idx) => (
                                        <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
                                            <div className="flex justify-between items-start mb-5">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{stat.studentName}</h3>
                                                    <div className={`mt-1 px-2 py-0.5 rounded-full border text-[8px] font-black inline-flex items-center space-x-1 ${stat.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : stat.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                        <div className={`w-1 h-1 rounded-full ${stat.riskLevel === 'High' ? 'bg-rose-500' : stat.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                        <span>AI RISK: {stat.riskLevel}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`px-3 py-1 rounded-full border text-[10px] font-black ${getStatusColor(stat.percentage)}`}>{stat.percentage}%</div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                                    <span>Attendance Progress</span>
                                                    <span>{stat.attended} / {stat.total} Classes</span>
                                                </div>
                                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${getBarColor(stat.percentage)}`} style={{ width: `${stat.percentage}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )
                )}

                {viewMode === 'sessions' && (
                    (() => {
                        const allStudentsCount = studentsList.length;
                        const sessions = {};
                        filteredLogs.forEach(log => {
                            const key = `${log.period}-${log.fullDate}`;
                            if (!sessions[key]) {
                                sessions[key] = {
                                    subject: log.period,
                                    date: log.fullDate,
                                    present: new Set(),
                                    day: log.day
                                };
                            }
                            sessions[key].present.add(log.studentId);
                        });
                        const sessionList = Object.values(sessions).sort((a, b) => new Date(b.date) - new Date(a.date));

                        return sessionList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                                <Landmark className="w-12 h-12 mb-4" />
                                <p className="text-lg font-semibold">No sessions recorded</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessionList.map((session, idx) => {
                                    const presentCount = session.present.size;
                                    const absentCount = Math.max(0, allStudentsCount - presentCount);
                                    return (
                                        <div key={idx} className="glass-dark rounded-3xl p-5 shadow-2xl">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-white">{session.subject}</h3>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{session.day}, {session.date}</p>
                                                </div>
                                                <div className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 text-[10px] font-black text-indigo-400">
                                                    {presentCount} / {allStudentsCount}
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(presentCount / allStudentsCount) * 100}%` }}></div>
                                                <div className="h-full bg-rose-500" style={{ width: `${(absentCount / allStudentsCount) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()
                )}

                {viewMode === 'reports' && (
                    <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-emerald-400" /> Activity Heatmap
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {generateHeatmapData(logs, 60).map((day, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-3 h-3 rounded-sm ${day.count > 6 ? 'bg-emerald-500' : day.count > 2 ? 'bg-emerald-500/60' : day.count > 0 ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}
                                        title={`${day.date}: ${day.count} logs`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-400" /> Attendance per Student
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats}>
                                        <XAxis dataKey="studentName" hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px' }} />
                                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                            {stats.map((entry, index) => (
                                                <Cell key={index} fill={entry.percentage >= 75 ? '#10b981' : entry.percentage >= 50 ? '#f59e0b' : '#f43f5e'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
