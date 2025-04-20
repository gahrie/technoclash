// resources/js/src/components/Admin/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/SideBar';
import styles from './AdminLayout.module.scss';

const AdminLayout = () => {
  const [isOpen, setIsOpen] = useState(true); // Sidebar visibility

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  const adminLinks = []; // Placeholder for Navbar

  return (
    <div className={styles.adminLayout}>
      <div className={styles.layoutContainer}>
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;