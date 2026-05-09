import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import { ScanFace, LogIn, Eye, EyeOff, Camera, User, Lock, HelpCircle } from 'lucide-react';
import { login, getCurrentTeacher, TEACHER_SUBJECTS, getTeacherFaceDescriptors, TEACHER_PASSWORDS } from '../utils/storage';
import CameraView from '../components/CameraView';
import { loadModels, detectFaces, toFloat32Array } from '../utils/faceUtils';

const TEACHERS = Object.keys(TEACHER_SUBJECTS);

export default function Login() {
    const navigate = useNavigate();
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loadingModels, setLoadingModels] = useState(true);
    const [scanStatus, setScanStatus] = useState('Ready for Scan');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [showCamera, setShowCamera] = useState(false);

    const cameraRef = useRef(null);
    const faceMatcherRef = useRef(null);
    const autoLoginTriggered = useRef(false);

    useEffect(() => {
        if (getCurrentTeacher()) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        async function init() {
            await loadModels();
            const teacherFaces = getTeacherFaceDescriptors();
            const labeledDescriptors = [];
            
            for (const [teacherName, descriptorObj] of Object.entries(teacherFaces)) {
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
        }
        init();
    }, []);

    const handleDraw = async (video, canvas) => {
        if (!video || !canvas || !faceMatcherRef.current || autoLoginTriggered.current) return;

        try {
            const detections = await detectFaces(video);
            if (!detections || detections.length === 0) {
                setScanStatus('Scanning...');
                return;
            }

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            
            const bestMatch = faceMatcherRef.current.findBestMatch(detections[0].descriptor);
            
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);

            if (bestMatch.label !== 'unknown' && TEACHERS.includes(bestMatch.label)) {
                autoLoginTriggered.current = true;
                setScanStatus(`Authenticated: ${bestMatch.label}`);
                setSelectedTeacher(bestMatch.label);
                
                setTimeout(() => {
                    login(bestMatch.label);
                    navigate('/', { replace: true });
                }, 1000);
            } else {
                setScanStatus('Unknown user detected');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleManualLogin = (e) => {
        e.preventDefault();
        if (!selectedTeacher) {
            setLoginError('Please select a teacher');
            return;
        }
        
        const correctPassword = TEACHER_PASSWORDS[selectedTeacher];
        if (password !== correctPassword) {
            setLoginError('Incorrect password');
            return;
        }

        login(selectedTeacher);
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md z-10 flex flex-col items-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                
                {/* Main Glass Card */}
                <div className="w-full glass-card rounded-[2.5rem] p-10 md:p-12 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-[32px] flex flex-col items-center">
                    
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-400/30">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">FaceRoll <span className="font-normal opacity-70 italic text-indigo-300">Attendance</span></h2>
                    </div>

                    <div className="text-center space-y-2 mb-10 w-full">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome Back</h1>
                        <p className="text-sm font-medium text-white/50 tracking-wide">Securely log in to your attendance dashboard.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleManualLogin} className="w-full space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70 ml-1">Teacher Identity</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <select
                                        value={selectedTeacher}
                                        onChange={(e) => {
                                            setSelectedTeacher(e.target.value);
                                            setLoginError('');
                                        }}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 font-semibold focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="bg-slate-900">Select Name</option>
                                        {TEACHERS.map(t => (
                                            <option key={t} value={t} className="bg-slate-900">{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-sm font-bold text-white/70">Password</label>
                                    <button type="button" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot Password?</button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-12 font-semibold focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {loginError && <p className="text-rose-400 text-xs font-bold mt-2 ml-1">{loginError}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group mt-8"
                        >
                            <span>Log In</span>
                            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>

                {/* Biometric Section */}
                <div className="w-full space-y-6 text-center">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-xs font-black text-white/40 uppercase tracking-widest">Or Login via biometric</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {!showCamera ? (
                        <button
                            onClick={() => setShowCamera(true)}
                            className="w-full glass-card rounded-[2rem] p-4 flex items-center justify-center space-x-4 border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-400/20 group-hover:scale-110 transition-transform relative z-10">
                                <Camera className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div className="text-left relative z-10">
                                <h3 className="font-black text-white text-lg leading-none mb-1">Facial Recognition Login</h3>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Ready for Scan</p>
                            </div>
                        </button>
                    ) : (
                        <div className="w-full space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="w-full relative glass-card rounded-[2rem] p-2 overflow-hidden aspect-video border border-indigo-500/30">
                                {loadingModels ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-20 bg-black/60">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-xs font-bold text-indigo-300 tracking-widest uppercase">Initializing AI...</p>
                                    </div>
                                ) : (
                                    <>
                                        <CameraView ref={cameraRef} onDraw={handleDraw} />
                                        <div className="absolute inset-0 border-[2px] border-indigo-500/20 pointer-events-none rounded-[1.8rem]"></div>
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-indigo-500/30">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">{scanStatus}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button onClick={() => setShowCamera(false)} className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Cancel Scan</button>
                        </div>
                    )}
                </div>

                <div className="text-center pt-4">
                    <p className="text-sm font-bold text-white/40">Are you a student? <Link to="/student-login" className="text-indigo-400 hover:underline">Go to Student Portal</Link></p>
                </div>
            </div>
        </div>
    );
}
