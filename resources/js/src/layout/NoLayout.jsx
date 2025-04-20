import React from 'react';
import { Outlet } from 'react-router-dom';

const NoLayout = () => {
  return (
    <div className="no-layout">
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default NoLayout;