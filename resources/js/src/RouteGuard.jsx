// src/RouteGuard.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const RouteGuard = ({ route }) => {
  const { userRole, loading } = useAuth();
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
      '/signup/credentials': 'Credentials',
      '/signup/information': 'Information',
      '/signup/verification': 'Verification',
    };
    const progressRedirectMap = {
      Credentials: '/signup/credentials',
      Information: '/signup/information',
      Verification: '/signup/verification',
    };

    if (currentPath === '/signup/credentials' && registrationProgress) {
      const redirectPath = progressRedirectMap[registrationProgress] || '/signup';
      return <Navigate to={redirectPath} replace />;
    }

    if (currentPath !== '/signup/credentials' && !signupEmail) {
      return <Navigate to="/signup/credentials" replace />;
    }

    const progressOrder = ['Credentials', 'Information', 'Verification'];
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
  console.log(userRole);
  console.log(allowedRoles);
  console.log(currentPath);

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard or home
    switch (userRole) {
      case 'Admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'Student':
        return <Navigate to="/progressive" replace />;
      case 'Professor':
        return <Navigate to="/professor/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Return the element for Outlet
  return element;
};

export default RouteGuard;