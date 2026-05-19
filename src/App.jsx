import React from 'react';
import Timetable from './pages/Timetable';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Attendance from './pages/Attendance';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Subjects from './pages/Subjects';
import Students from './pages/Students';
import ManualAttendance from './pages/ManualAttendance';
import LeaveRequests from './pages/LeaveRequests';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import DatabaseViewer from './pages/DatabaseViewer';
import Teachers from './pages/Teachers';
import Background from './components/Background';
import { getCurrentTeacher, getCurrentStudent } from './utils/storage';

const ProtectedRoute = ({ children }) => {
  return getCurrentTeacher() ? children : <Navigate to="/login" replace />;
};

const StudentProtectedRoute = ({ children }) => {
  return getCurrentStudent() ? children : <Navigate to="/student-login" replace />;
};

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const fullScreenPaths = ['/student-dashboard', '/database'];
  
  if (fullScreenPaths.includes(location.pathname)) {
    return <main className="w-full min-h-[100dvh] flex flex-col relative overflow-x-hidden">{children}</main>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4">
      <main className="w-full max-w-md glass-dark border border-white/10 rounded-[40px] flex flex-col relative overflow-visible shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)]">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen text-white font-sans selection:bg-indigo-500/30">
        <Background />
        <LayoutWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student-dashboard" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/manual-attendance" element={<ProtectedRoute><ManualAttendance /></ProtectedRoute>} />
            <Route path="/leaves" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
            <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
            <Route path="/database" element={<DatabaseViewer />} />
          </Routes>
        </LayoutWrapper>
      </div>
    </Router>
  );
}

export default App;
