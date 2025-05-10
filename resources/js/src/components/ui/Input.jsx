import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Input.module.scss";

const Input = forwardRef(
    (
        {
            type = "text",
            id,
            value,
            onChange,
            placeholder = "",
            className = "",
            noFloat = false,
            ...props
        },
        ref
    ) => {
        const isFilled = Boolean(value);

        return (
            <div className={styles["ui-input-container"]}>
                <div className={styles["ui-input-wrapper"]}>
                    <input
                        type={type}
                        id={id}
                        value={value}
                        onChange={onChange}
                        className={clsx(
                            styles["ui-input"],
                            {
                                [styles["ui-input--filled"]]: isFilled,
                                [styles["ui-input--no-float"]]: noFloat,
                            },
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {placeholder && !noFloat && (
                        <span
                            className={clsx(styles["ui-input-span"])}
                        >
                            {placeholder}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

export default Input;
