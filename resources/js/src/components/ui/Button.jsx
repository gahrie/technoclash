import React from "react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import styles from "./Button.module.scss";

const Button = ({
    children,
    to,
    variant = "primary",
    className = "",
    loading = false,
    disabled = false,
    ...props
}) => {
    const classNames = clsx(
        styles["ui-button"],
        styles[`ui-button--${variant}`],
        className
    );

    const content = (
        <>
            {loading && <span className={styles.spinner}></span>}
            <span className={loading ? styles["button-content-hidden"] : ""}>
                {children}
            </span>
        </>
    );

    if (to) {
        return (
            <Link to={to} className={classNames} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button
            className={classNames}
            disabled={disabled || loading}
            {...props}
        >
            {content}
        </button>
    );
};

export default Button;
