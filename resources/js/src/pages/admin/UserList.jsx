// resources/js/src/components/Admin/UserList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import axios from 'axios';
import { IoIosArrowBack, IoIosArrowForward, IoIosEye, IoIosCreate, IoIosArchive, IoIosRefresh } from 'react-icons/io';
import Select from 'react-select';
import styles from './UserList.module.scss';
import debounce from 'lodash/debounce'; // For debouncing search

const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [userToArchive, setUserToArchive] = useState(null);
    const [userToActivate, setUserToActivate] = useState(null);
    const [filterRole, setFilterRole] = useState([]);
    const [filterStatus, setFilterStatus] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const roleOptions = [
        { value: 'admin', label: 'Admin' },
        { value: 'student', label: 'Student' },
        { value: 'professor', label: 'Professor' },
    ];

    const statusOptions = [
        { value: 'Activated', label: 'Activated' },
        { value: 'Deactivated', label: 'Deactivated' },
    ];

    const rowsOptions = [
        { value: 10, label: '10 Rows' },
        { value: 20, label: '20 Rows' },
        { value: 50, label: '50 Rows' },
    ];

    // Debounced fetchUsers function
    const fetchUsers = useCallback(
        debounce(async (page = 1, role = filterRole, status = filterStatus, search = searchQuery, rows = rowsPerPage) => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`/api/users`, {
                    params: {
                        page,
                        role: role.map((r) => r.value), // Send only the values
                        status: status.map((s) => s.value),
                        search,
                        rows,
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                setUsers(response.data.data || []);
                setPagination(response.data.meta?.pagination || {});
            } catch (err) {
                if (err.response?.status === 401) {
                    setError('You are not authorized. Please log in.');
                    navigate('/login'); // Redirect to login if unauthorized
                } else {
                    setError('Something went wrong while fetching users');
                }
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    const handlePageChange = (page) => {
        fetchUsers(page);
    };

    const archiveUser = async () => {
        try {
            await axios.put(
                `/api/users/${userToArchive.id}/archive`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            setError('Failed to archive user');
        }
    };

    const activateUser = async () => {
        try {
            await axios.put(
                `/api/users/${userToActivate.id}/activate`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            setError('Failed to activate user');
        }
    };

    const openArchiveModal = (user) => {
        setUserToArchive(user);
        setShowModal(true);
    };

    const openActivateModal = (user) => {
        setUserToActivate(user);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setUserToActivate(null);
        setUserToArchive(null);
    };

    const viewProfile = (userId) => {
        navigate(`/admin/users/${userId}`); // Navigate to user profile (if implemented)
    };

    const editUser = (userId) => {
        navigate(`/admin/users/${userId}/edit`); // Navigate to update form
    };

    // Update fetchUsers when filters or search change
    useEffect(() => {
        fetchUsers(1, filterRole, filterStatus, searchQuery, rowsPerPage);
    }, [filterRole, filterStatus, searchQuery, rowsPerPage, fetchUsers]);

    return (
        <div className={styles.userListContainer}>
            <h1>User List</h1>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.filterContainer}>
                <div className={styles.filter}>
                    <label>Search:</label>
                    <input
                        type="text"
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filter}>
                    <label>Role:</label>
                    <Select
                        value={filterRole}
                        onChange={setFilterRole}
                        options={roleOptions}
                        isMulti
                        placeholder="Select Role"
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
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registration</th>
                        <th>Status</th>
                        <th>Username</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    {user.profile?.first_name && user.profile?.last_name
                                    ? `${user.profile.first_name} ${user.profile.last_name}`
                                    : 'N/A'}
                                </td>
                                <td>{user.email || 'N/A'}</td>
                                <td>{user.role || 'N/A'}</td>
                                <td>{user.email_verified_at ? 'Verified' : 'Not Verified'}</td>
                                <td>{user.status || 'N/A'}</td>
                                <td>{user.profile?.username || 'N/A'}</td>
                                <td className={styles.actionColumn}>
                                    <button onClick={() => viewProfile(user.id)} className={styles.actionBtn}>
                                    <IoIosEye />
                                    </button>
                                    <button onClick={() => editUser(user.id)} className={styles.actionBtn}>
                                    <IoIosCreate />
                                    </button>
                                    {user.status === 'Activated' ? (
                                    <button onClick={() => openArchiveModal(user)} className={styles.actionBtn}>
                                        <IoIosArchive />
                                    </button>
                                    ) : (
                                    <button onClick={() => openActivateModal(user)} className={styles.actionBtn}>
                                        <IoIosRefresh />
                                    </button>
                                    )}
                                </td>
                                </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7">
                                {loading ? (
                                    <p className={styles.loading}>Loading...</p>
                                ) : (
                                    <p>No users found.</p>
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
                        <h2>Confirm Action</h2>
                        {userToActivate ? (
                            <p>
                                Are you sure you want to activate this user{' '}
                                <strong>
                                    {userToActivate?.first_name} {userToActivate?.last_name}
                                </strong>
                                ?
                            </p>
                        ) : (
                            <p>
                                Are you sure you want to deactivate this user{' '}
                                <strong>
                                    {userToArchive?.first_name} {userToArchive?.last_name}
                                </strong>
                                ?
                            </p>
                        )}
                        <div className={styles.modalButtons}>
                            <button
                                onClick={userToActivate ? activateUser : archiveUser}
                                className={styles.confirmBtn}
                            >
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

export default UserList;