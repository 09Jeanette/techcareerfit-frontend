import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Placeholder from './components/Placeholder';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <div>
      <TopNav />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route path="/cv" element={<ProtectedRoute><Placeholder name="CV" /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Placeholder name="Jobs" /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Placeholder name="Reports" /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Placeholder name="Applications" /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Placeholder name="Admin" /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}
