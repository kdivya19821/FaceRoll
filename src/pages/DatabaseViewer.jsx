import React, { useState, useEffect } from 'react';
import { Database, ArrowLeft, RefreshCw, ChevronDown, ChevronRight, Hash, User, Clock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JSONViewer = ({ data, name, icon: Icon, expanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(expanded);
    
    let parsedData = null;
    try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        parsedData = data;
    }

    const isArray = Array.isArray(parsedData);
    const count = isArray ? parsedData.length : Object.keys(parsedData || {}).length;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4 shadow-xl">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-white text-sm">{name}</h3>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{count} {isArray ? 'Records' : 'Keys'}</p>
                    </div>
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-500" /> : <ChevronRight className="w-5 h-5 text-zinc-500" />}
            </button>
            
            {isExpanded && (
                <div className="p-4 overflow-x-auto bg-zinc-950/50 max-h-96 overflow-y-auto custom-scrollbar">
                    {parsedData ? (
                        <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                            {JSON.stringify(parsedData, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-xs text-zinc-500 italic text-center py-4">No data stored</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default function DatabaseViewer() {
    const navigate = useNavigate();
    const [dbState, setDbState] = useState({});
    
    const refreshData = () => {
        setDbState({
            'smart_attendance_logs': localStorage.getItem('smart_attendance_logs'),
            'smart_attendance_student_list': localStorage.getItem('smart_attendance_student_list'),
            'smart_attendance_faces': localStorage.getItem('smart_attendance_faces'),
            'smart_attendance_teacher_faces': localStorage.getItem('smart_attendance_teacher_faces'),
            'smart_attendance_leaves': localStorage.getItem('smart_attendance_leaves'),
        });
    };

    useEffect(() => {
        refreshData();
    }, []);

    const storageSize = Object.values(dbState).reduce((acc, val) => acc + (val ? val.length : 0), 0);
    const sizeKB = (storageSize / 1024).toFixed(2);

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 p-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 mt-2">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-indigo-500" />
                    <h1 className="text-lg font-black text-white uppercase tracking-wider">DB Explorer</h1>
                </div>
                <button 
                    onClick={refreshData}
                    className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* DB Stats */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6 flex justify-between items-center shadow-lg">
                <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Storage Engine</p>
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Local Storage API
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Size</p>
                    <p className="text-sm font-bold text-white">{sizeKB} KB</p>
                </div>
            </div>

            {/* DB Tables */}
            <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
                <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-2">Collections / Tables</h2>
                
                <JSONViewer 
                    name="Attendance Logs (Ledger)" 
                    icon={Clock} 
                    data={dbState['smart_attendance_logs']} 
                    expanded={true}
                />
                
                <JSONViewer 
                    name="Student Directory" 
                    icon={User} 
                    data={dbState['smart_attendance_student_list']} 
                />
                
                <JSONViewer 
                    name="Biometric Descriptors (Students)" 
                    icon={Hash} 
                    data={dbState['smart_attendance_faces']} 
                />

                <JSONViewer 
                    name="Biometric Descriptors (Teachers)" 
                    icon={Hash} 
                    data={dbState['smart_attendance_teacher_faces']} 
                />

                <JSONViewer 
                    name="Leave Requests" 
                    icon={FileText} 
                    data={dbState['smart_attendance_leaves']} 
                />
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #3f3f46;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
