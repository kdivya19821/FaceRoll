import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import { ScanFace, LogIn, BookOpen } from 'lucide-react';
import { login, getCurrentTeacher, TEACHER_SUBJECTS, getTeacherFaceDescriptors } from '../utils/storage';
import CameraView from '../components/CameraView';
import { loadModels, detectFaces, toFloat32Array } from '../utils/faceUtils';

const TEACHERS = Object.keys(TEACHER_SUBJECTS);

export default function Login() {
    const navigate = useNavigate();
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loadingModels, setLoadingModels] = useState(true);
    const [scanStatus, setScanStatus] = useState('Initializing Scanner...');

    const cameraRef = useRef(null);
    const faceMatcherRef = useRef(null);
    const autoLoginTriggered = useRef(false);

    React.useEffect(() => {
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
                faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.70);
                setScanStatus('Scanner active. Look at the camera to login.');
            } else {
                setScanStatus('No teacher faces registered. Please use manual login.');
            }
            setLoadingModels(false);
        }
        init();
    }, []);

    const handleDraw = async (video, canvas) => {
        if (!video || !canvas || !faceMatcherRef.current || autoLoginTriggered.current) return;

        try {
            const detections = await detectFaces(video);
            if (!detections || detections.length === 0) return;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const bestMatch = faceMatcherRef.current.findBestMatch(detections[0].descriptor);
            
            // Draw on box
            const box = resizedDetections[0].detection.box;
            const drawLabel = new faceapi.draw.DrawTextField(
                [`${bestMatch.label} (${Math.round((1 - bestMatch.distance) * 100)}%)`],
                box.bottomLeft
            );
            faceapi.draw.drawDetections(canvas, resizedDetections);
            drawLabel.draw(canvas);

            if (bestMatch.label !== 'unknown' && TEACHERS.includes(bestMatch.label)) {
                autoLoginTriggered.current = true;
                setScanStatus(`Welcome, ${bestMatch.label}! (${Math.round((1 - bestMatch.distance) * 100)}% match)`);
                setSelectedTeacher(bestMatch.label);
                
                setTimeout(() => {
                    login(bestMatch.label);
                    navigate('/', { replace: true });
                }, 1500);
            } else {
                setScanStatus(`Detected: Unknown (${Math.round((1 - bestMatch.distance) * 100)}% match)`);
            }
        } catch (err) {
            setScanStatus("Scanner Error: " + err.message);
        }
    };

    const handleManualLogin = (e) => {
        e.preventDefault();
        if (!selectedTeacher) return;
        login(selectedTeacher);
        navigate('/', { replace: true });
    };

    const assignedSubjects = selectedTeacher ? TEACHER_SUBJECTS[selectedTeacher] : [];

    return (
        <div className="flex flex-col flex-1 items-center justify-center p-4 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
            <div className="text-center space-y-4 mt-6">
                <div className="mx-auto w-24 h-24 bg-white/5 rounded-[2rem] p-1 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
                    <img src="/logo.png" alt="FaceRoll Logo" className="w-full h-full object-cover rounded-[1.8rem]" />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">Smart Portal</h1>
                    <p className="text-indigo-400/80 font-bold uppercase tracking-[0.2em] text-[10px]">Auto Facial Authentication</p>
                </div>
            </div>

            <div className="w-full relative bg-zinc-900 rounded-[2rem] p-2 border border-zinc-800/60 overflow-hidden shadow-2xl h-[35vh]">
                {loadingModels ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 bg-zinc-900">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-500 text-sm font-medium">Loading Camera AI...</p>
                    </div>
                ) : (
                    <CameraView ref={cameraRef} onDraw={handleDraw} />
                )}
                <div className="absolute bottom-3 left-3 right-3 bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-xl text-center shadow-lg border border-zinc-700">
                    <p className={`font-semibold text-xs sm:text-sm ${autoLoginTriggered.current ? 'text-emerald-400 animate-pulse' : 'text-indigo-300'}`}>
                        {scanStatus}
                    </p>
                </div>
            </div>

            <form onSubmit={handleManualLogin} className="w-full space-y-4 pb-6">
                <div className="bg-zinc-900 rounded-[2rem] p-5 shadow-xl border border-zinc-800 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-400 mb-2 ml-1">Or Select Name Manually</label>
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            disabled={autoLoginTriggered.current}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl py-3.5 px-4 font-semibold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                        >
                            <option value="">-- Manual Fallback --</option>
                            {TEACHERS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {assignedSubjects.length > 0 && (
                        <div className="bg-zinc-950/60 rounded-2xl p-4 border border-zinc-800/60 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center space-x-2 mb-3">
                                <BookOpen className="w-4 h-4 text-indigo-400" />
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assigned Subjects</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {assignedSubjects.map(s => (
                                    <span key={s} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold px-3 py-1.5 rounded-full">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!selectedTeacher || autoLoginTriggered.current}
                    className="w-full flex items-center justify-center space-x-3 p-4 rounded-[2rem] bg-white text-black font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-xl shadow-white/10 disabled:opacity-50 disabled:active:scale-100"
                >
                    <span>Continue to Dashboard</span>
                    <LogIn className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
