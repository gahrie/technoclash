import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './ViewChallenge.module.scss';

const ViewChallenge = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChallenge = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/challenges/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setChallenge(response.data.data);
            } catch (error) {
                if (error.response?.status === 404) {
                    setError('Challenge not found.');
                } else if (error.response?.status === 401) {
                    setError('Unauthorized. Please log in.');
                    navigate('/login');
                } else {
                    setError('Failed to load challenge data.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [id, navigate]);

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!challenge) return null;

    // Separate sample and hidden test cases
    const sampleTestCases = challenge.test_cases?.filter(tc => tc.is_sample) || [];
    const hiddenTestCases = challenge.test_cases?.filter(tc => !tc.is_sample) || [];

    return (
        <div className={styles.container}>
            <h1>{challenge.title}</h1>
            <div className={styles.card}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Challenge Details</h2>
                    <p><strong>Created By:</strong> {challenge.user?.profile?.first_name + ' ' + challenge.user?.profile?.last_name || 'N/A'}</p>
                    <p><strong>Difficulty:</strong> {challenge.difficulty}</p>
                    <p><strong>Status:</strong> {challenge.status}</p>
                    <p><strong>Description:</strong> {challenge.description}</p>
                    {challenge.constraints && (
                        <p><strong>Constraints:</strong> {challenge.constraints}</p>
                    )}
                    {challenge.tags && challenge.tags.length > 0 && (
                        <p>
                            <strong>Tags:</strong> 
                            {challenge.tags.map((tag, index) => (
                                <span key={index} className={styles.tag}>{tag}</span>
                            ))}
                        </p>
                    )}
                </div>

                {sampleTestCases.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Sample Test Cases</h2>
                        {sampleTestCases.map((testCase, index) => (
                            <div key={index} className={styles.testCase}>
                                <p><strong>Test Case {index + 1}:</strong></p>
                                <pre><strong>Input:</strong> {testCase.input}</pre>
                                <pre><strong>Output:</strong> {testCase.expected_output}</pre>
                            </div>
                        ))}
                    </div>
                )}

                {hiddenTestCases.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Hidden Test Cases</h2>
                        <p>These test cases are used for evaluation but hidden from users.</p>
                        {hiddenTestCases.map((testCase, index) => (
                            <div key={index} className={styles.testCase}>
                                <p><strong>Test Case {index + 1}:</strong></p>
                                <pre><strong>Input:</strong> {testCase.input}</pre>
                                <pre><strong>Output:</strong> {testCase.expected_output}</pre>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.actions}>
                    <button onClick={() => navigate('/admin/challenges')} className={styles.backButton}>
                        Back to List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewChallenge;