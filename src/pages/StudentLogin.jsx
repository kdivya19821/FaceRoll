import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import { LogIn, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import { loginStudent, getCurrentStudent, getStudents, getFaceDescriptors } from '../utils/storage';
import CameraView from '../components/CameraView';
import { loadModels, detectFaces, toFloat32Array } from '../utils/faceUtils';

export default function StudentLogin() {
    const navigate = useNavigate();
    const students = getStudents();
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loadingModels, setLoadingModels] = useState(true);
    const [scanStatus, setScanStatus] = useState('Initializing AI Scanner...');
    const [autoLoginTriggered, setAutoLoginTriggered] = useState(false);

    const cameraRef = useRef(null);
    const faceMatcherRef = useRef(null);
    const triggeredRef = useRef(false);

    useEffect(() => {
        if (getCurrentStudent()) {
            navigate('/student-dashboard', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        async function init() {
            try {
                await loadModels();
                const studentFaces = getFaceDescriptors();
                const labeledDescriptors = [];
                
                for (const [studentId, descriptorObj] of Object.entries(studentFaces)) {
                    const float32Array = toFloat32Array(descriptorObj);
                    if (float32Array) {
                        labeledDescriptors.push(
                            new faceapi.LabeledFaceDescriptors(studentId.toString(), [float32Array])
                        );
                    }
                }

                if (labeledDescriptors.length > 0) {
                    faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.40);
                    setScanStatus('Scanner Active');
                } else {
                    setScanStatus('No faces registered');
                }
                setLoadingModels(false);
            } catch (err) {
                console.error("AI Init Error:", err);
                setScanStatus('Scanner Error');
                setLoadingModels(false);
            }
        }
        init();
    }, []);

    const handleDraw = async (video, canvas) => {
        if (!video || !canvas || !faceMatcherRef.current || triggeredRef.current) return;

        try {
            const detections = await detectFaces(video);
            if (!detections || detections.length === 0) {
                setScanStatus('Scanning...');
                return;
            }

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);
            
            const bestMatch = faceMatcherRef.current.findBestMatch(detections[0].descriptor);
            
            if (bestMatch.label !== 'unknown') {
                const matchedStudent = students.find(s => s.id.toString() === bestMatch.label);
                if (matchedStudent) {
                    triggeredRef.current = true;
                    setAutoLoginTriggered(true);
                    setScanStatus(`Welcome, ${matchedStudent.name}!`);
                    setSelectedStudentId(matchedStudent.id.toString());
                    
                    setTimeout(() => {
                        loginStudent(matchedStudent.id.toString());
                        navigate('/student-dashboard', { replace: true });
                    }, 1000);
                }
            } else {
                setScanStatus('Searching...');
            }
        } catch (err) {
            console.error("Face Detect Error:", err);
        }
    };

    const handleManualLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!selectedStudentId) return;

        const student = students.find(s => s.id.toString() === selectedStudentId);
        if (!student || student.password !== password) {
            setError('Incorrect password');
            return;
        }

        loginStudent(selectedStudentId);
        navigate('/student-dashboard', { replace: true });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-black">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md flex flex-col space-y-6 relative z-10">
                {/* Header Card */}
                <div className="flex items-center justify-between mb-2">
                    <Link to="/login" className="p-3 glass rounded-full hover:bg-white/10 transition border border-white/5">
                        <ArrowLeft className="w-5 h-5 text-zinc-300" />
                    </Link>
                    <div className="text-right space-y-1">
                        <h1 className="text-2xl font-black text-white tracking-tighter">STUDENT PORTAL</h1>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Self-Service Dashboard</p>
                    </div>
                </div>

                {/* AI Scanner Section */}
                <div className="w-full relative glass-dark rounded-[2.5rem] p-2 overflow-hidden shadow-2xl aspect-video border border-white/5">
                    {/* Scanner Animation Overlay */}
                    <div className="absolute inset-x-2 top-2 bottom-2 z-20 pointer-events-none overflow-hidden rounded-[1.8rem]">
                        <div className="w-full h-[2px] bg-emerald-500/80 shadow-[0_0_15px_#10b981] absolute top-0 left-0 animate-[scan_3s_linear_infinite]"></div>
                    </div>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes scan {
                            0% { transform: translateY(0); }
                            50% { transform: translateY(180px); }
                            100% { transform: translateY(0); }
                        }
                    `}} />

                    {loadingModels ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 bg-zinc-900/50 backdrop-blur-xl">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Initializing Scanner AI...</p>
                        </div>
                    ) : (
                        <CameraView ref={cameraRef} onDraw={handleDraw} />
                    )}
                    <div className="absolute bottom-3 left-3 right-3 glass px-4 py-2 rounded-2xl text-center shadow-lg border border-white/5 z-30">
                        <p className={`font-black text-[10px] uppercase tracking-widest ${autoLoginTriggered ? 'text-emerald-400 animate-pulse' : 'text-zinc-300'}`}>
                            {scanStatus}
                        </p>
                    </div>
                </div>

                {/* Manual Login Section */}
                <form onSubmit={handleManualLogin} className="space-y-4">
                    <div className="glass-dark rounded-[2.5rem] p-6 shadow-xl border border-white/5 space-y-5">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Manual Selection</label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => {
                                    setSelectedStudentId(e.target.value);
                                    setError('');
                                }}
                                disabled={autoLoginTriggered}
                                className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl py-4 px-4 font-bold outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none"
                            >
                                <option value="">Select Student Name</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
                                ))}
                            </select>
                        </div>

                        {selectedStudentId && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Account Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <KeyRound className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError('');
                                        }}
                                        disabled={autoLoginTriggered}
                                        placeholder="••••••••"
                                        className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl py-4 pl-11 pr-12 font-bold outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all tracking-widest"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {error && <p className="text-rose-500 text-[10px] mt-2 ml-1 font-black uppercase tracking-widest">{error}</p>}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!selectedStudentId || !password || autoLoginTriggered}
                            className="w-full flex items-center justify-center space-x-3 py-4 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 disabled:active:scale-100"
                        >
                            <span>Access Dashboard</span>
                            <LogIn className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
