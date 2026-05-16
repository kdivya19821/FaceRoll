import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Clock, Calendar, MapPin, AlertCircle, User, Activity, History, ShieldCheck, FileText, Menu } from 'lucide-react';
import { getCurrentStudent, logoutStudent, getStudentStats, getStudents, getLogs, getLeaves, submitLeave } from '../utils/storage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid } from 'recharts';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const studentId = getCurrentStudent();
    const students = getStudents();
    const student = students.find(s => s.id.toString() === studentId);
    
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

    const [viewMode, setViewMode] = useState('overview'); 
    const [leaveSubject, setLeaveSubject] = useState('');
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile
    
    React.useEffect(() => {
        if (availableSubjects.length > 0 && !leaveSubject) {
            setLeaveSubject(availableSubjects[0]);
        }
    }, [availableSubjects]);
    
    const totalClasses = stats.reduce((acc, curr) => acc + curr.total, 0);
    const attendedClasses = stats.reduce((acc, curr) => acc + curr.attended, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    const totalLate = stats.reduce((acc, curr) => acc + curr.lateCount, 0);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    const monthlyLeaves = studentLeaves.filter(l => new Date(l.timestamp) >= startOfMonth).length;
    const weeklyLeaves = studentLeaves.filter(l => new Date(l.timestamp) >= startOfWeek).length;

    const getRiskInfo = (attended, total) => {
        const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
        const totalExpectedSessions = 40; 
        const remainingSessions = Math.max(0, totalExpectedSessions - total);
        const currentRate = total > 0 ? (attended / total) : 0;
        const predictedAttended = attended + (remainingSessions * currentRate);
        const predictedPercentage = Math.round((predictedAttended / totalExpectedSessions) * 100);

        let riskLevel = 'Low';
        if (percentage < 70 || predictedPercentage < 75) riskLevel = 'High';
        else if (percentage < 80 || predictedPercentage < 85) riskLevel = 'Medium';

        return { predictedPercentage, riskLevel };
    };

    React.useEffect(() => {
        const speak = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const message = `Welcome back, ${student.name}. Your overall attendance is ${overallPercentage} percent.`;
                const utterance = new SpeechSynthesisUtterance(message);
                utterance.rate = 0.9;
                utterance.pitch = 1.1;
                window.speechSynthesis.speak(utterance);
            }
        };
        const timer = setTimeout(speak, 1000);
        return () => {
            clearTimeout(timer);
            window.speechSynthesis.cancel();
        };
    }, [student.name, overallPercentage]);

    const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

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

    const SidebarButton = ({ id, icon: Icon, label }) => {
        const active = viewMode === id;
        return (
            <button 
                onClick={() => {
                    setViewMode(id);
                    setIsSidebarOpen(false); // Close mobile menu on select
                }}
                className={`w-full flex items-center px-4 py-3.5 mb-2 rounded-2xl font-bold transition-all ${
                    active 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
                }`}
            >
                <Icon className={`w-5 h-5 mr-3 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className="text-sm">{label}</span>
            </button>
        );
    };

    return (
        <div className="flex h-[100dvh] bg-zinc-950 overflow-hidden font-sans">
            
            {/* Desktop Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 border-b border-zinc-800/50 flex items-center space-x-4">
                    <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                        <User className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight truncate">{student.name}</h2>
                        <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest">ID: #{student.id}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-hide">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 px-2">Menu</p>
                    <SidebarButton id="overview" icon={BookOpen} label="Subjects & Stats" />
                    <SidebarButton id="schedule" icon={Clock} label="My Schedule" />
                    <SidebarButton id="history" icon={History} label="Attendance Log" />
                    <SidebarButton id="id" icon={ShieldCheck} label="Digital ID" />
                    <SidebarButton id="leaves" icon={FileText} label="Leave Requests" />
                </div>

                <div className="p-4 border-t border-zinc-800/50">
                    <button onClick={handleLogout} className="w-full flex items-center px-4 py-3.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl font-bold transition-all group">
                        <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm">Logout Portal</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
                {/* Mobile Header Topbar */}
                <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-zinc-800 rounded-xl text-zinc-300">
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-sm font-bold text-white">Student Portal</h1>
                    </div>
                    <div className="p-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                        <User className="w-4 h-4 text-emerald-400" />
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                    
                    {viewMode === 'overview' && (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                            {/* Page Header */}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Overview Dashboard</h1>
                                <p className="text-sm text-zinc-400 mt-1">Track your attendance and performance metrics.</p>
                            </div>

                            {/* Top Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Main Percentage Card */}
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center justify-center relative overflow-hidden md:col-span-1">
                                    <div className="absolute -right-4 -bottom-4 text-emerald-500/5 pointer-events-none">
                                        <Activity className="w-32 h-32" />
                                    </div>
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 z-10">Total Attendance</p>
                                    <p className={`text-5xl font-black z-10 ${overallPercentage >= 75 ? 'text-emerald-400' : overallPercentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {overallPercentage}%
                                    </p>
                                    <div className={`mt-4 px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase z-10 ${overallPercentage >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                        {overallPercentage >= 75 ? 'Exam Eligible' : 'Ineligible'}
                                    </div>
                                </div>

                                {/* Secondary Stats Group */}
                                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] shadow-xl flex flex-col justify-center">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="p-2.5 bg-indigo-500/10 rounded-xl"><BookOpen className="w-5 h-5 text-indigo-400" /></div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Attended</p>
                                        </div>
                                        <p className="text-2xl font-bold text-white pl-1">{attendedClasses} <span className="text-sm text-zinc-500 font-medium">/ {totalClasses}</span></p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] shadow-xl flex flex-col justify-center">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="p-2.5 bg-rose-500/10 rounded-xl"><AlertCircle className="w-5 h-5 text-rose-400" /></div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Late Marks</p>
                                        </div>
                                        <p className="text-2xl font-bold text-rose-400 pl-1">{totalLate}</p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] shadow-xl flex flex-col justify-center">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="p-2.5 bg-amber-500/10 rounded-xl"><Calendar className="w-5 h-5 text-amber-500" /></div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Month Leaves</p>
                                        </div>
                                        <p className="text-2xl font-bold text-white pl-1">{monthlyLeaves} <span className="text-sm text-zinc-500 font-medium">Days</span></p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] shadow-xl flex flex-col justify-center">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Clock className="w-5 h-5 text-indigo-400" /></div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Week Leaves</p>
                                        </div>
                                        <p className="text-2xl font-bold text-white pl-1">{weeklyLeaves} <span className="text-sm text-zinc-500 font-medium">Days</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Attendance Trend */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Attendance Trend</h3>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">Last 30 Days</span>
                                    </div>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px' }} />
                                                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Subject Comparison */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Subject Comparison</h3>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                <XAxis type="number" domain={[0, 100]} hide />
                                                <YAxis dataKey="subject" type="category" hide />
                                                <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                                                <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={16}>
                                                    {stats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#10b981' : entry.percentage >= 50 ? '#f59e0b' : '#f43f5e'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Subject Detail List */}
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pl-2">Subject Breakdown</h3>
                                {stats.length === 0 ? (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 text-center">
                                        <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-zinc-400">No attendance data recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stats.map((stat, index) => {
                                            const subjectLeaves = studentLeaves.filter(l => l.subject === stat.subject).length;
                                            const { predictedPercentage, riskLevel } = getRiskInfo(stat.attended, stat.total);
                                            const isLow = stat.percentage < 75;

                                            return (
                                                <div key={index} className={`bg-zinc-900 border ${isLow ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.05)]' : 'border-zinc-800'} rounded-2xl p-5 shadow-xl transition-all hover:border-zinc-700`}>
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div className="space-y-1">
                                                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                                                {stat.subject}
                                                                {riskLevel === 'High' && <span className="bg-rose-500/20 text-rose-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-rose-500/30">Critical</span>}
                                                            </h3>
                                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{stat.teacher}</p>
                                                        </div>
                                                        <div className={`px-4 py-1.5 rounded-full border text-xs font-black tracking-widest ${getStatusColor(stat.percentage)}`}>
                                                            {stat.percentage}%
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-end text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                            <span>Progress</span>
                                                            <span className="text-zinc-300">{stat.attended} / {stat.total} Classes</span>
                                                        </div>
                                                        <div className="w-full h-2.5 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all duration-1000 ease-out rounded-full ${getBarColor(stat.percentage)}`} style={{ width: `${stat.percentage}%` }}></div>
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center py-2 border-t border-zinc-800/50 mt-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Activity className="w-4 h-4 text-indigo-400" />
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Goal: <span className="text-white">85%</span></p>
                                                            </div>
                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${stat.percentage >= 85 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                                                {stat.percentage >= 85 ? 'Target Met' : `${Math.ceil((stat.total * 0.85) - stat.attended)} Left`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {viewMode === 'schedule' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Daily Schedule</h1>
                                <p className="text-sm text-zinc-400 mt-1">Your classes for today, {currentDayName}.</p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                                <div className="space-y-4">
                                    {stats.map((s, i) => (
                                        <div key={i} className="flex items-center space-x-4 p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                            <div className="w-1.5 h-full absolute left-0 top-0 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Session</p>
                                                <p className="text-sm font-bold text-white text-center">#{i+1}</p>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-white">{s.subject}</h4>
                                                <p className="text-xs text-zinc-500 font-medium">{s.teacher}</p>
                                            </div>
                                            <div className="text-right bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                                                <p className="text-xs font-bold text-indigo-400">Active</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'history' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Attendance Log</h1>
                                <p className="text-sm text-zinc-400 mt-1">Historical view of your presence.</p>
                            </div>
                            
                            {logs.length === 0 ? (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] py-20 flex flex-col items-center justify-center opacity-70">
                                    <Clock className="w-12 h-12 mb-4 text-zinc-600" />
                                    <p className="text-lg font-bold text-white">No logs found</p>
                                    <p className="text-sm text-zinc-500">Your attendance history will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map((log, index) => (
                                        <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl transition-all hover:border-zinc-700">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-white">{log.period}</h3>
                                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{log.teacher}</p>
                                                </div>
                                                <div className="bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-zinc-400" />
                                                    <p className="text-xs font-black text-zinc-300 tracking-wider">
                                                        {log.day ? log.day.substring(0,3) : 'N/A'}, {log.fullDate ? log.fullDate.substring(4,10) : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 border-t border-zinc-800/80 pt-4">
                                                <div className="flex items-center space-x-2 text-zinc-400">
                                                    <Clock className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm font-bold text-white">{log.time}</span>
                                                    {log.isLate && (
                                                        <span className="ml-2 bg-rose-500/10 text-rose-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-500/20">LATE</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2 ml-auto">
                                                    <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center space-x-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">HASH: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'id' && (
                        <div className="max-w-4xl mx-auto h-full flex items-center justify-center py-10 animate-in zoom-in duration-500">
                            <div className="w-full max-w-sm bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/20 relative overflow-hidden border border-white/10">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                                
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20">
                                        <Activity className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">FACEROLL ID</p>
                                        <p className="text-xs font-bold text-white">Verified Identity</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-center mb-10 relative z-10">
                                    <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-[2rem] border-2 border-white/20 p-2 mb-6 shadow-2xl">
                                        <div className="w-full h-full bg-zinc-900 rounded-2xl flex items-center justify-center">
                                            <User className="w-16 h-16 text-zinc-700" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tight">{student.name}</h3>
                                    <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest opacity-80 mt-1">Registration ID: #{student.id}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center flex flex-col items-center">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">SCAN ID</p>
                                        <div className="w-16 h-16 bg-white rounded-xl p-1.5 shadow-inner">
                                            <div className="w-full h-full grid grid-cols-3 gap-1 opacity-80">
                                                {Array.from({length: 9}).map((_, i) => (
                                                    <div key={i} className={`bg-black rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-20'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Total Score</p>
                                        <p className="text-3xl font-black text-white">{overallPercentage}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'leaves' && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Leave Management</h1>
                                <p className="text-sm text-zinc-400 mt-1">Request and track your absences.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Request Form */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl h-fit">
                                    <h3 className="text-lg font-bold text-white mb-6">Submit Request</h3>
                                    <form onSubmit={handleLeaveSubmit} className="space-y-5">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Select Subject</label>
                                                <select 
                                                    value={leaveSubject}
                                                    onChange={(e) => setLeaveSubject(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3.5 px-4 outline-none focus:border-indigo-500 text-sm font-semibold transition-colors"
                                                >
                                                    {availableSubjects.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Select Date</label>
                                                <input 
                                                    type="date"
                                                    value={leaveDate}
                                                    onChange={(e) => setLeaveDate(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3.5 px-4 outline-none focus:border-indigo-500 text-sm font-semibold transition-colors [color-scheme:dark]"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Reason</label>
                                            <textarea 
                                                value={leaveReason}
                                                onChange={(e) => setLeaveReason(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-4 px-4 outline-none focus:border-indigo-500 text-sm font-medium h-32 resize-none transition-colors"
                                                placeholder="Provide a detailed reason for absence..."
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 text-sm">
                                            Send to Teacher
                                        </button>
                                    </form>
                                </div>

                                {/* Past Requests */}
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pl-2">Past Requests</h3>
                                    {studentLeaves.length === 0 ? (
                                        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-[2rem] py-12 flex items-center justify-center text-center">
                                            <p className="text-sm text-zinc-500">No leave requests found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {studentLeaves.map(leave => (
                                                <div key={leave.id} className="bg-zinc-900 border border-zinc-800/80 rounded-[1.5rem] p-5 shadow-xl">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Leave Dates</p>
                                                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-indigo-400" />
                                                                {leave.fromDate} {leave.toDate ? `to ${leave.toDate}` : ''}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                                            leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                            leave.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                            {leave.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-zinc-300 mt-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">{leave.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
