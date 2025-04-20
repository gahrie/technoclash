import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaInfoCircle, FaCheck, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import CustomLink from '../../components/ui/CustomLink';
import styles from './SignUp.module.scss';

const SignUpCredentials = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState({ email: '', password: '', confirmPassword: '', general: '' });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, color: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [criteria, setCriteria] = useState({
    lengthCheck: false,
    upperCheck: false,
    lowerCheck: false,
    numberCheck: false,
    specialCheck: false,
  });

  const navigate = useNavigate();

  const strengthLevels = [
    { label: 'Weak', color: '#FF4D4D', score: 1 },
    { label: 'Fair', color: '#FFA500', score: 2 },
    { label: 'Good', color: '#FFD700', score: 3 },
    { label: 'Strong', color: '#4CAF50', score: 4 },
  ];

  const checkPasswordStrength = (password) => {
    const lengthCheck = password.length >= 8;
    const upperCheck = /[A-Z]/.test(password);
    const lowerCheck = /[a-z]/.test(password);
    const numberCheck = /\d/.test(password);
    const specialCheck = /[!@#$%^&*()_,.?":{}|<>]/.test(password);

    const score = [lengthCheck, upperCheck, lowerCheck, numberCheck, specialCheck].filter(Boolean).length;
    setCriteria({ lengthCheck, upperCheck, lowerCheck, numberCheck, specialCheck });
    const strength = strengthLevels[Math.min(score - 1, 3)] || { label: 'Weak', color: '#FF4D4D', score: 0 };
    setPasswordStrength(strength);

    return { lengthCheck, upperCheck, lowerCheck, numberCheck, specialCheck };
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value.replace(/\s/g, ''));
    setError({ ...error, email: '' });
  };

  const handlePasswordChange = (e) => {
    const noSpaces = e.target.value.replace(/\s/g, '');
    setPassword(noSpaces);
    checkPasswordStrength(noSpaces);
    setError({ ...error, password: '' });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value.replace(/\s/g, ''));
    setError({ ...error, confirmPassword: '' });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ email: '', password: '', confirmPassword: '', general: '' });
    setLoading(true);

    const { lengthCheck, upperCheck, lowerCheck, numberCheck, specialCheck } = checkPasswordStrength(password);
    if (!(lengthCheck && upperCheck && lowerCheck && numberCheck && specialCheck)) {
      setError({ ...error, password: 'Password must meet all criteria (see tooltip)' });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError({ ...error, confirmPassword: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/signup/credentials', { email, password });
      localStorage.setItem('signup_email', email);
      localStorage.setItem('registration_progress', 'credentials');
      navigate('/signup/information');
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors;
        setError({
          ...error,
          email: validationErrors.email ? validationErrors.email[0] : '',
          password: validationErrors.password ? validationErrors.password[0] : '',
        });
      } else {
        setError({ ...error, general: 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Sign Up - Credentials</h1>
        {error.general && <p className={styles.error}>{error.general}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Email"
              required
            />
            {error.email && <p className={styles.error}>{error.email}</p>}
          </div>

          <div className={styles['form-group']}>
            <div className={clsx(styles['password-wrapper'], { [styles.filled]: password })}>
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                className={styles.password}
                placeholder="Password"
                required
              />
              <div className={styles.icons}>
                <span className={styles['toggle-icon']} onClick={togglePasswordVisibility}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
                <span className={styles['info-icon']}>
                  <FaInfoCircle />
                  <div className={styles['tooltip-content']}>
                    <ul>
                      <li>
                        {criteria.lengthCheck ? <FaCheck className={styles['check-icon']} /> : <FaTimes className={styles['times-icon']} />}
                        At least 8 characters
                      </li>
                      <li>
                        {criteria.upperCheck ? <FaCheck className={styles['check-icon']} /> : <FaTimes className={styles['times-icon']} />}
                        1 uppercase letter
                      </li>
                      <li>
                        {criteria.lowerCheck ? <FaCheck className={styles['check-icon']} /> : <FaTimes className={styles['times-icon']} />}
                        1 lowercase letter
                      </li>
                      <li>
                        {criteria.numberCheck ? <FaCheck className={styles['check-icon']} /> : <FaTimes className={styles['times-icon']} />}
                        1 number
                      </li>
                      <li>
                        {criteria.specialCheck ? <FaCheck className={styles['check-icon']} /> : <FaTimes className={styles['times-icon']} />}
                        1 special character
                      </li>
                    </ul>
                  </div>
                </span>
              </div>
            </div>
            <div className={styles['password-strength']}>
              <label>
                Password Strength:
                <span
                  className={styles['strength-label']}
                  style={{ color: passwordStrength.color, marginLeft: '5px' }}
                >
                  {passwordStrength.label || 'None'}
                </span>
              </label>
            </div>
            {error.password && <p className={styles.error}>{error.password}</p>}
          </div>

          <div className={styles['form-group']}>
            <div className={clsx(styles['password-wrapper'], { [styles.filled]: confirmPassword })}>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                className={styles.confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm Password"
                required
              />
              <div className={styles.icons}>
                <span className={styles['toggle-icon']} onClick={toggleConfirmPasswordVisibility}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            {error.confirmPassword && <p className={styles.error}>{error.confirmPassword}</p>}
          </div>

          <Button variant='secondary' type="submit" loading={loading}>
            Next
          </Button>
        </form>
        <p>
          Already have an account? <CustomLink to="/login">Sign in</CustomLink>
        </p>
      </div>
    </div>
  );
};

export default SignUpCredentials;