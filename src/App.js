import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Placeholder from './components/Placeholder';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import AdminOnlyRoute from './components/AdminOnlyRoute';

export default function App() {
  return (
    <div>
      <TopNav />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />
          <Route path="/cv" element={<ProtectedRoute><Placeholder name="CV" /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Placeholder name="Jobs" /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Placeholder name="Reports" /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Placeholder name="Applications" /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}
