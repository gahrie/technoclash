import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink, useLocation } from "react-router-dom";
import {
    FaTachometerAlt,
    FaUsers,
    FaCode,
    FaBars,
    FaUserCircle,
} from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import Cookies from "js-cookie";
import styles from "./SideBar.module.scss";

const Sidebar = () => {
    // Initialize state from cookies
    const [isOpen, setIsOpen] = useState(() => {
        const savedIsOpen = Cookies.get("sidebarIsOpen");
        return savedIsOpen !== undefined ? JSON.parse(savedIsOpen) : true;
    });
    const [dropdowns, setDropdowns] = useState(() => {
        const savedDropdowns = Cookies.get("sidebarDropdowns");
        return savedDropdowns ? JSON.parse(savedDropdowns) : {};
    });

    const location = useLocation();

    // Save state to cookies
    useEffect(() => {
        Cookies.set("sidebarIsOpen", JSON.stringify(isOpen), { expires: 7 });
    }, [isOpen]);

    useEffect(() => {
        Cookies.set("sidebarDropdowns", JSON.stringify(dropdowns), {
            expires: 7,
        });
    }, [dropdowns]);

    const toggleSidebar = () => {
        setIsOpen((prev) => !prev);
        setDropdowns({});
    };

    const toggleDropdown = (key) => {
        if (isOpen) {
            setDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
        } else {
            setIsOpen(true);
            setDropdowns({ [key]: true });
        }
    };

    const sidebarItems = [
        {
            label: "Dashboard",
            path: "/admin/dashboard",
            icon: <FaTachometerAlt />,
        },
        {
            label: "User Management",
            path: "/admin/users",
            icon: <FaUsers />,
        },
        {
            label: "Problem Bank",
            path: "/admin/problems",
            icon: <FaCode />,
        },
        // {
        //     label: "Class Management",
        //     icon: <FaCode />,
        //     subItems: [
        //         { label: "All Classes", path: "/admin/challenges" },
        //         { label: "Create Class", path: "/admin/challenges/create" },
        //         {
        //             label: "Student Assignment",
        //             path: "/admin/challenges/ai-bank",
        //         },
        //         {
        //             label: "Class Performance Overview",
        //             path: "/admin/challenges/submissions",
        //         },
        //     ],
        // },
        // {
        //     label: "Competition Management",
        //     icon: <FaCode />,
        //     subItems: [
        //         { label: "All Competitions", path: "/admin/challenges" },
        //         {
        //             label: "Create Competition",
        //             path: "/admin/challenges/create",
        //         },
        //         {
        //             label: "Leaderboard Management",
        //             path: "/admin/challenges/ai-bank",
        //         },
        //         {
        //             label: "Participant Management",
        //             path: "/admin/challenges/submissions",
        //         },
        //     ],
        // },
        // {
        //     label: "Class Competition",
        //     icon: <FaCode />,
        //     subItems: [
        //         { label: "All Class Competitions", path: "/admin/challenges" },
        //         {
        //             label: "Create Class Competition",
        //             path: "/admin/challenges/create",
        //         },
        //         {
        //             label: "Team Leaderboard",
        //             path: "/admin/challenges/ai-bank",
        //         },
        //         {
        //             label: "Competition Analytics",
        //             path: "/admin/challenges/submissions",
        //         },
        //     ],
        // },
        // {
        //     label: "Matchmaking Configuration",
        //     icon: <FaCode />,
        //     subItems: [
        //         { label: "Skill Assessment Rules", path: "/admin/challenges" },
        //         {
        //             label: "Matchmaking Queue",
        //             path: "/admin/challenges/create",
        //         },
        //         { label: "Match History", path: "/admin/challenges/ai-bank" },
        //         {
        //             label: "Algorithm Settings",
        //             path: "/admin/challenges/submissions",
        //         },
        //     ],
        // },
        // {
        //     label: "Progress Analytics",
        //     icon: <FaCode />,
        //     subItems: [
        //         {
        //             label: "Student Performance Reports",
        //             path: "/admin/challenges",
        //         },
        //         { label: "Cohort Analysis", path: "/admin/challenges/create" },
        //         {
        //             label: "Feedback Automation",
        //             path: "/admin/challenges/ai-bank",
        //         },
        //         { label: "Export Data", path: "/admin/challenges/submissions" },
        //     ],
        // },
    ];

    const isSubMenuActive = (subItems) => {
        return subItems.some((subItem) => location.pathname === subItem.path);
    };

    return (
        <nav
            className={`${styles.sidebar} ${
                !isOpen ? styles.close : styles.open
            }`}
        >
            <ul className={styles.sidebarList}>
                <li className={styles.toggleItem}>
                    <button
                        onClick={toggleSidebar}
                        className={styles.toggleBtn}
                    >
                        <FaBars />
                    </button>
                </li>
                {sidebarItems.map((item, index) => {
                    const isActive =
                        location.pathname === item.path ||
                        (item.subItems && isSubMenuActive(item.subItems));

                    return (
                        <li key={index} className={styles.sidebarItem}>
                            {item.subItems ? (
                                <>
                                    <button
                                        className={`${styles.dropdownBtn} ${
                                            dropdowns[item.label]
                                                ? styles.rotate
                                                : ""
                                        } ${isActive ? styles.active : ""}`}
                                        onClick={() =>
                                            toggleDropdown(item.label)
                                        }
                                    >
                                        <span className={styles.icon}>
                                            {item.icon}
                                        </span>
                                        <span className={styles.label}>
                                            {item.label}
                                        </span>
                                        <span className={styles.arrow}>
                                            {dropdowns[item.label] ? (
                                                <IoIosArrowDown />
                                            ) : (
                                                <IoIosArrowUp />
                                            )}
                                        </span>
                                    </button>
                                    <ul
                                        className={`${styles.subMenu} ${
                                            dropdowns[item.label] && isOpen
                                                ? styles.show
                                                : ""
                                        }`}
                                    >
                                        {item.subItems.map(
                                            (subItem, subIndex) => (
                                                <li key={subIndex}>
                                                    <NavLink
                                                        to={subItem.path}
                                                        end
                                                        className={({
                                                            isActive,
                                                        }) =>
                                                            `${
                                                                styles.subMenuLink
                                                            } ${
                                                                isActive
                                                                    ? styles.active
                                                                    : ""
                                                            }`
                                                        }
                                                    >
                                                        {subItem.label}
                                                    </NavLink>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    end
                                    className={({ isActive }) =>
                                        `${styles.sidebarLink} ${
                                            isActive ? styles.active : ""
                                        }`
                                    }
                                >
                                    <span className={styles.icon}>
                                        {item.icon}
                                    </span>
                                    <span className={styles.label}>
                                        {item.label}
                                    </span>
                                </NavLink>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Sidebar;
