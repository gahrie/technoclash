// resources/js/src/components/Challenge/ChallengeList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoIosArrowBack, IoIosArrowForward, IoIosEye, IoIosCreate, IoIosTrash } from 'react-icons/io';
import Select from 'react-select';
import styles from './ChallengeList.module.scss';
import debounce from 'lodash/debounce';

const ChallengeList = () => {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [challengeToDelete, setChallengeToDelete] = useState(null);
    const [filterDifficulty, setFilterDifficulty] = useState([]);
    const [filterStatus, setFilterStatus] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const difficultyOptions = [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
    ];

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
    ];

    const rowsOptions = [
        { value: 10, label: '10 Rows' },
        { value: 20, label: '20 Rows' },
        { value: 50, label: '50 Rows' },
    ];

    const fetchChallenges = useCallback(
        debounce(async (page = 1, difficulty = filterDifficulty, status = filterStatus, search = searchQuery, rows = rowsPerPage) => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`/api/challenges`, {
                    params: {
                        page,
                        difficulty: difficulty.map((d) => d.value),
                        status: status.map((s) => s.value),
                        search,
                        rows,
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                setChallenges(response.data.data || []);
                setPagination(response.data.meta?.pagination || {});
            } catch (err) {
                if (err.response?.status === 401) {
                    setError('You are not authorized. Please log in.');
                    navigate('/login');
                } else {
                    setError('Something went wrong while fetching challenges');
                }
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    const handlePageChange = (page) => {
        fetchChallenges(page);
    };

    const deleteChallenge = async () => {
        try {
            await axios.delete(`/api/challenges/${challengeToDelete.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setShowModal(false);
            fetchChallenges();
        } catch (err) {
            setError('Failed to delete challenge');
        }
    };

    const openDeleteModal = (challenge) => {
        setChallengeToDelete(challenge);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setChallengeToDelete(null);
    };

    const viewChallenge = (challengeId) => {
        navigate(`/admin/challenges/${challengeId}`);
    };

    const editChallenge = (challengeId) => {
        navigate(`/admin/challenges/${challengeId}/edit`);
    };

    useEffect(() => {
        fetchChallenges(1, filterDifficulty, filterStatus, searchQuery, rowsPerPage);
    }, [filterDifficulty, filterStatus, searchQuery, rowsPerPage, fetchChallenges]);

    return (
        <div className={styles.challengeListContainer}>
            <h1>Challenge Problems</h1>
            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.filterContainer}>
                <div className={styles.filter}>
                    <label>Search:</label>
                    <input
                        type="text"
                        placeholder="Search by title or description"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filter}>
                    <label>Difficulty:</label>
                    <Select
                        value={filterDifficulty}
                        onChange={setFilterDifficulty}
                        options={difficultyOptions}
                        isMulti
                        placeholder="Select Difficulty"
                        className={styles.select}
                    />
                </div>

                <div className={styles.filter}>
                    <label>Status:</label>
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        options={statusOptions}
                        isMulti
                        placeholder="Select Status"
                        className={styles.select}
                    />
                </div>

                <div className={styles.filter}>
                    <label>Rows per page:</label>
                    <Select
                        value={rowsOptions.find((option) => option.value === rowsPerPage)}
                        onChange={(selectedOption) => setRowsPerPage(selectedOption.value)}
                        options={rowsOptions}
                        placeholder="Select Rows"
                        className={styles.select}
                    />
                </div>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Created By</th>
                        <th>Difficulty</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {challenges.length > 0 ? (
                        challenges.map((challenge) => (
                            <tr key={challenge.id}>
                                <td>{challenge.title || 'N/A'}</td>
                                <td>{challenge.user?.profile?.first_name + ' ' + challenge.user?.profile?.last_name || 'N/A'}</td>
                                <td>{challenge.difficulty || 'N/A'}</td>
                                <td>{challenge.status || 'N/A'}</td>
                                <td className={styles.actionColumn}>
                                    <button onClick={() => viewChallenge(challenge.id)} className={styles.actionBtn}>
                                        <IoIosEye />
                                    </button>
                                    <button onClick={() => editChallenge(challenge.id)} className={styles.actionBtn}>
                                        <IoIosCreate />
                                    </button>
                                    <button onClick={() => openDeleteModal(challenge)} className={styles.actionBtn}>
                                        <IoIosTrash />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">
                                {loading ? (
                                    <p className={styles.loading}>Loading...</p>
                                ) : (
                                    <p>No challenges found.</p>
                                )}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className={styles.pagination}>
                {pagination.current_page > 1 && (
                    <button
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        className={styles.paginationButton}
                    >
                        <IoIosArrowBack />
                    </button>
                )}
                <span>
                    Page {pagination.current_page || 1} of {pagination.total_pages || 1}
                </span>
                {pagination.current_page < pagination.total_pages && (
                    <button
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        className={styles.paginationButton}
                    >
                        <IoIosArrowForward />
                    </button>
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Confirm Deletion</h2>
                        <p>
                            Are you sure you want to delete the challenge{' '}
                            <strong>{challengeToDelete?.title}</strong>?
                        </p>
                        <div className={styles.modalButtons}>
                            <button onClick={deleteChallenge} className={styles.confirmBtn}>
                                Yes
                            </button>
                            <button onClick={closeModal} className={styles.cancelBtn}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengeList;