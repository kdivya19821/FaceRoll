import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Clock, Calendar, MapPin, AlertCircle, User, Activity } from 'lucide-react';
import { getCurrentStudent, logoutStudent, getStudentStats, getStudents, getLogs, getLeaves, submitLeave } from '../utils/storage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid } from 'recharts';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const studentId = getCurrentStudent();
    const students = getStudents();
    const student = students.find(s => s.id.toString() === studentId);
    
    // Fallback if somehow accessed without valid session
    if (!studentId || !student) {
        React.useEffect(() => {
            navigate('/student-login', { replace: true });
        }, []);
        return null;
    }

    const stats = getStudentStats(studentId);
    const logs = getLogs().filter(l => l.studentId.toString() === studentId).reverse();
    const studentLeaves = getLeaves().filter(l => l.studentId.toString() === studentId).reverse();
    const availableSubjects = Array.from(new Set(stats.map(s => s.subject)));

    const [viewMode, setViewMode] = useState('overview'); // 'overview', 'history', 'leaves'
    const [leaveSubject, setLeaveSubject] = useState('');
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    
    // Set initial subject
    React.useEffect(() => {
        if (availableSubjects.length > 0 && !leaveSubject) {
            setLeaveSubject(availableSubjects[0]);
        }
    }, [availableSubjects]);
    
    const totalClasses = stats.reduce((acc, curr) => acc + curr.total, 0);
    const attendedClasses = stats.reduce((acc, curr) => acc + curr.attended, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    const totalLate = stats.reduce((acc, curr) => acc + curr.lateCount, 0);
    
    // Calculate leave stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    const monthlyLeaves = studentLeaves.filter(l => new Date(l.timestamp) >= startOfMonth).length;
    const weeklyLeaves = studentLeaves.filter(l => new Date(l.timestamp) >= startOfWeek).length;

    // Advanced Prediction Logic
    const predictAttendance = (attended, total) => {
        if (total === 0) return 100;
        const remainingSessions = 10; // Assume 10 more sessions in semester
        const predicted = Math.round(((attended + (remainingSessions * 0.8)) / (total + remainingSessions)) * 100);
        return Math.min(100, predicted);
    };

    // Voice Greeting Logic
    React.useEffect(() => {
        const speak = () => {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                window.speechSynthesis.cancel();
                
                const message = `Welcome back, ${student.name}. Your overall attendance is ${overallPercentage} percent.`;
                const utterance = new SpeechSynthesisUtterance(message);
                utterance.rate = 0.9; // Slightly slower for clarity
                utterance.pitch = 1.1; // Slightly higher for a friendly tone
                window.speechSynthesis.speak(utterance);
            }
        };

        // Small delay to ensure UI is ready
        const timer = setTimeout(speak, 1000);
        return () => {
            clearTimeout(timer);
            window.speechSynthesis.cancel();
        };
    }, [student.name, overallPercentage]);

    // Today's Schedule Logic
    const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

    // Trend Analysis Logic (Last 4 Weeks)
    const getTrendData = () => {
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const start = new Date();
            start.setDate(now.getDate() - (i * 7 + 7));
            const end = new Date();
            end.setDate(now.getDate() - (i * 7));
            
            const weekLogs = logs.filter(l => {
                const logDate = new Date(l.fullDate);
                return logDate >= start && logDate <= end;
            });
            
            // Simplified trend: count of logs per week
            weeks.push({
                name: i === 0 ? 'This Week' : `${i}w ago`,
                count: weekLogs.length
            });
        }
        return weeks;
    };
    const trendData = getTrendData();

    const handleLogout = () => {
        logoutStudent();
        navigate('/student-login', { replace: true });
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


    const handleLeaveSubmit = (e) => {
        e.preventDefault();
        if (!leaveDate || !leaveReason || !leaveSubject) return;
        
        submitLeave(studentId, leaveDate, '', leaveReason, leaveSubject);
        
        setLeaveDate('');
        setLeaveReason('');
        alert('Leave request submitted successfully!');
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 p-4 animate-in fade-in duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2 mt-2">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                        <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">{student.name}</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID: #{student.id}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="p-2 bg-rose-500/10 rounded-full hover:bg-rose-500/20 transition group border border-rose-500/20">
                    <LogOut className="w-4 h-4 text-rose-500 group-hover:-translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                        <Activity className="w-24 h-24" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 z-10">Attendance %</p>
                    <p className={`text-3xl font-black z-10 ${overallPercentage >= 75 ? 'text-emerald-400' : overallPercentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {overallPercentage}%
                    </p>
                    <div className={`mt-2 px-3 py-1 rounded-full border text-[8px] font-black tracking-widest uppercase z-10 ${overallPercentage >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {overallPercentage >= 75 ? 'Exam Eligible' : 'Ineligible'}
                    </div>
                </div>
                <div className="grid grid-rows-2 gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-lg flex items-center space-x-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Calendar className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Monthly Leaves</p>
                            <p className="text-sm font-bold text-white">{monthlyLeaves} <span className="text-[10px] text-zinc-600 font-normal">Days</span></p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-lg flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <Clock className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Weekly Leaves</p>
                            <p className="text-sm font-bold text-white">{weeklyLeaves} <span className="text-[10px] text-zinc-600 font-normal">Days</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[1.5rem] shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Attended</p>
                        <p className="text-xl font-bold text-white">{attendedClasses} <span className="text-xs text-zinc-600">/ {totalClasses}</span></p>
                    </div>
                    <BookOpen className="w-5 h-5 text-indigo-400/50" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[1.5rem] shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Late Marks</p>
                        <p className="text-xl font-bold text-rose-400">{totalLate}</p>
                    </div>
                    <AlertCircle className="w-5 h-5 text-rose-400/50" />
                </div>
            </div>


            {/* Attendance Trend Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Attendance Trend</h3>
                    <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Last 30 Days</span>
                    </div>
                </div>
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '10px' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#6366f1" 
                                strokeWidth={3} 
                                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#818cf8' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex bg-zinc-900/80 rounded-2xl p-1 mb-6 border border-zinc-800 mx-1">
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'overview' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('overview')}
                >
                    <span>SUBJECTS</span>
                </button>
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'schedule' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('schedule')}
                >
                    <span>SCHEDULE</span>
                </button>
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'history' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('history')}
                >
                    <span>HISTORY</span>
                </button>
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'id' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('id')}
                >
                    <span>ID CARD</span>
                </button>
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'leaves' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('leaves')}
                >
                    <span>LEAVES</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 pb-10 scrollbar-hide">
                {viewMode === 'overview' ? (
                    stats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                            <BookOpen className="w-12 h-12 mb-4 text-zinc-600" />
                            <p className="text-lg font-semibold">No attendance data</p>
                            <p className="text-xs text-zinc-500">Attend classes to see stats here.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Graphical View */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Subject Comparison</h3>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="subject" type="category" hide />
                                            <Tooltip 
                                                cursor={{ fill: '#27272a' }}
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                            />
                                            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={12}>
                                                {stats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#10b981' : entry.percentage >= 50 ? '#f59e0b' : '#f43f5e'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* List View */}
                            <div className="space-y-4">
                                {stats.map((stat, index) => {
                                    const subjectLeaves = studentLeaves.filter(l => l.subject === stat.subject).length;
                                    const predicted = predictAttendance(stat.attended, stat.total);
                                    const isLow = stat.percentage < 75;

                                    return (
                                        <div key={index} className={`bg-zinc-900 border ${isLow ? 'border-rose-500/50 shadow-rose-500/10 animate-pulse' : 'border-zinc-800/80'} rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-right-4 duration-500`} style={{ animationDelay: `${index * 50}ms` }}>
                                            <div className="flex justify-between items-center mb-5">
                                                <div className="space-y-0.5">
                                                    <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                                                        {stat.subject}
                                                        {isLow && <span className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Warning</span>}
                                                    </h3>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.teacher}</p>
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
                                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${getBarColor(stat.percentage)}`}
                                                        style={{ width: `${stat.percentage}%` }}
                                                    ></div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center py-2 border-t border-zinc-800/30">
                                                    <div className="flex items-center space-x-2">
                                                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Goal: <span className="text-white">85%</span></p>
                                                    </div>
                                                    <p className={`text-[9px] font-black uppercase tracking-tighter ${stat.percentage >= 85 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                                        {stat.percentage >= 85 ? 'Target Met' : `${Math.ceil((stat.total * 0.85) - stat.attended)} Classes Left`}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
                                                    <div className="flex items-center space-x-2">
                                                        <Activity className="w-3 h-3 text-indigo-400" />
                                                        <span className="text-[9px] font-bold text-zinc-400">Projected: <span className="text-zinc-200">{predicted}%</span></span>
                                                    </div>
                                                    {subjectLeaves > 0 && (
                                                        <div className="flex items-center space-x-1">
                                                            <div className="w-1 h-1 rounded-full bg-amber-500"></div>
                                                            <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">{subjectLeaves} Leaves</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )) : viewMode === 'schedule' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    Today's Schedule ({currentDayName})
                                </h3>
                                <div className="space-y-4">
                                    {stats.map((s, i) => (
                                        <div key={i} className="flex items-start space-x-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                                            <div className="w-1 h-full absolute left-0 top-0 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                                                <p className="text-[8px] font-black text-zinc-500 uppercase mb-0.5">Session</p>
                                                <p className="text-xs font-bold text-white">#{i+1}</p>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-white">{s.subject}</h4>
                                                <p className="text-[10px] text-zinc-500 font-medium">{s.teacher}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-indigo-400">Active</p>
                                                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Online</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'history' ? (
                        logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                                <Clock className="w-12 h-12 mb-4 text-zinc-600" />
                                <p className="text-lg font-semibold">No logs found</p>
                            </div>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 shadow-xl mb-3 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 30}ms` }}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-white leading-tight">{log.period}</h3>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{log.teacher}</p>
                                        </div>
                                        <div className="bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700 flex items-center space-x-1">
                                            <Calendar className="w-3 h-3 text-zinc-400" />
                                            <p className="text-[9px] font-black text-zinc-300 tracking-wider">
                                                {log.day ? log.day.substring(0,3) : 'N/A'}, {log.fullDate ? log.fullDate.substring(4,10) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 border-t border-zinc-800/80 pt-3">
                                        <div className="flex items-center space-x-1.5 text-zinc-400">
                                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-xs font-bold text-white">{log.time}</span>
                                            {log.isLate && (
                                                <span className="ml-1 bg-rose-500/10 text-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/20">LATE</span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-1.5 ml-auto">
                                            <div className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 flex items-center space-x-1">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[7px] font-mono text-zinc-500 uppercase">HASH: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : viewMode === 'id' ? (
                        <div className="flex flex-col items-center justify-center pt-8 animate-in zoom-in duration-500">
                            <div className="w-72 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2rem] p-6 shadow-2xl shadow-indigo-500/20 relative overflow-hidden border border-white/10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
                                        <Activity className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">FACEROLL ID</p>
                                        <p className="text-[10px] font-bold text-white">Verified</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center mb-8 relative z-10">
                                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 p-1 mb-4">
                                        <div className="w-full h-full bg-zinc-900 rounded-xl flex items-center justify-center">
                                            <User className="w-12 h-12 text-zinc-700" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-white tracking-tight">{student.name}</h3>
                                    <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest opacity-80">Registration ID: #{student.id}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 text-center flex flex-col items-center">
                                        <p className="text-[8px] font-black text-white/50 uppercase mb-2">SCAN ID</p>
                                        <div className="w-12 h-12 bg-white rounded-lg p-1">
                                            <div className="w-full h-full grid grid-cols-3 gap-0.5 opacity-80">
                                                {Array.from({length: 9}).map((_, i) => (
                                                    <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-20'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
                                        <p className="text-[8px] font-black text-white/50 uppercase mb-1">Attendance</p>
                                        <p className="text-sm font-black text-white">{overallPercentage}%</p>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-8 text-xs text-zinc-500 font-medium text-center max-w-[200px]">Verified Digital Student Identity.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Request Form */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
                                <h3 className="text-sm font-bold text-white mb-4">Request Leave</h3>
                                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Select Subject</label>
                                            <select 
                                                value={leaveSubject}
                                                onChange={(e) => setLeaveSubject(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-3 outline-none focus:border-indigo-500 text-sm"
                                            >
                                                {availableSubjects.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Select Date</label>
                                            <input 
                                                type="date"
                                                value={leaveDate}
                                                onChange={(e) => setLeaveDate(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-3 outline-none focus:border-indigo-500 text-sm [color-scheme:dark]"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Reason</label>
                                        <textarea 
                                            value={leaveReason}
                                            onChange={(e) => setLeaveReason(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm h-24 resize-none"
                                            placeholder="Reason for absence..."
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors text-sm">
                                        Submit Request
                                    </button>
                                </form>
                            </div>

                            {/* Past Requests */}
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Past Requests</h3>
                                {studentLeaves.length === 0 ? (
                                    <div className="text-center py-6 border border-dashed border-zinc-800 rounded-2xl">
                                        <p className="text-xs text-zinc-500">No leave requests found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {studentLeaves.map(leave => (
                                            <div key={leave.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 shadow-md">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Leave Dates</p>
                                                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                            {leave.fromDate} {leave.toDate ? `to ${leave.toDate}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                                        leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        leave.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-300 mt-2 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800">{leave.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}
