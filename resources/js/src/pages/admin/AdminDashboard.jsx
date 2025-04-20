import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { userRole, logout } = useAuth();

  return (
    <div>
    </div>
  );
};

export default AdminDashboard;
