import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import GuestNavBar from '../components/GuestNavBar';
import ProgressBar from '../components/ProgressBar';
const GuestLayout = () => {
  const location = useLocation();

  const signupPages = [
    '/signup/credentials',
    '/signup/information',
    '/signup/verification',
    '/signup/completed',
  ];

  const isSignupPage = signupPages.includes(location.pathname);
  return (
    <div className="guest-layout">
      <GuestNavBar />
      <main>
        {isSignupPage && <ProgressBar />}
        <Outlet />
      </main>
    </div>
  );
};

export default GuestLayout;