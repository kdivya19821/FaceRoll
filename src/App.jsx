import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Attendance from './pages/Attendance';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Subjects from './pages/Subjects';
import { getCurrentTeacher } from './utils/storage';

const ProtectedRoute = ({ children }) => {
  return getCurrentTeacher() ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
        <main className="max-w-md mx-auto min-h-[100dvh] shadow-2xl bg-zinc-900 border-x border-zinc-800/50 flex flex-col relative overflow-x-hidden">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
