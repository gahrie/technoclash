import React, { useState, useEffect } from "react";
import styles from "./Notification.module.scss";

const Notification = ({
    id,
    type = "info",
    message,
    onClose,
    position = "top-right",
    index = 0,
    duration = 3000,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    useEffect(() => {
        if (!isVisible) {
            const animationTimer = setTimeout(() => {
                onClose();
            }, 300); // Match CSS transition duration
            return () => clearTimeout(animationTimer);
        }
    }, [isVisible, onClose]);

    const handleClose = () => {
        setIsVisible(false);
    };

    const typeStyles = {
        success: styles.success,
        error: styles.error,
        warning: styles.warning,
        info: styles.info,
    };

    const positionStyles = {
        "top-left": {
            top: `${20 + index * 80}px`,
            left: "20px",
            right: "auto",
        },
        "top-right": {
            top: `${20 + index * 80}px`,
            right: "20px",
            left: "auto",
        },
        center: {
            top: `${20 + index * 80}px`,
            left: "50%",
            transform: "translateX(-50%)",
            right: "auto",
        },
    };

    return (
        <div
            className={`${styles.notification} ${typeStyles[type] || styles.info} ${
                isVisible ? styles["notification-enter"] : styles["notification-exit"]
            }`}
            style={positionStyles[position] || positionStyles["top-right"]}
            role="alert"
            aria-live="polite"
        >
            <div className={styles["notification-content"]}>
                <span className={styles["notification-title"]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <span className={styles["notification-message"]}>{message}</span>
            </div>
            <button
                className={styles["notification-close"]}
                onClick={handleClose}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
};

export default Notification;