import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Select.module.scss";

const Select = forwardRef(
    (
        {
            id,
            value,
            onChange,
            options = [],
            placeholder = "",
            error = "",
            className = "",
            filled = false,
            ...props
        },
        ref
    ) => {
        const isFilled = Boolean(value) || filled;

        return (
            <div className={styles["ui-select-container"]}>
                <div className={styles["ui-select-wrapper"]}>
                    <select
                        id={id}
                        value={value}
                        onChange={onChange}
                        className={clsx(
                            styles["ui-select"],
                            {
                                [styles["ui-select--filled"]]: isFilled,
                                [styles["ui-select--error"]]: Boolean(error),
                            },
                            className
                        )}
                        ref={ref}
                        {...props}
                    >
                        <option value="" hidden></option>{" "}
                        {/* empty by default, no label */}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {placeholder && (
                        <span
                            className={clsx(styles["ui-select-span"], {
                                [styles["ui-select-span--float"]]: isFilled,
                            })}
                        >
                            {placeholder}
                        </span>
                    )}
                </div>
                {error && <p className={styles["ui-select-error"]}>{error}</p>}
            </div>
        );
    }
);

export default Select;
