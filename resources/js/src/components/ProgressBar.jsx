import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import styles from './ProgressBar.module.scss';

const ProgressBar = () => {
  const location = useLocation();
  const [previousIndex, setPreviousIndex] = useState(-1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const steps = [
    { label: 'Credentials', path: '/signup/credentials' },
    { label: 'Information', path: '/signup/information' },
    { label: 'Verification', path: '/signup/verification' },
    { label: 'Completed', path: '/signup/completed' },
  ];

  useEffect(() => {
    const newIndex = steps.findIndex((step) => location.pathname === step.path);
    const activeIndex = newIndex === -1 ? 0 : newIndex;
    if (activeIndex !== currentIndex) {
      setPreviousIndex(currentIndex);
      setCurrentIndex(activeIndex);
    }
  }, [location.pathname]);

  return (
    <div className={styles.progressBar}>
      {steps.map((step, index) => (
        <div key={index} className={styles.progressStep}>
          <div
            className={clsx(styles.progressNode, {
              [styles.active]: index === currentIndex,
              [styles.completed]: index < currentIndex,
              [styles.inactive]: index > currentIndex,
            })}
          >
            {index + 1}
          </div>
          <span className={styles.progressLabel}>{step.label}</span>
          {index < steps.length - 1 && (
            <div
              className={clsx(styles.progressLine, {
                [styles.completed]: index < currentIndex,
                [styles.inactive]: index >= currentIndex,
              })}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressBar;