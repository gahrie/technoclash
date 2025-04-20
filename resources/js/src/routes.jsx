// src/routes.jsx
import React from 'react';

// Layouts
import GuestLayout from './layout/GuestLayout';
import AdminLayout from './layout/AdminLayout';
import StudentLayout from './layout/StudentLayout';
import ProfessorLayout from './layout/ProfessorLayout';
import NoLayout from './layout/NoLayout';

// Guest Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import SignUpCredentials from './pages/auth/SignUpCredentials';
import SignUpInformation from './pages/auth/SignUpInformation';
import SignUpVerifyEmail from './pages/auth/SignUpVerifyEmail';
import SignUpCompleted from './pages/auth/SignUpCompleted';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserList from './pages/admin/UserList';
import CreateUser from './pages/admin/CreateUser';
import UpdateUser from './pages/admin/UpdateUser';
import ChallengeList from './pages/admin/ChallengeList';
import ViewChallenge from './pages/admin/ViewChallenge';
import CreateChallenge from './pages/admin/CreateChallenge';
import UpdateChallenge from './pages/admin/UpdateChallenge';

// Student Pages
import StudentChallengeList from './pages/client/StudentChallengeList';
import StudentChallengeDetail from './pages/client/StudentChallengeDetail';

// Route configurations
export const routes = [
  // Guest Routes
  {
    element: <NoLayout />,
    children: [
      { path: '*', element: <NotFound /> },
    ],
  },

  {
    element: <GuestLayout />,
    allowedRoles: ['guest'],
    children : [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login />, allowedRoles: ['guest'] },
    ],
  },
  // Signup Routes
  {
    element: <GuestLayout />,
    allowedRoles: ['guest'],
    children: [
      { path: '/signup/credentials', element: <SignUpCredentials />, isSignup: true },
      { path: '/signup/information', element: <SignUpInformation />, isSignup: true },
      { path: '/signup/verification', element: <SignUpVerifyEmail />, isSignup: true },
      { path: '/signup/completed', element: <SignUpCompleted />, isSignup: true },
    ],
  },
  // Admin Routes
  {
    element: <AdminLayout />,
    allowedRoles: ['admin'],
    children: [
      { path: '/admin/dashboard', element: <AdminDashboard /> },
      { path: '/admin/users', element: <UserList /> },
      { path: '/admin/users/create', element: <CreateUser /> },
      { path: '/admin/users/:id/edit', element: <UpdateUser /> },
      { path: '/admin/challenges', element: <ChallengeList /> },
      { path: '/admin/challenges/:id', element: <ViewChallenge /> },
      { path: '/admin/challenges/create', element: <CreateChallenge /> },
      { path: '/admin/challenges/:id/edit', element: <UpdateChallenge /> },
    ],
  },
  // Student Routes
  {
    element: <StudentLayout />,
    allowedRoles: ['student'],
    children: [
      { path: '/student/dashboard', element: <div>Student Dashboard</div> },
      { path: '/student/challenges', element: <StudentChallengeList /> },
      { path: '/student/challenges/:id', element: <StudentChallengeDetail /> },
    ],
  },
  // Professor Routes
  {
    element: <ProfessorLayout />,
    allowedRoles: ['professor'],
    children: [
      { path: '/professor/dashboard', element: <div>Professor Dashboard</div> },
    ],
  },
];