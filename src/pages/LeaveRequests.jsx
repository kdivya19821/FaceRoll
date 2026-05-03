import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, FileText, Calendar } from 'lucide-react';
import { getLeaves, updateLeaveStatus, getStudents } from '../utils/storage';

export default function LeaveRequests() {
    const navigate = useNavigate();
    const students = getStudents();
    
    // We use state to trigger re-renders when a status is updated
    const [leaves, setLeaves] = useState(getLeaves().reverse());

    // Separate leaves by status
    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const processedLeaves = leaves.filter(l => l.status !== 'Pending');

    const handleUpdateStatus = (leaveId, status) => {
        updateLeaveStatus(leaveId, status);
        // Refresh local state
        setLeaves(getLeaves().reverse());
    };

    const getStudentName = (id) => {
        const student = students.find(s => s.id.toString() === id.toString());
        return student ? student.name : `Unknown (ID: ${id})`;
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 p-4 animate-in fade-in duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-2 mt-2">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition border border-zinc-700">
                    <ArrowLeft className="w-5 h-5 text-zinc-300" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">Leave Management</h2>
                <div className="w-9"></div> {/* Spacer for centering */}
            </div>

            <div className="flex-1 overflow-y-auto px-1 pb-10 scrollbar-hide space-y-8">
                
                {/* Pending Requests Section */}
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Pending Approvals ({pendingLeaves.length})</h3>
                    </div>
                    
                    {pendingLeaves.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-3xl p-8 text-center">
                            <p className="text-zinc-500 font-semibold">No pending requests.</p>
                            <p className="text-xs text-zinc-600 mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingLeaves.map(leave => (
                                <div key={leave.id} className="bg-zinc-900 border border-amber-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 text-amber-400">
                                        <FileText className="w-16 h-16 -mr-4 -mt-4" />
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white">{getStudentName(leave.studentId)}</h4>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID: #{leave.studentId}</p>
                                            </div>
                                            <div className="flex items-center space-x-1.5 bg-zinc-950/50 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                                <span className="text-xs font-bold text-zinc-300">{leave.date}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 mb-4">
                                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">"{leave.reason}"</p>
                                        </div>
                                        
                                        <div className="flex space-x-3">
                                            <button 
                                                onClick={() => handleUpdateStatus(leave.id, 'Approved')}
                                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>APPROVE</span>
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(leave.id, 'Rejected')}
                                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-zinc-800 hover:bg-rose-500/20 text-white hover:text-rose-400 font-black rounded-xl border border-zinc-700 hover:border-rose-500/30 transition-all"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>REJECT</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* History Section */}
                <section>
                    <div className="flex items-center space-x-2 mb-4 opacity-50">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Processed History</h3>
                    </div>
                    
                    {processedLeaves.length > 0 && (
                        <div className="space-y-3 opacity-70">
                            {processedLeaves.map(leave => (
                                <div key={leave.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-white">{getStudentName(leave.studentId)}</p>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{leave.date}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                        leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                        {leave.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                
            </div>
        </div>
    );
}
