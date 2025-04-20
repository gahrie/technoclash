import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userName, setUserName] = useState(localStorage.getItem('name') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'guest');
  const [loading, setLoading] = useState(true); // Initial auth check

  useEffect(() => {
    if (token) {
      fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data) => {
          setUserRole(data.data.role); 
          setUserName(data.data.profile.first_name + ' ' + data.data.profile.last_name);
          localStorage.setItem('name', data.data.profile.first_name + ' ' + data.data.profile.last_name);
          localStorage.setItem('role', data.data.role);
        })
        .catch(() => {
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, name, role) => {
    setToken(newToken);
    setUserName(name);
    setUserRole(role);
    localStorage.setItem('name', name);
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', role);
  };

  const handleLogout = () => {
    fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => {
      setToken(null);
      setUserName('');
      setUserRole('guest');
      localStorage.removeItem('name');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    });
  };

  return (
    <AuthContext.Provider
      value={{ token, userName, userRole, login, logout: handleLogout, loading }}
    >
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);