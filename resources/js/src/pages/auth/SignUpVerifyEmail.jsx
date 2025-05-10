import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import CustomLink from '../../components/ui/CustomLink';
import styles from './SignUp.module.scss';

const SignUpVerifyEmail = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState({ code: '', general: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleCodeChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      setError({ ...error, code: '' });

      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''));
      setCode(newCode);
      inputRefs.current[Math.min(pasted.length - 1, 5)].focus();
      e.preventDefault();
    }
  };

  const handleSignInClick = () => {
    localStorage.removeItem('signup_email');
    localStorage.removeItem('registration_progress');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ code: '', general: '' });
    setLoading(true);

    const email = localStorage.getItem('signup_email');
    if (!email) {
      setError({ general: 'Session expired. Please start over.' });
      setLoading(false);
      return;
    }

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError({ code: 'Please enter a 6-digit code' });
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/signup/verify-email', { email, code: fullCode });
      localStorage.setItem('registration_progress', 'completed');
      navigate('/signup/completed');
    } catch (err) {
      if (err.response?.status === 400) {
        setError({ code: 'Invalid or expired code', general: '' });
      } else {
        setError({ general: err.response?.data?.message || 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setError({ code: '', general: '' });
    setLoading(true);

    const email = localStorage.getItem('signup_email');
    if (!email) {
      setError({ general: 'Session expired. Please start over.' });
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/signup/resend-verification', { email });
      setShowModal(true);
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setError({ general: err.response?.data?.message || 'Failed to resend code. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Verify Your Email</h1>
        <p>Enter the 6-digit code sent to your email.</p>
        {error.general && <p className={styles.error}>{error.general}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <div className={styles['code-inputs']}>
              {code.map((digit, index) => (
                <Input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : null}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className={styles['code-input']}
                  noFloat
                  required
                />
              ))}
            </div>
            {error.code && <p className={styles.error}>{error.code}</p>}
          </div>
          <Button variant='form' type="submit" loading={loading}>
            Verify
          </Button>
        </form>
        <p>
          Didn’t receive a code?{' '}
          <CustomLink to="#" onClick={handleResend} disabled={loading}>
            Resend
          </CustomLink>
        </p>
        <p>
            Already have an account? <CustomLink to="/login" onClick={handleSignInClick}>Sign in</CustomLink>
        </p>
      </div>
      {showModal && (
        <div className={styles.modal}>
          <p>Verification code resent!</p>
        </div>
      )}
    </div>
  );
};

export default SignUpVerifyEmail;