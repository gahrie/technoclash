import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './UpdateChallenge.module.scss';

const UpdateChallenge = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [constraints, setConstraints] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [testCases, setTestCases] = useState([]);
    const [status, setStatus] = useState('');
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [serverErrors, setServerErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchChallenge = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/challenges/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const challenge = response.data.data;
                setTitle(challenge.title || '');
                setDescription(challenge.description || '');
                setDifficulty(challenge.difficulty || '');
                setConstraints(challenge.constraints || '');
                setTags(challenge.tags || []);
                setTestCases(challenge.test_cases || []);
                setStatus(challenge.status || '');
            } catch (error) {
                if (error.response?.status === 404) {
                    setServerErrors({ general: 'Challenge not found.' });
                } else if (error.response?.status === 401) {
                    setServerErrors({ general: 'Unauthorized. Please log in.' });
                    navigate('/login');
                } else {
                    setServerErrors({ general: 'Failed to load challenge data.' });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [id, navigate]);

    const validateForm = () => {
        const newErrors = {};
        if (!title) newErrors.title = 'Title is required';
        if (!description) newErrors.description = 'Description is required';
        if (!difficulty) newErrors.difficulty = 'Difficulty is required';
        if (testCases.length === 0) newErrors.testCases = 'At least one test case is required';
        if (!status) newErrors.status = 'Status is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    const addTestCase = () => {
        setTestCases([...testCases, { input: '', expected_output: '', is_sample: false }]);
    };

    const removeTestCase = (index) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const handleTagInput = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        const data = {
            title,
            description,
            difficulty,
            constraints,
            tags,
            test_cases: testCases,
            status,
        };

        try {
            setLoading(true);
            await axios.get('/sanctum/csrf-cookie');
            const response = await axios.put(`/api/challenges/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            setSuccessMessage('Challenge updated successfully!');
            setServerErrors({});
            setErrors({});
            setTimeout(() => navigate('/admin/challenges'), 2000);
        } catch (error) {
            if (error.response) {
                if (error.response.status === 422) {
                    setServerErrors(error.response.data.errors);
                    setSuccessMessage('');
                } else if (error.response.status === 401 || error.response.status === 403) {
                    setServerErrors({ general: 'You are not authorized to perform this action.' });
                    setSuccessMessage('');
                } else {
                    setServerErrors({ general: 'An error occurred. Please try again.' });
                    setSuccessMessage('');
                }
            } else {
                setServerErrors({ general: 'Network error. Please check your connection.' });
                setSuccessMessage('');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {loading && <div className={styles.loading}>Loading...</div>}
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <div className={styles.card}>
                    {successMessage && <div className={styles.success}>{successMessage}</div>}
                    {serverErrors.general && <div className={styles.error}>{serverErrors.general}</div>}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Challenge Details</h2>
                        <div className={styles.inputGroup}>
                            <label htmlFor="title">Title</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`${styles.input} ${errors.title ? styles.inputError : ''} ${
                                    title ? styles.inputFilled : ''
                                }`}
                                required
                            />
                            {errors.title && <span className={styles.error}>{errors.title}</span>}
                            {serverErrors.title && <span className={styles.error}>{serverErrors.title[0]}</span>}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={`${styles.input} ${errors.description ? styles.inputError : ''} ${
                                    description ? styles.inputFilled : ''
                                }`}
                                required
                            />
                            {errors.description && <span className={styles.error}>{errors.description}</span>}
                            {serverErrors.description && (
                                <span className={styles.error}>{serverErrors.description[0]}</span>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="difficulty">Difficulty</label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className={`${styles.input} ${errors.difficulty ? styles.inputError : ''} ${
                                    difficulty ? styles.inputFilled : ''
                                }`}
                                required
                            >
                                <option value="">Select difficulty</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            {errors.difficulty && <span className={styles.error}>{errors.difficulty}</span>}
                            {serverErrors.difficulty && (
                                <span className={styles.error}>{serverErrors.difficulty[0]}</span>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="constraints">Constraints</label>
                            <textarea
                                id="constraints"
                                value={constraints}
                                onChange={(e) => setConstraints(e.target.value)}
                                className={`${styles.input} ${constraints ? styles.inputFilled : ''}`}
                            />
                            {serverErrors.constraints && (
                                <span className={styles.error}>{serverErrors.constraints[0]}</span>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Tags (press Enter to add)</label>
                            <div className={styles.tagsContainer}>
                                {tags.map((tag, index) => (
                                    <div key={index} className={styles.tag}>
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className={styles.removeTag}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagInput}
                                    className={styles.tagInput}
                                    placeholder="Add a tag..."
                                />
                            </div>
                            {serverErrors.tags && (
                                <span className={styles.error}>{serverErrors.tags[0]}</span>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={`${styles.input} ${errors.status ? styles.inputError : ''} ${
                                    status ? styles.inputFilled : ''
                                }`}
                                required
                            >
                                <option value="">Select status</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                            {errors.status && <span className={styles.error}>{errors.status}</span>}
                            {serverErrors.status && <span className={styles.error}>{serverErrors.status[0]}</span>}
                        </div>
                        <h3>Test Cases</h3>
                        {testCases.map((testCase, index) => (
                            <div key={index} className={styles.testCaseGroup}>
                                <div className={styles.inputGroup}>
                                    <label>Input</label>
                                    <textarea
                                        value={testCase.input}
                                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Expected Output</label>
                                    <textarea
                                        value={testCase.expected_output}
                                        onChange={(e) => handleTestCaseChange(index, 'expected_output', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={testCase.is_sample}
                                            onChange={(e) => handleTestCaseChange(index, 'is_sample', e.target.checked)}
                                        />
                                        Mark as sample
                                    </label>
                                </div>
                                {testCases.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeTestCase(index)}
                                        className={styles.removeButton}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addTestCase}
                            className={styles.addButton}
                        >
                            Add Test Case
                        </button>
                        {errors.testCases && <span className={styles.error}>{errors.testCases}</span>}

                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Updating...' : 'Update Challenge'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UpdateChallenge;