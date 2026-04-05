import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

let isLoaded = false;

export async function loadModels() {
    if (isLoaded) return;
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        isLoaded = true;
    } catch (error) {
        console.error('Failed to load models', error);
    }
}

export async function detectFaces(videoElement) {
    if (!isLoaded) return null;
    
    // First try: SSD Mobilenet (High accuracy, heavy)
    let detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

    // Second try: TinyFaceDetector (Fast, light, great for mobile)
    if (!detections || detections.length === 0) {
        detections = await faceapi
            .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
            .withFaceLandmarks()
            .withFaceDescriptors();
    }

    return detections;
}

// Converts the object containing {0: val, 1: val ...} to Float32Array. LocalStorage turns typed arrays into normal obj format.
export function toFloat32Array(obj) {
    if (!obj) return null;
    if (obj instanceof Float32Array) return obj;
    return new Float32Array(Object.values(obj));
}
