import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import styles from './SignUp.module.scss';

const SignUpInformation = () => {
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    university: '',
  });
  const [error, setError] = useState({ firstname: '', lastname: '', role: '', general: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setError({ ...error, role: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError({ ...error, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ firstname: '', lastname: '', role: '', general: '' });
    setLoading(true);

    const email = localStorage.getItem('signup_email');
    if (!email) {
      setError({ general: 'Session expired. Please start over.' });
      setLoading(false);
      return;
    }

    if (!role) {
      setError({ ...error, role: 'Please select a role' });
      setLoading(false);
      return;
    }

    if (!formData.firstname || !formData.lastname) {
      setError({
        ...error,
        firstname: !formData.firstname ? 'First name is required' : '',
        lastname: !formData.lastname ? 'Last name is required' : '',
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/signup/information', {
        email,
        role,
        firstname: formData.firstname,
        lastname: formData.lastname,
        university: formData.university,
      });
      localStorage.setItem('registration_progress', 'information');
      navigate('/signup/verification');
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors;
        setError({
          ...error,
          firstname: validationErrors.firstname ? validationErrors.firstname[0] : '',
          lastname: validationErrors.lastname ? validationErrors.lastname[0] : '',
          general: validationErrors.email || validationErrors.role ? 'Invalid data' : '',
        });
      } else {
        setError({ general: err.response?.data?.message || 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'professor', label: 'Professor' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Sign Up - Information</h1>
        {error.general && <p className={styles.error}>{error.general}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <Select
              id="role"
              value={role}
              onChange={handleRoleChange}
              options={roleOptions}
              placeholder="I am a"
              required
            />
            {error.role && <p className={styles.error}>{error.role}</p>}
          </div>

          <div className={styles['form-group']}>
            <Input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              placeholder="First Name"
              error={error.firstname}
              required
            />
            {error.firstname && <p className={styles.error}>{error.firstname}</p>}
          </div>

          <div className={styles['form-group']}>
            <Input
              type="text"
              id="lastname"
              name="lastname"
              value={formData.lastname}
              onChange={handleInputChange}
              placeholder="Last Name"
              error={error.lastname}
              required
            />
            {error.lastname && <p className={styles.error}>{error.lastname}</p>}
          </div>

          <div className={styles['form-group']}>
            <Input
              type="text"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleInputChange}
              placeholder="University (Optional)"
            />
          </div>

          <Button variant='secondary' type="submit" loading={loading}>
            Next
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignUpInformation;