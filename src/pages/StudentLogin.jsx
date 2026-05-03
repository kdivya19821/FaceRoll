import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import { ScanFace, LogIn, ArrowLeft } from 'lucide-react';
import { loginStudent, getCurrentStudent, getStudents, getFaceDescriptors } from '../utils/storage';
import CameraView from '../components/CameraView';
import { loadModels, detectFaces, toFloat32Array } from '../utils/faceUtils';

export default function StudentLogin() {
    const navigate = useNavigate();
    const students = getStudents();
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [loadingModels, setLoadingModels] = useState(true);
    const [scanStatus, setScanStatus] = useState('Initializing Scanner...');

    const cameraRef = useRef(null);
    const faceMatcherRef = useRef(null);
    const autoLoginTriggered = useRef(false);

    React.useEffect(() => {
        if (getCurrentStudent()) {
            navigate('/student-dashboard', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        async function init() {
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
                setScanStatus('Scanner active. Look at the camera to login.');
            } else {
                setScanStatus('No student faces registered. Please use manual login.');
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

            if (bestMatch.label !== 'unknown') {
                const matchedStudent = students.find(s => s.id.toString() === bestMatch.label);
                if (matchedStudent) {
                    autoLoginTriggered.current = true;
                    setScanStatus(`Welcome, ${matchedStudent.name}! (${Math.round((1 - bestMatch.distance) * 100)}% match)`);
                    setSelectedStudentId(matchedStudent.id.toString());
                    
                    setTimeout(() => {
                        loginStudent(matchedStudent.id.toString());
                        navigate('/student-dashboard', { replace: true });
                    }, 1500);
                }
            } else {
                setScanStatus(`Detected: Unknown (${Math.round((1 - bestMatch.distance) * 100)}% match)`);
            }
        } catch (err) {
            setScanStatus("Scanner Error: " + err.message);
        }
    };

    const handleManualLogin = (e) => {
        e.preventDefault();
        if (!selectedStudentId) return;
        loginStudent(selectedStudentId);
        navigate('/student-dashboard', { replace: true });
    };

    return (
        <div className="flex flex-col flex-1 p-4 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
            <div className="flex items-center justify-between mt-2">
                <Link to="/login" className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition border border-zinc-700">
                    <ArrowLeft className="w-5 h-5 text-zinc-300" />
                </Link>
                <div className="text-right">
                    <h1 className="text-xl font-extrabold tracking-tight text-white">Student Portal</h1>
                    <p className="text-emerald-400/80 font-bold uppercase tracking-[0.1em] text-[10px]">Self-Service</p>
                </div>
            </div>

            <div className="w-full relative bg-zinc-900 rounded-[2rem] p-2 border border-zinc-800/60 overflow-hidden shadow-2xl h-[40vh]">
                {loadingModels ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 bg-zinc-900">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-500 text-sm font-medium">Loading Camera AI...</p>
                    </div>
                ) : (
                    <CameraView ref={cameraRef} onDraw={handleDraw} />
                )}
                <div className="absolute bottom-3 left-3 right-3 bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-xl text-center shadow-lg border border-zinc-700">
                    <p className={`font-semibold text-xs sm:text-sm ${autoLoginTriggered.current ? 'text-emerald-400 animate-pulse' : 'text-zinc-300'}`}>
                        {scanStatus}
                    </p>
                </div>
            </div>

            <form onSubmit={handleManualLogin} className="w-full space-y-4 pb-6">
                <div className="bg-zinc-900 rounded-[2rem] p-5 shadow-xl border border-zinc-800 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-400 mb-2 ml-1">Or Select Name Manually</label>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            disabled={autoLoginTriggered.current}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl py-3.5 px-4 font-semibold outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none"
                        >
                            <option value="">-- Manual Fallback --</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!selectedStudentId || autoLoginTriggered.current}
                    className="w-full flex items-center justify-center space-x-3 p-4 rounded-[2rem] bg-emerald-500 text-black font-bold hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:active:scale-100"
                >
                    <span>View My Dashboard</span>
                    <LogIn className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
