import React from "react";
import { Link as RouterLink } from "react-router-dom";
import clsx from "clsx";
import styles from "./CustomLink.module.scss";

const CustomLink = ({
    to,
    children,
    className = "",
    onClick,
    disabled = false,
    ...props
}) => (
    <RouterLink
        to={to}
        className={clsx(
            styles["ui-link"],
            { [styles["ui-link--disabled"]]: disabled },
            className
        )}
        onClick={disabled ? undefined : onClick}
        {...props}
    >
        {children}
    </RouterLink>
);

export default CustomLink;
