import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem('access_token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
