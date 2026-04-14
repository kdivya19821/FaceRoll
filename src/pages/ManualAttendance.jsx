import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getStudents, getPeriods, saveLog, getCurrentTeacher } from '../utils/storage';

export default function ManualAttendance() {
    const navigate = useNavigate();
    const students = getStudents();
    const PERIODS = getPeriods();
    
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'present' | 'absent' | 'late' }
    const [loading, setLoading] = useState(false);

    // Default to present as it's faster for bulk entry, teachers usually only mark absentees
    useEffect(() => {
        const initial = {};
        students.forEach(s => {
            initial[s.id] = 'present';
        });
        setAttendanceState(initial);
    }, []);

    const handleToggle = (id, status) => {
        setAttendanceState(prev => ({ ...prev, [id]: status }));
    };

    const handleSaveLog = () => {
        if (!selectedPeriod) {
            alert('Please select a period first!');
            return;
        }

        if (confirm(`Save manual attendance for ${students.length} students?`)) {
            setLoading(true);
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const day = now.toLocaleDateString([], { weekday: 'long' });
            
            let markedCount = 0;

            students.forEach(student => {
                const status = attendanceState[student.id];
                if (status === 'present' || status === 'late') {
                    const logData = {
                        studentName: student.name,
                        studentId: student.id,
                        period: selectedPeriod,
                        teacher: getCurrentTeacher() || 'Unknown Teacher',
                        fullDate: now.toDateString(),
                        time,
                        day,
                        isLate: status === 'late',
                        location: null, // manual override so no geolocation
                        isManual: true
                    };
                    saveLog(logData);
                    markedCount++;
                }
            });

            setTimeout(() => {
                setLoading(false);
                alert(`Successfully logged ${markedCount} present/late students!`);
                navigate('/dashboard');
            }, 800);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 px-4 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition border border-zinc-700 shadow-lg">
                    <ArrowLeft className="w-6 h-6 text-zinc-300" />
                </button>
                <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 tracking-tight">MANUAL REGISTER</h2>
                <div className="w-10"></div> {/* Placeholder for centering */}
            </div>

            <div className="bg-zinc-900 rounded-3xl p-4 mb-6 shadow-xl border border-zinc-800/80">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Select Period</label>
                <select
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-4 px-4 font-semibold outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                    <option value="">-- Choose Period --</option>
                    {PERIODS.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>

            {students.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                    <AlertCircle className="w-12 h-12 mb-4 text-zinc-500" />
                    <p className="font-bold">No students registered.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pb-24 scrollbar-hide">
                    {students.map(student => {
                        const status = attendanceState[student.id];
                        return (
                            <div key={student.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                                <div className="space-y-0.5 pointer-events-none">
                                    <h4 className="font-bold text-white text-base leading-tight">{student.name}</h4>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">ID: {student.id}</p>
                                </div>
                                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                                    <button 
                                        onClick={() => handleToggle(student.id, 'present')}
                                        className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-600 hover:bg-zinc-900'}`}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleToggle(student.id, 'late')}
                                        className={`p-2 rounded-lg transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-600 hover:bg-zinc-900'}`}
                                    >
                                        <Clock className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleToggle(student.id, 'absent')}
                                        className={`p-2 rounded-lg transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg' : 'text-zinc-600 hover:bg-zinc-900'}`}
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 z-10">
                <button 
                    onClick={handleSaveLog}
                    disabled={loading || students.length === 0}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black py-4 flex items-center justify-center space-x-2 rounded-2xl shadow-xl shadow-orange-500/20 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                >
                    {loading ? (
                         <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Save Offline Roster</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
