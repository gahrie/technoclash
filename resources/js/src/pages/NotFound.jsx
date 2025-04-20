import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.scss';

const NotFound = () => {

  return (
    <div className={styles['notFoundContainer']}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/">
        Go Back
      </Link>
    </div>
  );
};

export default NotFound;