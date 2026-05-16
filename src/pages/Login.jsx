import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import { ScanFace, LogIn, BookOpen, KeyRound, Eye, EyeOff } from 'lucide-react';
import { login, getCurrentTeacher, getTeacherSubjects, getTeacherFaceDescriptors, getTeacherPasswords } from '../utils/storage';
import CameraView from '../components/CameraView';
import { loadModels, detectFaces, toFloat32Array } from '../utils/faceUtils';

export default function Login() {
    const navigate = useNavigate();
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loadingModels, setLoadingModels] = useState(true);
    const [scanStatus, setScanStatus] = useState('Initializing AI...');
    const [autoLoginTriggered, setAutoLoginTriggered] = useState(false);

    const cameraRef = useRef(null);
    const faceMatcherRef = useRef(null);
    const triggeredRef = useRef(false);

    useEffect(() => {
        if (getCurrentTeacher()) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        async function init() {
            try {
                await loadModels();
                const teacherFaces = getTeacherFaceDescriptors();
                const teacherNames = Object.keys(getTeacherSubjects());
                const labeledDescriptors = [];
                
                for (const [teacherName, descriptorObj] of Object.entries(teacherFaces)) {
                    if (!teacherNames.includes(teacherName)) continue;
                    const float32Array = toFloat32Array(descriptorObj);
                    if (float32Array) {
                        labeledDescriptors.push(
                            new faceapi.LabeledFaceDescriptors(teacherName, [float32Array])
                        );
                    }
                }

                if (labeledDescriptors.length > 0) {
                    faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.40);
                }
                setLoadingModels(false);
                setScanStatus('Ready for Scan');
            } catch (err) {
                console.error("AI Init Error:", err);
                setScanStatus('AI Error');
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
            
            if (bestMatch.label !== 'unknown' && Object.keys(getTeacherSubjects()).includes(bestMatch.label)) {
                triggeredRef.current = true;
                setAutoLoginTriggered(true);
                setScanStatus(`Authenticated: ${bestMatch.label}`);
                setSelectedTeacher(bestMatch.label);
                
                setTimeout(() => {
                    login(bestMatch.label);
                    navigate('/', { replace: true });
                }, 1000);
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
        if (!selectedTeacher) return;
        
        const passwords = getTeacherPasswords();
        if (passwords[selectedTeacher] !== password) {
            setError('Incorrect password');
            return;
        }

        login(selectedTeacher);
        navigate('/', { replace: true });
    };

    const subjects = getTeacherSubjects();
    const teacherNames = Object.keys(subjects);

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-black">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md flex flex-col space-y-6 relative z-10">
                {/* Header Card */}
                <div className="text-center space-y-2 mb-4">
                    <h1 className="text-4xl font-black text-white tracking-tighter">FACEROLL</h1>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Teacher Management Portal</p>
                </div>

                {/* AI Scanner Section */}
                <div className="w-full relative glass-dark rounded-[2.5rem] p-2 overflow-hidden shadow-2xl aspect-video border border-white/5">
                    {loadingModels ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 bg-zinc-900/50 backdrop-blur-xl">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Initializing AI Models...</p>
                        </div>
                    ) : (
                        <CameraView ref={cameraRef} onDraw={handleDraw} />
                    )}
                    <div className="absolute bottom-3 left-3 right-3 glass px-4 py-2 rounded-2xl text-center shadow-lg border border-white/5">
                        <p className={`font-black text-[10px] uppercase tracking-widest ${autoLoginTriggered ? 'text-emerald-400 animate-pulse' : 'text-indigo-300'}`}>
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
                                value={selectedTeacher}
                                onChange={(e) => {
                                    setSelectedTeacher(e.target.value);
                                    setError('');
                                }}
                                disabled={autoLoginTriggered}
                                className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl py-4 px-4 font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                            >
                                <option value="">Select Professor Name</option>
                                {teacherNames.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {selectedTeacher && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Secure PIN / Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <KeyRound className="w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
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
                                        className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-2xl py-4 pl-11 pr-12 font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all tracking-widest"
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
                            disabled={!selectedTeacher || !password || autoLoginTriggered}
                            className="w-full flex items-center justify-center space-x-3 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 active:scale-95 transition-all shadow-xl shadow-white/10 disabled:opacity-30 disabled:active:scale-100"
                        >
                            <span>Enter Portal</span>
                            <LogIn className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Footer / Links */}
                    <div className="pt-6 text-center space-y-4">
                        <div className="flex items-center justify-center space-x-4">
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Student Access</span>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </div>
                        <Link 
                            to="/student-login"
                            className="inline-block w-full py-4 rounded-[2rem] glass-dark border border-white/5 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all shadow-lg"
                        >
                            Switch to Student Portal &rarr;
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
