import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scan, Users, BookOpenCheck, Settings, LogOut, GraduationCap, CalendarCheck, ClipboardEdit, FileText } from 'lucide-react';
import { getCurrentTeacher, logout, getStudents, getLogs } from '../utils/storage';

export default function Home() {
    const navigate = useNavigate();
    const teacher = getCurrentTeacher();
    const students = getStudents();
    const logs = getLogs();
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => l.fullDate === today);
    const uniquePresentToday = new Set(todayLogs.map(l => l.studentId)).size;

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex flex-col flex-1 p-6 animate-in fade-in zoom-in duration-500 justify-center">

            <div className="flex justify-between items-center py-3 bg-zinc-900/80 rounded-3xl px-5 border border-zinc-800/80 mb-8 shadow-xl">
                <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Session Active</p>
                    <p className="font-extrabold text-sm text-zinc-200">{teacher}</p>
                </div>
                <button onClick={handleLogout} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-all group">
                    <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
            </div>

            <div className="text-center space-y-2 mb-8 mt-2">
                <div className="mx-auto w-24 h-24 bg-white/5 rounded-3xl p-1 border border-white/10 shadow-xl overflow-hidden mb-6">
                    <img src="/logo.png" alt="FaceRoll Logo" className="w-full h-full object-cover rounded-2xl" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
                    FaceRoll
                </h1>
                <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px]">Smart Bio-Attendance</p>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-2 -top-2 text-violet-500/10 group-hover:text-violet-500/20 transition-colors">
                        <GraduationCap className="w-16 h-16" />
                    </div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Total Students</p>
                    <p className="text-2xl font-black text-white relative z-10">{students.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-2 -top-2 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                        <CalendarCheck className="w-16 h-16" />
                    </div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Present Today</p>
                    <p className="text-2xl font-black text-emerald-400 relative z-10">{uniquePresentToday}</p>
                </div>
            </div>

            <div className="w-full space-y-3">
                <Link
                    to="/attendance"
                    className="group relative w-full flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 overflow-hidden hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/20 mb-2"
                >
                    <div className="relative z-10 flex items-center space-x-4">
                        <Scan className="w-6 h-6 text-indigo-100" />
                        <span className="font-semibold text-lg text-white">Mark Attendance</span>
                    </div>
                </Link>

                <Link
                    to="/register"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-800/80 border border-zinc-500/20 hover:bg-zinc-800 hover:border-zinc-500/50 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <div className="flex items-center space-x-4">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold text-zinc-200">Register Faces</span>
                    </div>
                </Link>

                <Link
                    to="/subjects"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-800/80 border border-zinc-500/20 hover:bg-zinc-800 hover:border-zinc-500/50 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <div className="flex items-center space-x-4">
                        <Settings className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-zinc-200">Manage Subjects</span>
                    </div>
                </Link>

                <Link
                    to="/students"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-800/80 border border-zinc-500/20 hover:bg-zinc-800 hover:border-zinc-500/50 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <div className="flex items-center space-x-4">
                        <Users className="w-5 h-5 text-violet-400" />
                        <span className="font-semibold text-zinc-200">Manage Students</span>
                    </div>
                </Link>

                <Link
                    to="/dashboard"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-800/80 border border-zinc-500/20 hover:bg-zinc-800 hover:border-zinc-500/50 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <div className="flex items-center space-x-4">
                        <BookOpenCheck className="w-5 h-5 text-emerald-400" />
                        <span className="font-semibold text-zinc-200">Attendance Log</span>
                    </div>
                </Link>

                <Link
                    to="/manual-attendance"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/50 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <div className="flex items-center space-x-4">
                        <ClipboardEdit className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-amber-500">Manual Roster</span>
                    </div>
                </Link>

                <Link
                    to="/leaves"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/50 hover:scale-[1.02] active:scale-95 transition-all mb-4"
                >
                    <div className="flex items-center space-x-4">
                        <FileText className="w-5 h-5 text-rose-400" />
                        <span className="font-semibold text-rose-400">Leave Requests</span>
                    </div>
                </Link>
            </div>
        </div>
    );
}
