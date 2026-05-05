import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, BookOpen, Trash2, PieChart, List, UserCheck, AlertCircle, BarChart3, MapPin, TrendingUp, Landmark, Download, Database, FileText } from 'lucide-react';
import { getLogs, clearLogs, getAttendanceStats, getCurrentTeacher, getStudents } from '../utils/storage';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
    Cell, PieChart as RePieChart, Pie, Legend 
} from 'recharts';

export default function Dashboard() {
    const navigate = useNavigate();
    const teacher = getCurrentTeacher();
    const [viewMode, setViewMode] = useState('recent'); // 'recent' or 'stats'
    const [logs, setLogs] = useState(getLogs().filter(l => l.teacher === teacher).reverse());
    const [timeframe, setTimeframe] = useState('all'); // 'all', 'weekly', 'monthly'
    
    // Calculate cutoff date once outside the loop
    const now = new Date();
    const days = timeframe === 'weekly' ? 7 : timeframe === 'monthly' ? 30 : 0;
    const cutoffDate = timeframe !== 'all' ? new Date(now.setDate(now.getDate() - days)) : null;

    // Filtered logs based on selected timeframe
    const filteredLogs = timeframe === 'all' 
        ? logs 
        : logs.filter(log => {
            const logDate = new Date(log.timestamp || log.fullDate);
            return logDate >= cutoffDate;
        });

    const stats = getAttendanceStats(timeframe);

    // Calculate total sessions taken by teacher in this timeframe
    const totalTeacherSessions = Array.from(new Set(filteredLogs.map(l => `${l.period}-${l.fullDate}`))).length;

    const handleClear = () => {
        if (confirm('Are you sure you want to delete all attendance records? This cannot be undone.')) {
            clearLogs();
            setLogs([]);
            window.location.reload(); // Refresh stats
        }
    };

    const handleExport = () => {
        if (logs.length === 0) {
            alert("No records to export!");
            return;
        }

        const headers = ["Student ID", "Name", "Subject", "Teacher", "Date", "Time", "Day", "Is Late", "Latitude", "Longitude"];
        const csvRows = logs.map(log => [
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
        downloadCSV(csvContent, `Attendance_Raw_Logs_${timeframe.toUpperCase()}_${new Date().toLocaleDateString()}.csv`);
    };

    const handleExportStats = () => {
        if (stats.length === 0) {
            alert("No statistics to export!");
            return;
        }

        // Sort by subject then by student name
        const sortedStats = [...stats].sort((a, b) => {
            const subjectCompare = a.subject.localeCompare(b.subject);
            if (subjectCompare !== 0) return subjectCompare;
            return a.studentName.localeCompare(b.studentName);
        });

        const headers = ["Subject", "Student ID", "Name", "Attended Classes", "Total Sessions", "Attendance Percentage"];
        const csvRows = [];
        csvRows.push(headers.join(","));

        let currentSubject = "";
        sortedStats.forEach(s => {
            // Add a header and spacing when the subject changes
            if (s.subject !== currentSubject) {
                if (currentSubject !== "") {
                    csvRows.push(""); // Add an empty row between subjects
                }
                csvRows.push(`"SECTION: ${s.subject.toUpperCase()} REPORT"`);
                currentSubject = s.subject;
            }

            csvRows.push([
                `"${s.subject}"`,
                s.studentId,
                `"${s.studentName}"`,
                s.attended,
                s.total,
                `"${s.percentage}%"`
            ].join(","));
        });

        const csvContent = csvRows.join("\n");
        downloadCSV(csvContent, `Attendance_Subject_Summary_${timeframe.toUpperCase()}_${new Date().toLocaleDateString()}.csv`);
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 75) return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
        if (percentage >= 50) return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
        return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
    };

    const getBarColor = (percentage) => {
        if (percentage >= 75) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const generateHeatmapData = (logsData, daysCount = 61) => {
        const data = [];
        const now = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const toDateStringStr = d.toDateString(); 
            const count = logsData.filter(l => l.fullDate === toDateStringStr).length;
            data.push({
                date: toDateStringStr,
                count
            });
        }
        return data;
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 p-4 animate-in fade-in duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-2 mt-2">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition border border-zinc-700">
                    <ArrowLeft className="w-5 h-5 text-zinc-300" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">Analytics</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate('/database')} className="p-2 bg-indigo-500/10 rounded-full hover:bg-indigo-500/20 transition group border border-indigo-500/20" title="DB Explorer">
                        <Database className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    </button>
                    
                    {/* Raw Logs Export */}
                    <button 
                        onClick={handleExport} 
                        className="p-2 bg-emerald-500/10 rounded-full hover:bg-emerald-500/20 transition group border border-emerald-500/20"
                        title="Export Raw Logs"
                    >
                        <Download className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Summary Export */}
                    <button 
                        onClick={handleExportStats} 
                        className="p-2 bg-amber-500/10 rounded-full hover:bg-amber-500/20 transition group border border-amber-500/20 flex items-center space-x-1 px-3"
                        title="Export Subject Summary"
                    >
                        <FileText className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Summary</span>
                    </button>

                    <button onClick={handleClear} className="p-2 bg-rose-500/10 rounded-full hover:bg-rose-500/20 transition group border border-rose-500/20">
                        <Trash2 className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Global Timeframe Selector */}
            <div className="flex space-x-2 mb-6 px-1">
                {['all', 'monthly', 'weekly'].map((tf) => {
                    let activeColors = 'bg-emerald-500 border-emerald-500 text-black shadow-xl shadow-emerald-500/20';
                    if (tf === 'monthly') activeColors = 'bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/20';
                    if (tf === 'weekly') activeColors = 'bg-cyan-500 border-cyan-500 text-black shadow-xl shadow-cyan-500/20';
                    
                    return (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`flex-1 py-3 px-3 text-[10px] font-black rounded-2xl border transition-all duration-300 ${
                                timeframe === tf
                                    ? activeColors
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {tf === 'all' ? 'OVERALL' : tf === 'monthly' ? 'THIS MONTH' : 'THIS WEEK'}
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Timeframe Heading */}
            <div className="flex items-center space-x-3 mb-4 px-2">
                <div className={`h-6 w-1 rounded-full ${
                    timeframe === 'all' ? 'bg-emerald-500' :
                    timeframe === 'monthly' ? 'bg-amber-500' :
                    'bg-cyan-500'
                }`}></div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    {timeframe === 'all' ? 'Overall Attendance' : timeframe === 'monthly' ? 'Monthly Report' : 'Weekly Summary'}
                </h3>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-zinc-900/80 rounded-2xl p-1 mb-6 border border-zinc-800 mx-1">
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'recent' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('recent')}
                >
                    <List className="w-3.5 h-3.5" />
                    <span>LOGS</span>
                </button>
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'stats' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('stats')}
                >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>STATS</span>
                </button>
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'sessions' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('sessions')}
                >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>SESSIONS</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 pb-10 scrollbar-hide">
                {viewMode === 'sessions' ? (
                    (() => {
                        const allStudentsCount = getStudents().length;
                        // Group logs by session (subject + date)
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
                                <Landmark className="w-12 h-12 mb-4 text-zinc-600" />
                                <p className="text-lg font-semibold">No sessions recorded</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessionList.map((session, idx) => {
                                    const presentCount = session.present.size;
                                    const absentCount = Math.max(0, allStudentsCount - presentCount);
                                    return (
                                        <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-white">{session.subject}</h3>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{session.day}, {session.date}</p>
                                                </div>
                                                <div className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                    <span className="text-[10px] font-black text-indigo-400">SESSION #{sessionList.length - idx}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 flex flex-col items-center">
                                                    <p className="text-[9px] font-black text-emerald-500/60 uppercase mb-1">Present</p>
                                                    <p className="text-xl font-black text-emerald-400">{presentCount}</p>
                                                </div>
                                                <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-3 flex flex-col items-center">
                                                    <p className="text-[9px] font-black text-rose-500/60 uppercase mb-1">Absent</p>
                                                    <p className="text-xl font-black text-rose-400">{absentCount}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(presentCount / allStudentsCount) * 100}%` }}></div>
                                                <div className="h-full bg-rose-500" style={{ width: `${(absentCount / allStudentsCount) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()
                ) : viewMode === 'recent' ? (
                    filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 px-10 text-center">
                            <BookOpen className="w-12 h-12 mb-4 text-zinc-600" />
                            <p className="text-lg font-semibold">No records found for<br/>{teacher || 'Unknown Teacher'}</p>
                            <p className="text-xs text-zinc-500 mt-1">{timeframe === 'all' ? 'Start marking attendance to see logs here.' : `No activity in the last ${timeframe === 'weekly' ? '7' : '30'} days.`}</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl mb-4 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-0.5">
                                        <h3 className="text-lg font-bold text-white leading-tight">
                                            {log.studentName}
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID: #{log.studentId}</p>
                                    </div>
                                    <div className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                        <p className="text-[10px] font-black text-indigo-400 tracking-wider">
                                            {log.period}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 border-t border-zinc-800/80 pt-4">
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <div className="p-1.5 bg-zinc-800 rounded-lg">
                                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                        </div>
                                        <span className="text-xs font-semibold">{log.time}</span>
                                        {log.isLate && (
                                            <span className="ml-1 bg-rose-500/10 text-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/20">LATE</span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2 text-zinc-400">
                                        <div className="p-1.5 bg-zinc-800 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                        </div>
                                        <span className="text-xs font-semibold">{log.day}</span>
                                    </div>
                                    {log.location && (
                                        <a 
                                            href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition"
                                        >
                                            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                <MapPin className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs font-bold">Map</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : viewMode === 'stats' ? (
                    stats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                            <AlertCircle className="w-12 h-12 mb-4 text-zinc-600" />
                            <p className="text-lg font-semibold">No stats available</p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-6">
                            {/* Summary Card for Teacher */}
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-xl shadow-indigo-500/20 mb-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] mb-1 opacity-80">Teacher Workload</p>
                                    <div className="flex items-end space-x-2">
                                        <h4 className="text-4xl font-black text-white">{totalTeacherSessions}</h4>
                                        <p className="text-xs font-bold text-indigo-100 mb-1.5 opacity-90">Classes Taken</p>
                                    </div>
                                    <div className="mt-4 flex items-center space-x-2 bg-black/20 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        <p className="text-[10px] font-bold text-indigo-50 text-white/90">
                                            {timeframe === 'all' ? 'Total sessions across all recorded subjects' : 
                                             timeframe === 'monthly' ? 'Total sessions taken in the last 30 days' : 
                                             'Total sessions taken in the last 7 days'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 mb-2 px-2 mt-8">
                                <div className="h-4 w-1 rounded-full bg-indigo-500"></div>
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sessions by Subject</h3>
                            </div>

                            {/* Summary Header: Total Classes Taken per Subject */}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                {Array.from(new Set(stats.map(s => s.subject))).map(subject => {
                                    const subjectStats = stats.filter(s => s.subject === subject);
                                    const totalClasses = subjectStats.length > 0 ? subjectStats[0].total : 0;
                                    return (
                                        <div key={subject} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-lg">
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{subject}</p>
                                            <p className="text-2xl font-black text-emerald-400">{totalClasses}</p>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter text-center">Total Sessions</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="h-px bg-zinc-900 mx-2"></div>

                            {/* Individual Student Stats Grouped by Subject */}
                            <div className="space-y-10">
                                {Array.from(new Set(stats.map(s => s.subject))).map(subject => (
                                    <div key={subject} className="space-y-4">
                                        <div className="flex items-center space-x-3 mb-4 px-2">
                                            <div className="h-3 w-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/20"></div>
                                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">{subject} Report</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {stats.filter(s => s.subject === subject).map((stat, index) => (
                                                <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-5 shadow-xl animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${index * 30}ms` }}>
                                                    <div className="flex justify-between items-center mb-5">
                                                        <div className="space-y-0.5">
                                                            <h3 className="text-lg font-bold text-white leading-tight">{stat.studentName}</h3>
                                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Enrollment ID: #{stat.studentId}</p>
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-widest ${getStatusColor(stat.percentage)}`}>
                                                            {stat.percentage}%
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-end text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                            <span>Attendance Progress</span>
                                                            <span className="text-zinc-300">{stat.attended} / {stat.total} Classes</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/30">
                                                            <div 
                                                                className={`h-full transition-all duration-1000 ease-out rounded-full ${getBarColor(stat.percentage)}`}
                                                                style={{ width: `${stat.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    /* Graphical Reports View */
                    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {stats.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                                <AlertCircle className="w-12 h-12 mb-4 text-zinc-600" />
                                <p className="text-lg font-semibold">No data for reports</p>
                            </div>
                        ) : (
                            <>
                                {/* Activity Heatmap */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-500 delay-100">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <Calendar className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Activity Heatmap</h3>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1.5 justify-start">
                                        {generateHeatmapData(logs, 61).map((day, idx) => {
                                            let colorClass = 'bg-zinc-800';
                                            if (day.count > 0 && day.count <= 2) colorClass = 'bg-emerald-500/30';
                                            else if (day.count > 2 && day.count <= 6) colorClass = 'bg-emerald-500/60';
                                            else if (day.count > 6) colorClass = 'bg-emerald-500';
                                            
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className={`w-3 h-3 rounded-sm ${colorClass} group relative cursor-pointer hover:ring-1 hover:ring-zinc-400 transition-all`}
                                                >
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[60]">
                                                        <div className="bg-zinc-800 border border-zinc-700 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
                                                            {day.date} • <span className="text-emerald-400">{day.count} Logs</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex justify-between mt-5 px-1 items-center">
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Last 60 Days</span>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-[9px] font-bold text-zinc-500 mr-1">LESS</span>
                                            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800"></div>
                                            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30"></div>
                                            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60"></div>
                                            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
                                            <span className="text-[9px] font-bold text-zinc-500 ml-1">MORE</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bar Chart: Attendance % per Student */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Attendance % per Student</h3>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats}>
                                                <XAxis dataKey="studentName" hide />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                                />
                                                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                                    {stats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#10b981' : entry.percentage >= 50 ? '#f59e0b' : '#f43f5e'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-between mt-4 px-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[9px] font-bold text-zinc-500 tracking-tighter">GOOD (75%+)</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                            <span className="text-[9px] font-bold text-zinc-500 tracking-tighter">AVERAGE</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                            <span className="text-[9px] font-bold text-zinc-500 tracking-tighter">LOW</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pie Chart: Late vs On-time Ratio */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                                            <PieChart className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Entry Performance</h3>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'On-time', value: filteredLogs.filter(l => !l.isLate).length },
                                                        { name: 'Late', value: filteredLogs.filter(l => l.isLate).length }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#f43f5e" />
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Class Distribution */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-amber-500/10 rounded-xl">
                                            <Landmark className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Subject Logs Summary</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {Array.from(new Set(filteredLogs.map(l => l.period))).map(period => (
                                            <div key={period} className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800">
                                                <span className="text-xs font-bold text-zinc-300">{period}</span>
                                                <span className="text-xs font-black text-indigo-400">{filteredLogs.filter(l => l.period === period).length} Logs</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
