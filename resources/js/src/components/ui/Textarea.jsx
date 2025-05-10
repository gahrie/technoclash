import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Textarea.module.scss";

const Textarea = forwardRef(
    (
        {
            id,
            value,
            onChange,
            placeholder = "",
            className = "",
            noFloat = false,
            rows = 4,
            ...props
        },
        ref
    ) => {
        const isFilled = Boolean(value);

        return (
            <div className={styles["ui-textarea-container"]}>
                <div className={styles["ui-textarea-wrapper"]}>
                    <textarea
                        id={id}
                        value={value}
                        onChange={onChange}
                        className={clsx(
                            styles["ui-textarea"],
                            {
                                [styles["ui-textarea--filled"]]: isFilled,
                                [styles["ui-textarea--no-float"]]: noFloat,
                            },
                            className
                        )}
                        rows={rows}
                        ref={ref}
                        {...props}
                    />
                    {placeholder && !noFloat && (
                        <span
                            className={clsx(styles["ui-textarea-span"])}
                        >
                            {placeholder}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

export default Textarea;
