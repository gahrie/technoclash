import React from "react";
import clsx from "clsx";
import styles from "./Label.module.scss";

const Label = ({ htmlFor, children, className = "", ...props }) => (
    <label
        htmlFor={htmlFor}
        className={clsx(styles["ui-label"], className)}
        {...props}
    >
        {children}
    </label>
);

export default Label;
