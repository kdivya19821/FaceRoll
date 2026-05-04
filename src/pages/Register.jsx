import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import CameraView from '../components/CameraView';
import { loadModels, detectFaces, toFloat32Array } from '../utils/faceUtils';
import { announceRegistration } from '../utils/speechUtils';
import { 
    getStudents, saveFaceDescriptor, getFaceDescriptors, removeFaceDescriptor,
    TEACHER_SUBJECTS, saveTeacherFaceDescriptor, getTeacherFaceDescriptors, removeTeacherFaceDescriptor 
} from '../utils/storage';

const TEACHERS = Object.keys(TEACHER_SUBJECTS);

export default function Register() {
    const navigate = useNavigate();
    const [registerMode, setRegisterMode] = useState('student');
    const [selectedPerson, setSelectedPerson] = useState('');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Select a person and face the camera');
    const [isFaceRegistered, setIsFaceRegistered] = useState(false);
    const cameraRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    useEffect(() => {
        loadModels().then(() => setLoading(false));
    }, []);

    const handleDraw = async (video, canvas) => {
        if (!video || !canvas) return;

        // Skip frames: Only scan every 100ms
        const nowMs = Date.now();
        if (nowMs - lastScanTimeRef.current < 100) return;
        lastScanTimeRef.current = nowMs;

        try {
            const detections = await detectFaces(video);
            if (!detections) return;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
        } catch (err) { }
    };

    const handleRegister = async () => {
        if (!selectedPerson) {
            alert(`Please select a ${registerMode} first.`);
            return;
        }
        const video = cameraRef.current?.videoElement;
        if (!video) return;

        setStatus("Scanning face...");
        
        // Multi-try logic for better success on mobile
        let detections = [];
        for (let i = 0; i < 3; i++) {
            detections = await detectFaces(video);
            if (detections && detections.length > 0) break;
            await new Promise(r => setTimeout(r, 500)); // wait 0.5s between retries
        }

        if (detections && detections.length > 0) {
            if (detections.length > 1) {
                setStatus("Multiple faces detected! Please ensure only one person is in frame.");
                return;
            }

            const descriptor = detections[0].descriptor;
            if (registerMode === 'student') {
                saveFaceDescriptor(selectedPerson, toFloat32Array(descriptor));
            } else {
                saveTeacherFaceDescriptor(selectedPerson, toFloat32Array(descriptor));
            }
            setIsFaceRegistered(true);
            setStatus("Face successfully registered!");
            announceRegistration(selectedPerson);
        } else {
            setStatus("No face detected! Move to bright light.");
        }
    };

    const studentData = getFaceDescriptors();
    const teacherData = getTeacherFaceDescriptors();

    const currentData = registerMode === 'student' ? studentData : teacherData;

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 px-4 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition border border-zinc-700">
                    <ArrowLeft className="w-6 h-6 text-zinc-300" />
                </button>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Register Face</h2>
                <div className="w-10"></div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-medium">Loading AI Models...</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col space-y-5">
                    <div className="flex bg-zinc-900 rounded-2xl p-1 shadow-lg border border-zinc-800/80">
                        <button 
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${registerMode === 'student' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                            onClick={() => {
                                setRegisterMode('student');
                                setSelectedPerson('');
                                setStatus('Select a student and face the camera');
                                setIsFaceRegistered(false);
                            }}
                        >
                            Student
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${registerMode === 'teacher' ? 'bg-indigo-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                            onClick={() => {
                                setRegisterMode('teacher');
                                setSelectedPerson('');
                                setStatus('Select a teacher and face the camera');
                                setIsFaceRegistered(false);
                            }}
                        >
                            Teacher
                        </button>
                    </div>

                    <div className="bg-zinc-900 rounded-3xl p-4 shadow-xl border border-zinc-800/80">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Select {registerMode === 'student' ? 'Student' : 'Teacher'}</label>
                        <select
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-4 px-4 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                            value={selectedPerson}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedPerson(val);
                                setIsFaceRegistered(!!currentData[val]);
                                setStatus(currentData[val] ? "Already registered! You can overwrite." : "Ready to scan.");
                            }}
                        >
                            <option value="">-- Choose Name --</option>
                            {registerMode === 'student' 
                                ? getStudents().map(s => <option key={s.id} value={s.id.toString()}>{s.id}. {s.name} {studentData[s.id] ? '(Registered)' : ''}</option>)
                                : TEACHERS.map(t => <option key={t} value={t}>{t} {teacherData[t] ? '(Registered)' : ''}</option>)
                            }
                        </select>
                    </div>

                    <div className="relative flex-1 bg-zinc-900 rounded-[2rem] p-2 border border-zinc-800/60 overflow-hidden shadow-2xl">
                        <CameraView ref={cameraRef} onDraw={handleDraw} />
                        <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/80 backdrop-blur-md px-4 py-3 rounded-2xl text-center shadow-lg border border-zinc-700">
                            <p className={`font-semibold text-sm ${isFaceRegistered ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                {status}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleRegister}
                            className="flex-1 relative overflow-hidden group bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold py-4 rounded-[2rem] shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                            disabled={!selectedPerson}
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>{isFaceRegistered ? 'Overwrite Face' : 'Capture & Register'}</span>
                        </button>

                        {isFaceRegistered && (
                            <button
                                onClick={() => {
                                    if (confirm(`Are you sure you want to delete face data for ${selectedPerson}?`)) {
                                        if (registerMode === 'student') {
                                            removeFaceDescriptor(selectedPerson);
                                        } else {
                                            removeTeacherFaceDescriptor(selectedPerson);
                                        }
                                        setIsFaceRegistered(false);
                                        setStatus("Face data deleted successfully.");
                                    }
                                }}
                                className="p-4 bg-zinc-800 border border-zinc-700 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-400 rounded-full transition-all"
                                title="Delete Face Data"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                    <div className="h-2"></div>
                </div>
            )}
        </div>
    );
}
