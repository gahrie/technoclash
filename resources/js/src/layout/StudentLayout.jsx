import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthTopBar from '../components/AuthTopBar';
const StudentLayout = () => {

  return (
    <div className="student-layout">
      <AuthTopBar />
      <div className="layout-container">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;