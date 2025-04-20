// resources/js/src/components/Admin/CreateUser.jsx
import React, { useState } from 'react';
import axios from 'axios'; // Import Axios
import styles from './CreateUser.module.scss';

const CreateUser = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [university, setUniversity] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState(''); // For success feedback
    const [serverErrors, setServerErrors] = useState({}); // For server-side errors

    const handleAvatarChange = (event) => {
        setAvatar(event.target.files[0]);
    };

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const handleConfirmPasswordToggle = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!firstName) newErrors.firstName = 'First name is required';
        if (!lastName) newErrors.lastName = 'Last name is required';
        if (!username) newErrors.username = 'Username is required';
        if (!gender) newErrors.gender = 'Gender is required';
        if (!email) newErrors.email = 'Email is required';
        if (!role) newErrors.role = 'Role is required';
        if (!password) newErrors.password = 'Password is required';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        const formData = new FormData();
        if (avatar) {
            formData.append('avatar', avatar);
        }
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('username', username);
        formData.append('gender', gender);
        formData.append('bio', bio);
        formData.append('university', university);
        formData.append('email', email);
        formData.append('role', role);
        formData.append('password', password);
        formData.append('confirm_password', confirmPassword);

        try {
            const response = await axios.post('/api/admin/users/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            // On success
            setSuccessMessage('User created successfully!');
            setServerErrors({});
            setErrors({});
            // Reset form
            setFirstName('');
            setLastName('');
            setUsername('');
            setGender('');
            setBio('');
            setUniversity('');
            setEmail('');
            setRole('');
            setPassword('');
            setConfirmPassword('');
            setAvatar(null);
        } catch (error) {
            if (error.response && error.response.status === 422) {
                // Handle validation errors from the server
                setServerErrors(error.response.data.errors);
                setSuccessMessage('');
            } else {
                // Handle other errors (e.g., network issues)
                setServerErrors({ general: 'An error occurred. Please try again.' });
                setSuccessMessage('');
            }
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <div className={styles.card}>
                    {successMessage && <div className={styles.success}>{successMessage}</div>}
                    {serverErrors.general && <div className={styles.error}>{serverErrors.general}</div>}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Information</h2>
                        <div className={styles.inputGroup}>
                            <label htmlFor="avatar">Avatar</label>
                            <input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className={styles.input}
                            />
                            {serverErrors.avatar && <span className={styles.error}>{serverErrors.avatar[0]}</span>}
                        </div>
                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={`${styles.input} ${errors.firstName ? styles.inputError : ''} ${
                                        firstName ? styles.inputFilled : ''
                                    }`}
                                    required
                                />
                                {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                                {serverErrors.first_name && (
                                    <span className={styles.error}>{serverErrors.first_name[0]}</span>
                                )}
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={`${styles.input} ${errors.lastName ? styles.inputError : ''} ${
                                        lastName ? styles.inputFilled : ''
                                    }`}
                                    required
                                />
                                {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                                {serverErrors.last_name && (
                                    <span className={styles.error}>{serverErrors.last_name[0]}</span>
                                )}
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className={`${styles.input} ${errors.username ? styles.inputError : ''} ${
                                        username ? styles.inputFilled : ''
                                    }`}
                                    required
                                />
                                {errors.username && <span className={styles.error}>{errors.username}</span>}
                                {serverErrors.username && (
                                    <span className={styles.error}>{serverErrors.username[0]}</span>
                                )}
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="gender">Gender</label>
                                <select
                                    id="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className={`${styles.input} ${errors.gender ? styles.inputError : ''} ${
                                        gender ? styles.inputFilled : ''
                                    }`}
                                    required
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.gender && <span className={styles.error}>{errors.gender}</span>}
                                {serverErrors.gender && <span className={styles.error}>{serverErrors.gender[0]}</span>}
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="bio">Bio</label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className={`${styles.input} ${bio ? styles.inputFilled : ''}`}
                            />
                            {serverErrors.bio && <span className={styles.error}>{serverErrors.bio[0]}</span>}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="university">University</label>
                            <input
                                id="university"
                                type="text"
                                value={university}
                                onChange={(e) => setUniversity(e.target.value)}
                                className={`${styles.input} ${university ? styles.inputFilled : ''}`}
                            />
                            {serverErrors.university && (
                                <span className={styles.error}>{serverErrors.university[0]}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Credentials</h2>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`${styles.input} ${errors.email ? styles.inputError : ''} ${
                                    email ? styles.inputFilled : ''
                                }`}
                                required
                            />
                            {errors.email && <span className={styles.error}>{errors.email}</span>}
                            {serverErrors.email && <span className={styles.error}>{serverErrors.email[0]}</span>}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="role">Role</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className={`${styles.input} ${errors.role ? styles.inputError : ''} ${
                                    role ? styles.inputFilled : ''
                                }`}
                                required
                            >
                                <option value="">Select a role</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                            </select>
                            {errors.role && <span className={styles.error}>{errors.role}</span>}
                            {serverErrors.role && <span className={styles.error}>{serverErrors.role[0]}</span>}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${styles.input} ${errors.password ? styles.inputError : ''} ${
                                        password ? styles.inputFilled : ''
                                    }`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handlePasswordToggle}
                                    className={styles.passwordToggle}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {errors.password && <span className={styles.error}>{errors.password}</span>}
                            {serverErrors.password && (
                                <span className={styles.error}>{serverErrors.password[0]}</span>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`${styles.input} ${
                                        errors.confirmPassword ? styles.inputError : ''
                                    } ${confirmPassword ? styles.inputFilled : ''}`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleConfirmPasswordToggle}
                                    className={styles.passwordToggle}
                                >
                                    {showConfirmPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                            {serverErrors.confirm_password && (
                                <span className={styles.error}>{serverErrors.confirm_password[0]}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitButton}>
                            Create User
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;