import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, BookOpen, Trash2, PieChart, List, UserCheck, AlertCircle, BarChart3, MapPin, TrendingUp, Landmark, Download } from 'lucide-react';
import { getLogs, clearLogs, getAttendanceStats, getCurrentTeacher } from '../utils/storage';
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
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_Report_${new Date().toLocaleDateString()}.csv`);
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

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 p-4 animate-in fade-in duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-2 mt-2">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition border border-zinc-700">
                    <ArrowLeft className="w-5 h-5 text-zinc-300" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">Analytics</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExport} className="p-2 bg-emerald-500/10 rounded-full hover:bg-emerald-500/20 transition group border border-emerald-500/20">
                        <Download className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </button>
                    <button onClick={handleClear} className="p-2 bg-rose-500/10 rounded-full hover:bg-rose-500/20 transition group">
                        <Trash2 className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Global Timeframe Selector */}
            <div className="flex space-x-2 mb-6 px-1">
                {[
                    { id: 'all', label: 'OVERALL', color: 'indigo' },
                    { id: 'monthly', label: 'THIS MONTH', color: 'amber' },
                    { id: 'weekly', label: 'THIS WEEK', color: 'emerald' }
                ].map((tf) => {
                    const isActive = timeframe === tf.id;
                    const colors = {
                        indigo: isActive ? 'bg-indigo-500 border-indigo-500 text-white shadow-indigo-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-indigo-400',
                        amber: isActive ? 'bg-amber-500 border-amber-500 text-black shadow-amber-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-400',
                        emerald: isActive ? 'bg-emerald-500 border-emerald-500 text-black shadow-emerald-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-emerald-400'
                    };
                    
                    return (
                        <button
                            key={tf.id}
                            onClick={() => setTimeframe(tf.id)}
                            className={`flex-1 py-3 px-3 text-[10px] font-black rounded-2xl border transition-all duration-300 shadow-xl ${colors[tf.color]}`}
                        >
                            {tf.label}
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Timeframe Heading */}
            <div className="flex items-center space-x-3 mb-4 px-2">
                <div className={`h-6 w-1 rounded-full ${
                    timeframe === 'all' ? 'bg-indigo-500' : timeframe === 'monthly' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>
                <h3 className={`text-sm font-black uppercase tracking-widest ${
                    timeframe === 'all' ? 'text-indigo-400' : timeframe === 'monthly' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
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
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-[10px] font-black rounded-xl transition-all ${viewMode === 'charts' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setViewMode('charts')}
                >
                    <BarChart3 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 pb-10 scrollbar-hide">
                {viewMode === 'recent' ? (
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

                            {/* Individual Student Stats */}
                            <div className="space-y-4">
                                {stats.map((stat, index) => (
                                    <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="flex justify-between items-center mb-5">
                                            <div className="space-y-0.5">
                                                <h3 className="text-lg font-bold text-white leading-tight">{stat.studentName}</h3>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.subject}</p>
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
