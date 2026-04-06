import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import { ArrowLeft, CheckCircle2, ScanFace } from 'lucide-react';
import CameraView from '../components/CameraView';
import { loadModels, detectFaces, toFloat32Array } from '../utils/faceUtils';
import { getStudents, getPeriods, saveLog, getFaceDescriptors, getCurrentTeacher, checkLateStatus } from '../utils/storage';
import { announceAttendance, speak } from '../utils/speechUtils';
import { Volume2, VolumeX, MapPin, Clock3 } from 'lucide-react';

export default function Attendance() {
    const navigate = useNavigate();
    const PERIODS = getPeriods();
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [loading, setLoading] = useState(true);
    const [registeredCount, setRegisteredCount] = useState(0);
    const [status, setStatus] = useState('Select period to start scanning');
    const [successData, setSuccessData] = useState(null);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isLocating, setIsLocating] = useState(false);

    const cameraRef = useRef(null);
    const faceMatcherRef = useRef(null);
    const scanningCooldownRef = useRef(false);

    useEffect(() => {
        async function init() {
            await loadModels();
            const faces = getFaceDescriptors();

            const labeledDescriptors = [];
            for (const [studentId, descriptorObj] of Object.entries(faces)) {
                const float32Array = toFloat32Array(descriptorObj);
                if (float32Array) {
                    labeledDescriptors.push(
                        new faceapi.LabeledFaceDescriptors(studentId.toString(), [float32Array])
                    );
                }
            }

            if (labeledDescriptors.length > 0) {
                faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.70);
                setRegisteredCount(labeledDescriptors.length);
            } else {
                setRegisteredCount(0);
                setStatus("No students registered! Please register first.");
            }
            setLoading(false);
        }
        init();
    }, []);

    const handleDraw = async (video, canvas) => {
        if (!video || !canvas || !selectedPeriod || scanningCooldownRef.current || !faceMatcherRef.current) return;

        try {
            const detections = await detectFaces(video);
            if (!detections || detections.length === 0) return;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Log for debugging
            const bestMatch = faceMatcherRef.current.findBestMatch(detections[0].descriptor);
            
            // Draw result on box
            const box = resizedDetections[0].detection.box;
            const drawLabel = new faceapi.draw.DrawTextField(
                [`${bestMatch.label} (${Math.round((1 - bestMatch.distance) * 100)}%)`],
                box.bottomLeft
            );
            faceapi.draw.drawDetections(canvas, resizedDetections);
            drawLabel.draw(canvas);

            if (bestMatch.label !== 'unknown') {
                const student = getStudents().find(s => s.id.toString() === bestMatch.label);
                if (student) {
                    scanningCooldownRef.current = true;

                    const isLate = checkLateStatus(selectedPeriod);
                    
                    // Capture Location
                    let location = null;
                    if ('geolocation' in navigator) {
                        try {
                            const position = await new Promise((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                            });
                            location = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                        } catch (err) {
                            console.warn("Location capture failed", err);
                        }
                    }

                    const logData = {
                        studentName: student.name,
                        studentId: student.id,
                        period: selectedPeriod,
                        teacher: getCurrentTeacher(),
                        fullDate: new Date().toDateString(),
                        time,
                        day,
                        isLate,
                        location
                    };

                    saveLog(logData);
                    setSuccessData(logData);
                    
                    if (voiceEnabled) {
                        announceAttendance(student.name, isLate);
                    }

                    setStatus(isLate ? `Late Entry: ${student.name}` : `Success: ${student.name} matched!`);

                    setTimeout(() => {
                        setSuccessData(null);
                        setStatus("Scanning...");
                        scanningCooldownRef.current = false;
                    }, 4000);
                }
            } else {
                setStatus(`Detected: Unknown (Match: ${Math.round((1 - bestMatch.distance) * 100)}%)`);
            }
        } catch (err) { 
            setStatus("Scanner Error: " + err.message);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-zinc-950 px-4 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate('/')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition border border-zinc-700">
                    <ArrowLeft className="w-6 h-6 text-zinc-300" />
                </button>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Attendance Scan</h2>
                <button 
                    onClick={() => {
                        setVoiceEnabled(!voiceEnabled);
                        if (!voiceEnabled) speak("Voice enabled");
                    }}
                    className={`p-2 rounded-full transition border ${voiceEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                >
                    {voiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-4 mb-6 shadow-xl border border-zinc-800/80">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Select Period</label>
                <select
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-4 px-4 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                    value={selectedPeriod}
                    onChange={(e) => {
                        setSelectedPeriod(e.target.value);
                        if (e.target.value && faceMatcherRef.current) setStatus("Scanning...");
                    }}
                >
                    <option value="">-- Choose Period --</option>
                    {PERIODS.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-medium">Loading AI Models...</p>
                </div>
            ) : (
                <div className="relative flex-1 bg-zinc-900 rounded-[2rem] p-2 border border-zinc-800/60 overflow-hidden shadow-2xl">
                    <CameraView ref={cameraRef} onDraw={handleDraw} />

                    {successData && (
                        <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in duration-300 z-20">
                            <div className="bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-emerald-500/30 text-center w-11/12">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-1">{successData.studentName}</h3>
                                <p className="text-zinc-400 font-medium mb-4">ID: #{successData.studentId}</p>
                                <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-zinc-300"><span className="text-emerald-400 font-bold">Class:</span> {successData.period}</p>
                                        {successData.isLate && (
                                            <span className="flex items-center space-x-1 bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                                                <Clock3 className="w-3 h-3" />
                                                <span>LATE</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-300"><span className="text-emerald-400 font-bold">Time:</span> {successData.time}</p>
                                    <div className="flex items-center justify-between text-sm text-zinc-300">
                                        <p><span className="text-emerald-400 font-bold">Day:</span> {successData.day}</p>
                                        {successData.location && (
                                            <span className="flex items-center space-x-1 text-zinc-500 text-[9px]">
                                                <MapPin className="w-3 h-3 text-emerald-500" />
                                                <span>Location Captured</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/80 backdrop-blur-md px-4 py-4 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-lg border border-zinc-700">
                        <div className="flex items-center space-x-3 w-full justify-center">
                            <ScanFace className={`w-5 h-5 ${selectedPeriod && faceMatcherRef.current ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                            <p className={`font-medium text-sm ${successData ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                {status}
                            </p>
                        </div>
                        <div className="h-px w-full bg-zinc-800/50 my-1"></div>
                        <p className={`text-[10px] font-bold tracking-widest uppercase ${registeredCount > 0 ? 'text-zinc-500' : 'text-rose-500 animate-pulse'}`}>
                             • Students in System: {registeredCount}
                             {registeredCount === 0 && " (Register Again!)"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
