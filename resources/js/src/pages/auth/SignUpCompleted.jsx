import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import styles from './SignUp.module.scss';

const SignUpCompleted = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    localStorage.removeItem('signup_email');
    localStorage.removeItem('registration_progress');
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Sign Up Complete!</h1>
        <div className={styles['success-message']}>
          <p>Congratulations! Your account has been successfully created.</p>
          <p>You’ll be redirected to the login page in a few seconds, or click below to go there now.</p>
        </div>
        <Button variant='secondary' onClick={handleLoginClick}>Go to Login</Button>
      </div>
    </div>
  );
};

export default SignUpCompleted;