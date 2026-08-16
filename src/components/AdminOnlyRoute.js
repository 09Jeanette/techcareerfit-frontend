import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUserRole } from '../api/config';

export default function AdminOnlyRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const role = getStoredUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
