import React from "react";
import styles from "./card.module.scss";

const Card = ({ title, value, isLoading, description = "", icon: Icon }) => {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                {Icon && <Icon className={styles.icon} />}
            </div>
            <p className={styles.value}>
                {isLoading ? (
                    <div className={styles.spinnerContainer}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : (
                    value ?? "N/A"
                )}
            </p>
            <span className={styles.description}>{description}</span>
        </div>
    );
};

export default Card;
