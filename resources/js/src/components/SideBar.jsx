import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaCode, FaBars, FaUserCircle } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { motion } from 'framer-motion';
import styles from './SideBar.module.scss';

const Sidebar = () => {
  const { token, userRole, userName, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [dropdowns, setDropdowns] = useState({});
  const [userDropupOpen, setUserDropupOpen] = useState(false);
  const location = useLocation();

  const user = {
    name: userName || 'Guest',
    role: userRole || 'guest',
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
    setDropdowns({});
    setUserDropupOpen(false);
  };

  const toggleDropdown = (key) => {
    if (isOpen) {
      setDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
    } else {
      setIsOpen(true);
      setDropdowns({ [key]: true });
    }
  };

  const toggleUserDropup = () => {
    if (isOpen) {
      setUserDropupOpen((prev) => !prev);
    } else {
      setIsOpen(true);
      setUserDropupOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const sidebarItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <FaTachometerAlt /> },
    {
      label: 'User Management',
      icon: <FaUsers />,
      subItems: [
        { label: 'All Users', path: '/admin/users' },
        { label: 'Add User', path: '/admin/users/create' },
        { label: 'Progress Overview', path: '/admin/users/progress/:userId' },
        { label: 'Roles & Permissions', path: '/admin/users/roles' },
      ],
    },
    {
      label: 'Class Management',
      icon: <FaCode />,
      subItems: [
        { label: 'All Classes', path: '/admin/challenges' },
        { label: 'Create Class', path: '/admin/challenges/create' },
        { label: 'Student Assignment', path: '/admin/challenges/ai-bank' },
        { label: 'Class Performance Overview', path: '/admin/challenges/submissions' },
      ],
    },
    {
      label: 'Competition Management',
      icon: <FaCode />,
      subItems: [
        { label: 'All Competitions', path: '/admin/challenges' },
        { label: 'Create Competition', path: '/admin/challenges/create' },
        { label: 'Leaderboard Management', path: '/admin/challenges/ai-bank' },
        { label: 'Participant Management', path: '/admin/challenges/submissions' },
      ],
    },
    {
      label: 'Class Competition',
      icon: <FaCode />,
      subItems: [
        { label: 'All Class Competitions', path: '/admin/challenges' },
        { label: 'Create Class Competition', path: '/admin/challenges/create' },
        { label: 'Team Leaderboard', path: '/admin/challenges/ai-bank' },
        { label: 'Competition Analytics', path: '/admin/challenges/submissions' },
      ],
    },
    {
      label: 'Problem Bank',
      icon: <FaCode />,
      subItems: [
        { label: 'All Problems', path: '/admin/challenges' },
        { label: 'Add Problem', path: '/admin/challenges/create' },
        { label: 'AI Problem Bank', path: '/admin/challenges/ai-bank' },
        { label: 'Review Submissions', path: '/admin/challenges/submissions' },
      ],
    },
    {
      label: 'Matchmaking Configuration',
      icon: <FaCode />,
      subItems: [
        { label: 'Skill Assessment Rules', path: '/admin/challenges' },
        { label: 'Matchmaking Queue', path: '/admin/challenges/create' },
        { label: 'Match History', path: '/admin/challenges/ai-bank' },
        { label: 'Algorithm Settings', path: '/admin/challenges/submissions' },
      ],
    },
    {
      label: 'Progress Analytics',
      icon: <FaCode />,
      subItems: [
        { label: 'Student Performance Reports', path: '/admin/challenges' },
        { label: 'Cohort Analysis', path: '/admin/challenges/create' },
        { label: 'Feedback Automation', path: '/admin/challenges/ai-bank' },
        { label: 'Export Data', path: '/admin/challenges/submissions' },
      ],
    },
  ];

  const userDropupItems = [
    { label: 'Profile', path: '/admin/profile' },
    { label: 'Logout', path: '#', onClick: handleLogout },
  ];

  const sidebarVariants = {
    open: { width: '300px', transition: { duration: 0.3, ease: 'easeInOut' } },
    closed: { width: '60px', transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const isSubMenuActive = (subItems) => {
    return subItems.some((subItem) => location.pathname === subItem.path);
  };

  return (
    <motion.nav
      className={`${styles.sidebar} ${!isOpen ? styles.close : styles.open}`}
      initial="open"
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
    >
      <ul className={styles.sidebarList}>
        <li className={styles.toggleItem}>
          <button onClick={toggleSidebar} className={styles.toggleBtn}>
            <FaBars />
          </button>
        </li>
        {sidebarItems.map((item, index) => {
          const isActive =
            location.pathname === item.path || (item.subItems && isSubMenuActive(item.subItems));

          return (
            <li key={index} className={styles.sidebarItem}>
              {item.subItems ? (
                <>
                  <button
                    className={`${styles.dropdownBtn} ${dropdowns[item.label] ? styles.rotate : ''} ${isActive ? styles.active : ''}`}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                    <span className={styles.arrow}>
                      {dropdowns[item.label] ? <IoIosArrowDown /> : <IoIosArrowUp />}
                    </span>
                  </button>
                  <ul
                    className={`${styles.subMenu} ${dropdowns[item.label] && isOpen ? styles.show : ''}`}
                  >
                    {item.subItems.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <NavLink
                          to={subItem.path}
                          end
                          className={({ isActive }) =>
                            `${styles.subMenuLink} ${isActive ? styles.active : ''}`
                          }
                        >
                          {subItem.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.userSection}>
        <button
          className={`${styles.userBtn} ${userDropupOpen ? styles.active : ''}`}
          onClick={toggleUserDropup}
        >
          <span className={styles.userIcon}><FaUserCircle /></span>
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.role}</span>
            </div>
            <span className={styles.userArrow}>
              {userDropupOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </span>
          </div>
        </button>
        <ul
          className={`${styles.userDropup} ${userDropupOpen && isOpen ? styles.show : ''}`}
        >
          {userDropupItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={styles.dropupLink}
                onClick={item.onClick || (() => {})}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Sidebar;