import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    FaUserCircle,
    FaBell,
    FaEnvelope,
    FaAngleDown,
    FaAngleUp,
    FaSun,
    FaMoon,
} from "react-icons/fa";
import Cookies from "js-cookie";
import styles from "./AdminTopbar.module.scss";

const AdminTopBar = () => {
    const { userRole, userName, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState("");
    const [theme, setTheme] = useState(Cookies.get("theme") || "light");
    const navigate = useNavigate();

    const user = {
        name: userName || "Guest",
        role: userRole || "guest",
    };

    // Apply theme class to body
    useEffect(() => {
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        Cookies.set("theme", theme, { expires: 365 });
    }, [theme]);

    // Update time every second in Manila time zone
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: "Asia/Manila",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
            const formattedTime = formatter.format(now).replace(",", "");
            setCurrentTime(formattedTime);
        };

        updateTime(); // Initial call
        const timer = setInterval(updateTime, 1000); // Update every second

        return () => clearInterval(timer); // Cleanup on unmount
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleProfileClick = () => {
        setIsDropdownOpen(false);
        navigate("/profile");
    };

    const handleLogout = () => {
        logout();
    };

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.dateTime}>
                <span>{currentTime}</span>
            </div>

            <nav className={styles.nav}>
                <ul>
                    <li>
                        <FaBell className={styles.icon} />
                    </li>
                    <li onClick={toggleTheme}>
                        {theme === "light" ? (
                            <FaMoon className={styles.icon} />
                        ) : (
                            <FaSun className={styles.icon} />
                        )}
                    </li>
                    <li>
                        <FaEnvelope className={styles.icon} />
                    </li>
                </ul>
            </nav>

            <div className={styles.user}>
                <div className={styles.userInfo} onClick={toggleDropdown}>
                    <FaUserCircle className={styles.avatar} />
                    <div className={styles.userDetails}>
                        <span className={styles.name}>{user.name}</span>
                        <span className={styles.role}>{user.role}</span>
                    </div>
                    {isDropdownOpen ? (
                        <FaAngleUp className={styles.arrow} />
                    ) : (
                        <FaAngleDown className={styles.arrow} />
                    )}
                </div>

                {isDropdownOpen && (
                    <div className={styles.dropdown}>
                        <ul>
                            <li onClick={handleProfileClick}>Profile</li>
                            <li onClick={handleLogout}>Logout</li>
                        </ul>
                    </div>
                )}
            </div>
        </header>
    );
};

export default AdminTopBar;
