// resources/js/src/components/Admin/AdminLayout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import styles from "./AdminLayout.module.scss";
import Topbar from "../components/AdminTopBar";
import Notification from "../components/ui/Notification";
export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (type, message, duration = 5000) => {
        const id = Date.now();
        setNotifications((prev) => [
            ...prev,
            { id, type, message, createdAt: Date.now(), duration },
        ]);
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return { notifications, addNotification, clearNotifications, setNotifications };
};

const AdminLayout = () => {
    const { notifications, addNotification, clearNotifications, setNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(true); // Sidebar visibility

    const toggleSidebar = () => {
        setIsOpen((prev) => !prev);
    };

    
    return (
        <div className={styles.adminLayout}>
            <div className={styles.layoutContainer}>
                <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
                <main className={styles.mainContent}>
                <Topbar />
                {notifications.map((notification, index) => (
                    <Notification
                        key={notification.id}
                        id={notification.id}
                        type={notification.type}
                        message={notification.message}
                        onClose={() =>
                            setNotifications((prev) =>
                                prev.filter((n) => n.id !== notification.id)
                            )
                        }
                        index={index}
                        position="top-right"
                        duration={notification.duration - (Date.now() - notification.createdAt)}
                    />
                ))}
                <Outlet context={{ addNotification, clearNotifications }} />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
