import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Checkbox.module.scss";

const Checkbox = forwardRef(
    (
        {
            id,
            checked,
            onChange,
            label,
            size = "medium", // small, medium, large
            labelPosition = "right", // left, right, top, bottom
            variant = "checkbox", // checkbox or switch
            disabled = false,
            required = false,
            error,
            className = "",
            inputClassName = "",
            labelClassName = "",
            ...props
        },
        ref
    ) => {
        const containerStyles = clsx(
            styles.inputGroup,
            styles[`checkboxContainer--${labelPosition}`],
            className
        );

        const inputStyles = clsx(
            styles.checkboxInput,
            styles[`checkboxInput--${size}`],
            styles[`checkboxInput--${variant}`],
            {
                [styles.checkboxInputDisabled]: disabled,
            },
            inputClassName
        );

        const labelStyles = clsx(
            styles.checkboxLabel,
            styles[`checkboxLabel--${labelPosition}`],
            labelClassName
        );

        return (
            <div className={containerStyles}>
                <label className={labelStyles}>
                    {["top", "left"].includes(labelPosition) && label && (
                        <span className={styles.checkboxText}>{label}</span>
                    )}
                    <input
                        type="checkbox"
                        id={id}
                        checked={checked}
                        onChange={onChange}
                        className={inputStyles}
                        disabled={disabled}
                        required={required}
                        ref={ref}
                        {...props}
                    />
                    {["right", "bottom"].includes(labelPosition) && label && (
                        <span className={styles.checkboxText}>{label}</span>
                    )}
                </label>
                {error && <span className={styles.error}>{error}</span>}
            </div>
        );
    }
);

export default Checkbox;
