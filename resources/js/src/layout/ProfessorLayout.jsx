import React from 'react';
import { Outlet } from 'react-router-dom';

const ProfessorLayout = () => {
  const professorLinks = [
  ];

  return (
    <div className="professor-layout">
      <Navbar links={professorLinks} />
      <div className="layout-container">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProfessorLayout;