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
import ProblemList from './pages/admin/ProblemList';
import CreateProblem from './pages/admin/CreateProblem';
import UpdateProblem from './pages/admin/UpdateProblem';

// Student Pages
import StudentChallengeDetail from './pages/client/StudentChallengeDetail';
import StudentProblemList from './pages/client/StudentProblemList';
import CompetitiveList from './pages/client/CompetitiveList';
import Room from './pages/client/Room';
import CompetitiveMatch from './pages/client/CompetitiveMatch';

import { UserListProvider } from "./context/UserListContext"; // Adjust path
import { ProblemListProvider } from "./context/ProblemListContext"; // Adjust path


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
    allowedRoles: ['Guest'],
    children : [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
    ],
  },
  // Signup Routes
  {
    element: <GuestLayout />,
    allowedRoles: ['Guest'],
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
    allowedRoles: ['Admin'],
    children: [
      { path: '/admin/dashboard', element: <AdminDashboard /> },
      { path: '/admin/users', element: <UserListProvider><UserList /></UserListProvider> },
      { path: '/admin/users/create', element: <CreateUser /> },
      { path: '/admin/users/:id/edit', element: <UpdateUser /> },
      { path: '/admin/problems', element: <ProblemListProvider><ProblemList /></ProblemListProvider> },
      { path: '/admin/problems/create', element: <CreateProblem /> },
      { path: '/admin/problems/:id/edit', element: <UpdateProblem /> },
    ],
  },
  // Student Routes
  {
    element: <StudentLayout />,
    allowedRoles: ['Student'],
    children: [
      { path: '/dashboard', element: <div>Student Dashboard</div> },
      { path: '/progressive', element: <StudentProblemList /> },
      { path: '/progressive/:id', element: <StudentChallengeDetail /> },
      { path: '/competitive', element: <CompetitiveList /> },
      { path: '/competitive/room/:roomId', element: <Room /> },
      { path: '/competitive/match/:roomId', element: <CompetitiveMatch /> },
    ],
  },
  // Professor Routes
  {
    element: <ProfessorLayout />,
    allowedRoles: ['Professor'],
    children: [
      { path: '/professor/dashboard', element: <div>Professor Dashboard</div> },
    ],
  },
];