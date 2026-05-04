import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Clock, Calendar, MapPin, AlertCircle, User, Activity } from 'lucide-react';
import { getCurrentStudent, logoutStudent, getStudentStats, getStudents, getLogs, getLeaves, submitLeave } from '../utils/storage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const studentId = getCurrentStudent();
    const students = getStudents();
    const student = students.find(s => s.id.toString() === studentId);
    
    const [viewMode, setViewMode] = useState('overview'); // 'overview', 'history', 'leaves'
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    
    // Fallback if somehow accessed without valid session
    if (!studentId || !student) {
        navigate('/student-login', { replace: true });
        return null;
    }

    const stats = getStudentStats(studentId);
    const logs = getLogs().filter(l => l.studentId.toString() === studentId).reverse();
    const studentLeaves = getLeaves().filter(l => l.studentId.toString() === studentId).reverse();
    
    const totalClasses = stats.reduce((acc, curr) => acc + curr.total, 0);
    const attendedClasses = stats.reduce((acc, curr) => acc + curr.attended, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    const totalLate = stats.reduce((acc, curr) => acc + curr.lateCount, 0);

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
        if (!leaveDate || !leaveReason) return;
        submitLeave(studentId, leaveDate, leaveReason);
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
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 z-10">Overall %</p>
                    <p className={`text-3xl font-black z-10 ${overallPercentage >= 75 ? 'text-emerald-400' : overallPercentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {overallPercentage}%
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[1.5rem] shadow-lg flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Attended</p>
                            <p className="text-xl font-bold text-white">{attendedClasses} <span className="text-xs text-zinc-600">/ {totalClasses}</span></p>
                        </div>
                        <BookOpen className="w-5 h-5 text-indigo-400/50" />
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[1.5rem] shadow-lg flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Late</p>
                            <p className="text-xl font-bold text-rose-400">{totalLate}</p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-rose-400/50" />
                    </div>
                </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-zinc-900/80 rounded-2xl p-1 mb-6 border border-zinc-800 mx-1">
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'overview' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('overview')}
                >
                    <span>SUBJECTS</span>
                </button>
                <button 
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'history' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('history')}
                >
                    <span>HISTORY ({logs.length})</span>
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
                                {stats.map((stat, index) => (
                                    <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="flex justify-between items-center mb-5">
                                            <div className="space-y-0.5">
                                                <h3 className="text-sm font-bold text-white leading-tight">{stat.subject}</h3>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.teacher}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-widest ${getStatusColor(stat.percentage)}`}>
                                                {stat.percentage}%
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                <span>Attendance</span>
                                                <span className="text-zinc-300">{stat.attended} / {stat.total} Classes</span>
                                            </div>
                                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
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
                    )
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
                                    {log.location && (
                                        <div className="flex items-center space-x-1.5 text-zinc-500">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">Geo-Tagged</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Request Form */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
                            <h3 className="text-sm font-bold text-white mb-4">Request Leave</h3>
                            <form onSubmit={handleLeaveSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={leaveDate}
                                        onChange={(e) => setLeaveDate(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 px-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                        required
                                    />
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
                                                    <p className="text-xs text-zinc-400 font-semibold mb-0.5">Date Requested</p>
                                                    <p className="text-sm font-bold text-white">{leave.date}</p>
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
