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
    FaArrowUp,
    FaTrophy,
    FaLock,
} from "react-icons/fa";
import { MdStackedLineChart } from "react-icons/md";
import { CiPlay1 } from "react-icons/ci";
import Cookies from "js-cookie";
import styles from "./AuthTopBar.module.scss";

const AuthTopBar = () => {
    const { userRole, userName, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPlayDropdownOpen, setIsPlayDropdownOpen] = useState(false);
    const [theme, setTheme] = useState(Cookies.get("theme") || "light");
    const navigate = useNavigate();

    const user = {
        name: userName || "Guest",
        role: userRole || "client",
    };

    // Apply theme class to body
    useEffect(() => {
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        Cookies.set("theme", theme, { expires: 365 });
    }, [theme]);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const togglePlayDropdown = () => {
        setIsPlayDropdownOpen(!isPlayDropdownOpen);
    };

    const handleProfileClick = () => {
        setIsDropdownOpen(false);
        navigate("/client/profile");
    };

    const handleLogout = () => {
        logout();
    };

    const toggleTheme = (event) => {
        event.stopPropagation(); // Prevent click from bubbling to userInfo
        setTheme(theme === "light" ? "dark" : "light");
    };

    const handlePlayOptionClick = (path) => {
        setIsPlayDropdownOpen(false);
        if (path) {
            navigate(path);
        }
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.logo}>
                <span>TechnoMatch</span>
            </div>

            <div className={styles.centerContainer}>
                <nav className={styles.nav}>
                    <ul>
                        <li onClick={() => navigate("/classes")}>Classes</li>
                        <li
                            className={styles.playItem}
                            onClick={togglePlayDropdown}
                        >
                            <CiPlay1 className={styles.playIcon} />
                            Play
                            {isPlayDropdownOpen ? (
                                <FaAngleUp className={styles.playIcon} />
                            ) : (
                                <FaAngleDown className={styles.playIcon} />
                            )}
                            {isPlayDropdownOpen && (
                                <div className={styles.playDropdown}>
                                    <ul>
                                        <p className={styles.playDropdownTitle}>
                                            Select Game Mode
                                        </p>
                                        <li
                                            onClick={() =>
                                                handlePlayOptionClick(
                                                    "/progressive"
                                                )
                                            }
                                        >
                                            <MdStackedLineChart
                                                className={styles.dropdownIcon}
                                            />
                                            <div
                                                className={
                                                    styles.playDropdownItem
                                                }
                                            >
                                                <p>Progressive</p>
                                                <span>
                                                    Hone your skills through
                                                    practice
                                                </span>
                                            </div>
                                        </li>
                                        <li
                                            onClick={() =>
                                                handlePlayOptionClick(
                                                    "/competitive"
                                                )
                                            }
                                        >
                                            <FaTrophy
                                                className={styles.dropdownIcon}
                                            />
                                            <div
                                                className={
                                                    styles.playDropdownItem
                                                }
                                            >
                                                <p>Competitive</p>
                                                <span>
                                                    Compete against others for
                                                    glory
                                                </span>
                                            </div>
                                        </li>
                                        <li className={styles.disabled}>
                                            <FaLock
                                                className={styles.dropdownIcon}
                                            />
                                            <div
                                                className={
                                                    styles.playDropdownItem
                                                }
                                            >
                                                <p>Contest (Coming Soon)</p>
                                                <span>
                                                    Scheduled competitive events
                                                </span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </li>
                        <li onClick={() => navigate("/client/leaderboard")}>
                            Leaderboard
                        </li>
                    </ul>
                </nav>
            </div>

            <div className={styles.user}>
                <div className={styles.userInfo}>
                    <ul className={styles.userIcons}>
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
                    </ul>
                    <FaUserCircle className={styles.avatar} />
                    <div
                        className={styles.userDetails}
                        onClick={toggleDropdown}
                    >
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

export default AuthTopBar;
