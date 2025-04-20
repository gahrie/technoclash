// src/RouteGuard.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const RouteGuard = ({ route }) => {
  const { token, userRole, loading } = useAuth();
  const { element, allowedRoles, isSignup } = route;
  const location = useLocation();
  const currentPath = location.pathname;

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Signup progress logic
  if (isSignup) {
    const signupEmail = localStorage.getItem('signup_email');
    const registrationProgress = localStorage.getItem('registration_progress') || '';
    const signupProgressMap = {
      '/signup/credentials': '',
      '/signup/information': 'credentials',
      '/signup/verification': 'information',
      '/signup/completed': 'completed',
    };
    const progressRedirectMap = {
      credentials: '/signup/information',
      information: '/signup/verification',
      completed: '/signup/completed',
    };

    if (currentPath === '/signup/credentials' && registrationProgress) {
      const redirectPath = progressRedirectMap[registrationProgress] || '/signup';
      return <Navigate to={redirectPath} replace />;
    }

    if (currentPath !== '/signup/credentials' && !signupEmail) {
      return <Navigate to="/signup/credentials" replace />;
    }

    const progressOrder = ['credentials', 'information', 'completed'];
    const requiredProgress = signupProgressMap[currentPath];
    const currentProgressIndex = progressOrder.indexOf(registrationProgress);
    const requiredProgressIndex = progressOrder.indexOf(requiredProgress);

    if (
      requiredProgress &&
      (currentProgressIndex < requiredProgressIndex ||
        currentProgressIndex > requiredProgressIndex)
    ) {
      return <Navigate to="/login" replace />;
    }
  }

  // Role-based access control (only if allowedRoles is defined)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard or home
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      case 'professor':
        return <Navigate to="/professor/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Return the element for Outlet
  return element;
};

export default RouteGuard;