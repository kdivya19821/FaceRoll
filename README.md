# 🎓 FaceRoll - Smart AI Attendance System 🚀

**A secure, biometric attendance management system built for the modern classroom.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🌟 Overview
FaceRoll is a **Progressive Web Application (PWA)** that leverages **Artificial Intelligence** and **Computer Vision** to automate student attendance. By utilizing high-accuracy face recognition models, it eliminates manual signatures and provides teachers with a sophisticated analytics dashboard.

## ✨ Advanced Features
- 🗣️ **Voice Announcements**: Audible confirmation of attendance ("Done! Attendance marked for [Name]").
- 📊 **Graphical Analytics**: Visual Bar and Pie charts for attendance trends and performance.
- 📍 **GPS Geo-Tagging**: Capture precise location (Lat/Lng) for every attendance entry.
- ⏰ **Late Entry Detection**: Automatically mark students as "LATE" based on class start times.
- 👤 **Dynamic Student Management**: Add, delete, and search for students directly within the app.
- 📥 **CSV/Excel Export**: Download complete attendance reports with one click.
- 🛡️ **Biometric Teacher Login**: Secure portal access using face recognition.
- 📸 **AI Scanning**: Real-time face detection with on-screen diagnostic labels.
- 📱 **PWA Ready**: Installable on Android and iOS with offline support.
- 🎨 **Modern UI**: Glassmorphism aesthetic with a professional dark mode theme.

## 🛠️ Technology Stack
- **Library**: `React.js` (Frontend)
- **Engine**: `Face-api.js` (TensorFlow.js based identification)
- **Visuals**: `Recharts` (Data Visualization)
- **Icons**: `Lucide-react`
- **Styling**: TailwindCSS
- **Deployment**: Vercel

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

## 🧠 How it Works
The system captures a video frame, extracts a **128-dimensional vector embedding** of the face, and compares it against stored descriptors using **Euclidean Distance**. Attendance is marked when the distance is below the **0.70 threshold**.

---
**BCA Final Year Project**
Developed with ❤️ for Academic Excellence.
🏆 *Featured Advanced Features: Voice, Location, Graphs, and Late detection.*
