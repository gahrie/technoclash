import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import styles from './SignUp.module.scss';

const SignUpInformation = () => {
  const [role, setRole] = useState('');
  const [gender, setGender] = useState('');
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    university: '',
  });
  const [error, setError] = useState({
    firstname: '',
    lastname: '',
    role: '',
    gender: '',
    general: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setError({ ...error, role: '' });
  };

  const handleGenderChange = (e) => {
    setGender(e.target.value);
    setError({ ...error, gender: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'firstname' || name === 'lastname') {
      sanitizedValue = value.replace(/[^a-zA-Z'-]/g, '');
    }

    setFormData({ ...formData, [name]: sanitizedValue });
    setError({ ...error, [name]: '' });
  };

  const handleSignInClick = () => {
    localStorage.removeItem('signup_email');
    localStorage.removeItem('registration_progress');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ firstname: '', lastname: '', role: '', gender: '', general: '' });
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

    if (!gender) {
      setError({ ...error, gender: 'Please select a gender' });
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
        gender,
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
          gender: validationErrors.gender ? validationErrors.gender[0] : '',
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

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
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
            <Select
              id="gender"
              value={gender}
              onChange={handleGenderChange}
              options={genderOptions}
              placeholder="Gender"
              required
            />
            {error.gender && <p className={styles.error}>{error.gender}</p>}
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

          <Button variant="form" type="submit" loading={loading}>
            Next
          </Button>
          <p>
            Already have an account? <CustomLink to="/login" onClick={handleSignInClick}>Sign in</CustomLink>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpInformation;