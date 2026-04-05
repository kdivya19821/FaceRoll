import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';

const CameraView = forwardRef(({ onDraw, overlaySize = { width: 320, height: 400 } }, ref) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useImperativeHandle(ref, () => ({
        get videoElement() {
            return webcamRef.current?.video;
        },
        get canvasElement() {
            return canvasRef.current;
        }
    }));

    const handleVideoLoad = () => {
        setIsReady(true);
    };

    useEffect(() => {
        let animationFrame;
        const loop = () => {
            if (isReady && webcamRef.current?.video && canvasRef.current) {
                onDraw(webcamRef.current.video, canvasRef.current);
            }
            animationFrame = requestAnimationFrame(loop);
        };

        if (isReady) loop();
        return () => cancelAnimationFrame(animationFrame);
    }, [isReady, onDraw]);

    return (
        <div className="relative w-full flex items-center justify-center bg-black overflow-hidden rounded-3xl shadow-xl border border-zinc-800">
            <Webcam
                ref={webcamRef}
                audio={false}
                videoConstraints={{ facingMode: "user" }}
                onUserMedia={handleVideoLoad}
                className="w-full h-full object-cover"
                style={{
                    width: '100%',
                    maxWidth: `${overlaySize.width}px`
                }}
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
            />
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
            )}
        </div>
    );
});

export default CameraView;
