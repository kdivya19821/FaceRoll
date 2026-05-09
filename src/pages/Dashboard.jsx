import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Download, Database, Trash2, FileText, 
    LayoutDashboard, Users, BookOpen, BarChart3, Settings, 
    LogOut, Search, Bell, Calendar, UserCheck, Activity,
    TrendingUp, AlertCircle, Clock
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { getLogs, clearLogs, getStudents, TEACHER_SUBJECTS, getCurrentTeacher, logout } from '../utils/storage';

export default function Dashboard() {
    const navigate = useNavigate();
    const teacherName = getCurrentTeacher();
    const teacherSubjects = teacherName ? TEACHER_SUBJECTS[teacherName] : [];
    
    const [logs, setLogs] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [timeframe, setTimeframe] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLogs(getLogs());
    }, []);

    const filteredLogs = useMemo(() => {
        let l = [...logs];
        if (selectedSubject !== 'all') {
            l = l.filter(log => log.period === selectedSubject);
        }
        if (searchQuery) {
            l = l.filter(log => 
                log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.studentId.toString().includes(searchQuery)
            );
        }
        return l.reverse();
    }, [logs, selectedSubject, searchQuery]);

    const stats = useMemo(() => {
        const total = getStudents().length;
        const presentCount = new Set(filteredLogs.map(l => l.studentId)).size;
        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
        return { total, present: presentCount, rate };
    }, [filteredLogs]);

    const chartData = [
        { name: 'Mon', value: 85 },
        { name: 'Tue', value: 88 },
        { name: 'Wed', value: 92 },
        { name: 'Thu', value: 94 },
        { name: 'Fri', value: 90 },
        { name: 'Sat', value: 95 },
        { name: 'Sun', value: 89 },
    ];

    const riskData = [
        { name: 'Cat', value: 40 },
        { name: 'Low', value: 60 },
        { name: 'Eng', value: 45 },
        { name: 'Bio', value: 75 },
        { name: 'Arts', value: 65 },
        { name: 'Trend', value: 90 },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-full bg-[#0B0F19] text-white overflow-hidden font-sans">
            
            {/* Sidebar */}
            <aside className="w-64 flex flex-col border-r border-white/5 bg-[#0B0F19] z-20">
                <div className="p-8">
                    <div className="flex items-center space-x-3 mb-10">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                            <span className="font-black text-xl text-white">F</span>
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-white">FaceRoll <span className="text-indigo-400 font-medium">AI</span></h1>
                    </div>

                    <nav className="space-y-2">
                        <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
                        <NavItem icon={<Calendar size={20}/>} label="Attendance" />
                        <NavItem icon={<Users size={20}/>} label="Students" onClick={() => navigate('/students')} />
                        <NavItem icon={<BookOpen size={20}/>} label="Classes" />
                        <NavItem icon={<BarChart3 size={20}/>} label="Analytics" />
                        <NavItem icon={<FileText size={20}/>} label="Reports" />
                        <NavItem icon={<Settings size={20}/>} label="Settings" />
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-white/5">
                    <div className="flex items-center space-x-3 mb-6 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${teacherName}&background=6366f1&color=fff`} alt="Avatar" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate">{teacherName}</p>
                            <p className="text-[10px] text-white/40 uppercase font-black">Professor</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 text-rose-400 hover:text-rose-300 transition-colors p-2"
                    >
                        <LogOut size={20} />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto bg-[#0B0F19]">
                
                {/* Top Header */}
                <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 sticky top-0 bg-[#0B0F19]/80 backdrop-blur-md z-10">
                    <div className="flex items-center space-x-4 flex-1">
                        <div className="relative w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search students, classes, or logs..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0B0F19]"></span>
                        </button>
                        <div className="h-10 w-px bg-white/10 mx-2"></div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-sm font-black text-indigo-400">Term 2024</p>
                        </div>
                    </div>
                </header>

                <div className="p-10 space-y-10">
                    
                    {/* Welcome Row */}
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-2 text-white">Professor Overview</h2>
                            <p className="text-white/40 font-medium">Monitoring attendance and student performance metrics.</p>
                        </div>
                        <div className="flex space-x-3">
                            <button className="flex items-center space-x-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
                                <FileText size={18} />
                                <span>Export Report</span>
                            </button>
                            <button 
                                onClick={() => navigate('/database')}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Database size={18} />
                                <span>Manage Database</span>
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Overall Attendance Card */}
                        <div className="glass-card rounded-[2rem] p-8 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent">
                            <h3 className="text-lg font-black text-white/60 uppercase tracking-widest absolute top-8 left-8">Overall Attendance</h3>
                            
                            <div className="relative mt-4">
                                <svg className="w-48 h-48">
                                    <circle className="text-white/5" strokeWidth="12" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
                                    <circle className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" strokeWidth="12" strokeDasharray={502} strokeDashoffset={502 - (502 * stats.rate) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black tracking-tight">{stats.rate}%</span>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">(Active)</span>
                                </div>
                            </div>

                            <div className="w-full mt-8 grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-black">{stats.present}</p>
                                    <p className="text-xs font-bold text-emerald-400 flex items-center justify-center space-x-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        <span>Marked</span>
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black">{stats.total - stats.present}</p>
                                    <p className="text-xs font-bold text-rose-400 flex items-center justify-center space-x-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                        <span>Absent</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Daily Trend Chart */}
                        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8 border border-white/10 bg-[#161B26]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-white/60 uppercase tracking-widest">Daily Trend</h3>
                                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/40">%</div>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#ffffff30', fontSize: 12}} dy={10} />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#161B26', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px'}}
                                            itemStyle={{color: '#6366f1'}}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#6366f1" 
                                            strokeWidth={4} 
                                            dot={{fill: '#6366f1', strokeWidth: 2, r: 4}} 
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Risk Levels Chart */}
                        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8 border border-white/10 bg-[#161B26]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-white/60 uppercase tracking-widest">Risk Levels</h3>
                                    <p className="text-xs text-white/30 font-medium">Students At-Risk (Low &lt; 80%)</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black">45</span>
                                </div>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={riskData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#ffffff30', fontSize: 12}} dy={10} />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#161B26', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px'}}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Stats Summary Column */}
                        <div className="space-y-8">
                            <StatCard icon={<UserCheck className="text-emerald-400" />} label="Top Attendees" value="12" sub="This Week" />
                            <StatCard icon={<TrendingUp className="text-indigo-400" />} label="Class Growth" value="+14%" sub="Since last month" />
                            <StatCard icon={<AlertCircle className="text-amber-400" />} label="Pending Leaves" value="03" sub="Requires attention" />
                        </div>

                    </div>

                    {/* Recent Activity Table */}
                    <div className="glass-card rounded-[2.5rem] p-10 border border-white/10 bg-[#161B26]">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-white">Recent Activity Logs</h3>
                                <p className="text-white/40 text-sm font-medium mt-1">Live feed of student authentication events.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all">
                                    <Search size={20} />
                                </button>
                                <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all">
                                    <Settings size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                                        <th className="pb-6 px-4">Student ID</th>
                                        <th className="pb-6 px-4">Name</th>
                                        <th className="pb-6 px-4">Class / Subject</th>
                                        <th className="pb-6 px-4">Timestamp</th>
                                        <th className="pb-6 px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center text-white/20 font-bold italic">No logs found for this period.</td>
                                        </tr>
                                    ) : (
                                        filteredLogs.slice(0, 10).map((log, idx) => (
                                            <tr key={idx} className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="py-6 px-4 font-bold text-white/50">{log.studentId}</td>
                                                <td className="py-6 px-4 font-black">{log.studentName}</td>
                                                <td className="py-6 px-4 font-bold text-white/50">{log.period}</td>
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center space-x-2 text-white/40">
                                                        <Clock size={14} />
                                                        <span className="font-medium">{log.time}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        log.type === 'exit' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    }`}>
                                                        {log.type === 'exit' ? 'Present-Yellow' : 'Present-Green'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all ${
                active 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
        >
            {icon}
            <span className="font-bold text-sm tracking-wide">{label}</span>
        </button>
    );
}

function StatCard({ icon, label, value, sub }) {
    return (
        <div className="glass-card rounded-[2rem] p-6 border border-white/10 flex items-center space-x-4 hover:border-white/20 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</p>
                <h4 className="text-2xl font-black mt-0.5">{value}</h4>
                <p className="text-[10px] font-bold text-white/20 mt-0.5">{sub}</p>
            </div>
        </div>
    );
}
