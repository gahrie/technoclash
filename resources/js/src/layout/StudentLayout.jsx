import React from 'react';
import { Outlet } from 'react-router-dom';

const StudentLayout = () => {

  return (
    <div className="student-layout">
      <div className="layout-container">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;