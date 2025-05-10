import React, { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
    IoIosArrowBack,
    IoIosArrowForward,
    IoIosPeople,
    IoIosPerson,
    IoIosCheckmarkCircle,
    IoIosPause,
    IoIosEye,
    IoIosCreate,
    IoIosAddCircleOutline,
    IoIosArchive,
    IoIosRefresh,
} from "react-icons/io";
import { FaUserCircle } from "react-icons/fa";
import CustomSelect from "../../components/ui/CustomSelect";
import Input from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import styles from "./UserList.module.scss";
import { UserListContext } from "../../context/UserListContext"; // Adjust path

// localStorage utilities
const loadFromLocalStorage = (key, defaultValue) => {
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            const { data, timestamp } = JSON.parse(saved);
            if (Date.now() - timestamp > 3600000) { // 1 hour expiry
                localStorage.removeItem(key);
                return defaultValue;
            }
            return data;
        }
        return defaultValue;
    } catch (err) {
        console.error(`Error loading ${key} from localStorage:`, err);
        return defaultValue;
    }
};

const saveToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify({ data: value, timestamp: Date.now() }));
    } catch (err) {
        console.error(`Error saving ${key} to localStorage:`, err);
    }
};

const UserList = () => {
    const navigate = useNavigate();
    const { addNotification } = useOutletContext();
    const context = useContext(UserListContext);

    if (!context) {
        console.error("UserListContext is undefined. Ensure UserList is wrapped in UserListProvider.");
    }

    // Use context if available, otherwise fallback to local state
    const {
        users: contextUsers,
        setUsers: setContextUsers,
        cachedUsers: contextCachedUsers,
        setCachedUsers: setContextCachedUsers,
        pagination: contextPagination,
        setPagination: setContextPagination,
        demographics: contextDemographics,
        setDemographics: setContextDemographics,
        filters: contextFilters,
        setFilters: setContextFilters,
        rowsPerPage: contextRowsPerPage,
        setRowsPerPage: setContextRowsPerPage,
        sortBy: contextSortBy,
        setSortBy: setContextSortBy,
        resetState: contextResetState,
    } = context || {};

    // Local state as fallback
    const [localUsers, setLocalUsers] = useState(loadFromLocalStorage("userListUsers", []));
    const [localCachedUsers, setLocalCachedUsers] = useState(loadFromLocalStorage("userListCachedUsers", {}));
    const [localPagination, setLocalPagination] = useState(loadFromLocalStorage("userListPagination", {}));
    const [localDemographics, setLocalDemographics] = useState(
        loadFromLocalStorage("userListDemographics", {
            total_users: null,
            total_students: null,
            total_admins: null,
            total_professors: null,
            total_active: null,
            total_inactive: null,
        })
    );
    const [localFilters, setLocalFilters] = useState(
        loadFromLocalStorage("userListFilters", {
            search: "",
            roles: [],
            statuses: [],
        })
    );
    const [localRowsPerPage, setLocalRowsPerPage] = useState(loadFromLocalStorage("userListRowsPerPage", 10));
    const [localSortBy, setLocalSortBy] = useState(loadFromLocalStorage("userListSortBy", null));

    // Use context if available, else local state
    const users = context ? contextUsers : localUsers;
    const setUsers = context ? setContextUsers : (newUsers) => {
        setLocalUsers(newUsers);
        saveToLocalStorage("userListUsers", newUsers);
    };
    const cachedUsers = context ? contextCachedUsers : localCachedUsers;
    const setCachedUsers = context ? setContextCachedUsers : (newCache) => {
        setLocalCachedUsers(newCache);
        saveToLocalStorage("userListCachedUsers", newCache);
    };
    const pagination = context ? contextPagination : localPagination;
    const setPagination = context ? setContextPagination : (newPagination) => {
        setLocalPagination(newPagination);
        saveToLocalStorage("userListPagination", newPagination);
    };
    const demographics = context ? contextDemographics : localDemographics;
    const setDemographics = context ? setContextDemographics : (newDemographics) => {
        setLocalDemographics(newDemographics);
        saveToLocalStorage("userListDemographics", newDemographics);
    };
    const filters = context ? contextFilters : localFilters;
    const setFilters = context ? setContextFilters : (newFilters) => {
        setLocalFilters(newFilters);
        saveToLocalStorage("userListFilters", newFilters);
    };
    const rowsPerPage = context ? contextRowsPerPage : localRowsPerPage;
    const setRowsPerPage = context ? setContextRowsPerPage : (rows) => {
        setLocalRowsPerPage(rows);
        saveToLocalStorage("userListRowsPerPage", rows);
    };
    const sortBy = context ? contextSortBy : localSortBy;
    const setSortBy = context ? setContextSortBy : (newSort) => {
        setLocalSortBy(newSort);
        saveToLocalStorage("userListSortBy", newSort);
    };
    const resetState = context ? contextResetState : () => {
        setLocalUsers([]);
        setLocalCachedUsers({});
        setLocalPagination({});
        setLocalDemographics({
            total_users: null,
            total_students: null,
            total_admins: null,
            total_professors: null,
            total_active: null,
            total_inactive: null,
        });
        setLocalFilters({ search: "", roles: [], statuses: [] });
        setLocalRowsPerPage(10);
        setLocalSortBy(null);
        localStorage.removeItem("userListUsers");
        localStorage.removeItem("userListCachedUsers");
        localStorage.removeItem("userListPagination");
        localStorage.removeItem("userListDemographics");
        localStorage.removeItem("userListFilters");
        localStorage.removeItem("userListRowsPerPage");
        localStorage.removeItem("userListSortBy");
    };

    const [loading, setLoading] = useState(false);
    const [demographicLoading, setDemographicLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [userToArchive, setUserToArchive] = useState(null);
    const [userToActivate, setUserToActivate] = useState(null);

    const roleOptions = [
        { value: "admin", label: "Admin", type: "role" },
        { value: "student", label: "Student", type: "role" },
        { value: "professor", label: "Professor", type: "role" },
    ];

    const statusOptions = [
        { value: "Activated", label: "Activated", type: "status" },
        { value: "Deactivated", label: "Deactivated", type: "status" },
    ];

    const rowsOptions = [
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
    ];

    const columns = [
        {
            Header: "ID",
            accessor: "id",
            sortable: true,
            Cell: ({ value }) => value,
        },
        {
            Header: "Avatar",
            accessor: "avatar",
            Cell: ({ row }) =>
                row.profile?.avatar ? (
                    <img
                        src={`http://localhost:8000/storage/${row.profile.avatar}`}
                        alt="User avatar"
                        className={styles.avatar}
                    />
                ) : (
                    <FaUserCircle className={styles.avatarFallback} />
                ),
        },
        {
            Header: "Name",
            accessor: "name",
            sortable: true,
            Cell: ({ row }) =>
                row.profile?.first_name && row.profile?.last_name
                    ? `${row.profile.first_name} ${row.profile.last_name}`
                    : "N/A",
        },
        {
            Header: "Email",
            accessor: "email",
            sortable: true,
            Cell: ({ value }) => value || "N/A",
        },
        {
            Header: "Role",
            accessor: "role",
            sortable: true,
            Cell: ({ value }) => value || "N/A",
        },
        {
            Header: "Registration",
            accessor: "email_verified_at",
            sortable: true,
            Cell: ({ value }) => (value ? "Verified" : "Not Verified"),
        },
        {
            Header: "Status",
            accessor: "status",
            sortable: true,
            Cell: ({ value }) => {
                const statusStyle = {
                    fontWeight: "bold",
                    color:
                        value === "Activated"
                            ? "green"
                            : value === "Deactivated"
                            ? "red"
                            : "inherit",
                };
                return <span style={statusStyle}>{value || "N/A"}</span>;
            },
        },
        {
            Header: "Action",
            accessor: "action",
            Cell: ({ row }) => (
                <div className={styles.actionColumn}>
                    <span className={styles.tooltipWrapper}>
                        <button
                            onClick={() => viewProfile(row.id)}
                            className={styles.actionBtn}
                            aria-label="View Profile"
                        >
                            <IoIosEye />
                        </button>
                        <span className={styles.tooltip}>View Profile</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                        <button
                            onClick={() => editUser(row.id)}
                            className={styles.actionBtn}
                            aria-label="Edit User"
                        >
                            <IoIosCreate />
                        </button>
                        <span className={styles.tooltip}>Edit User</span>
                    </span>
                    {row.status === "Activated" ? (
                        <span className={styles.tooltipWrapper}>
                            <button
                                onClick={() => openArchiveModal(row)}
                                className={styles.actionBtn}
                                aria-label="Deactivate User"
                            >
                                <IoIosArchive />
                            </button>
                            <span className={styles.tooltip}>
                                Deactivate User
                            </span>
                        </span>
                    ) : (
                        <span className={styles.tooltipWrapper}>
                            <button
                                onClick={() => openActivateModal(row)}
                                className={styles.actionBtn}
                                aria-label="Activate User"
                            >
                                <IoIosRefresh />
                            </button>
                            <span className={styles.tooltip}>
                                Activate User
                            </span>
                        </span>
                    )}
                </div>
            ),
        },
    ];

    const fetchDemographics = useCallback(async () => {
        if (demographics.total_users !== null) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found for demographics fetch.");
            addNotification("error", "Please log in to view demographic data.");
            navigate("/login");
            return;
        }

        setDemographicLoading(true);
        try {
            const response = await axios.get(`/api/users/demographics`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const newDemographics = {
                total_users: response.data.total_users || 0,
                total_students: response.data.total_students || 0,
                total_admins: response.data.total_admins || 0,
                total_professors: response.data.total_professors || 0,
                total_active: response.data.total_active || 0,
                total_inactive: response.data.total_inactive || 0,
            };
            setDemographics(newDemographics);
            if (!context) saveToLocalStorage("userListDemographics", newDemographics);
        } catch (err) {
            console.error("Demographics error:", err.response?.status, err.message);
            addNotification("error", `Failed to fetch demographic data: ${err.message}`);
            setDemographics({
                total_users: 0,
                total_students: 0,
                total_admins: 0,
                total_professors: 0,
                total_active: 0,
                total_inactive: 0,
            });
        } finally {
            setDemographicLoading(false);
        }
    }, [addNotification, navigate, demographics.total_users, setDemographics, context]);

    const fetchUsers = useCallback(
        async (page = 1, filtersArg = filters, rows = rowsPerPage, sort = sortBy) => {
            const cacheKey = `${page}-${rows}-${JSON.stringify(filtersArg)}-${JSON.stringify(sort)}`;
            if (cachedUsers[cacheKey]) {
                setUsers(cachedUsers[cacheKey].data);
                setPagination(cachedUsers[cacheKey].pagination);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/users`, {
                    params: {
                        page: page || 1,
                        role: filtersArg.roles,
                        status: filtersArg.statuses,
                        search: filtersArg.search,
                        rows,
                        sort_by: sort?.field,
                        sort_direction: sort?.direction,
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const newUsers = response.data.data || [];
                const newPagination = response.data.meta?.pagination || {};
                setUsers(newUsers);
                setPagination(newPagination);
                setCachedUsers((prev) => {
                    const newCache = {
                        ...prev,
                        [cacheKey]: { data: newUsers, pagination: newPagination },
                    };
                    const keys = Object.keys(newCache);
                    if (keys.length > 5) delete newCache[keys[0]]; // Limit cache to 5 pages
                    if (!context) saveToLocalStorage("userListCachedUsers", newCache);
                    return newCache;
                });
                if (!context) {
                    saveToLocalStorage("userListUsers", newUsers);
                    saveToLocalStorage("userListPagination", newPagination);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    addNotification("error", "You are not authorized. Please log in.");
                    navigate("/login");
                } else {
                    addNotification("error", "Something went wrong while fetching users");
                }
            } finally {
                setLoading(false);
            }
        },
        [addNotification, navigate, cachedUsers, rowsPerPage, sortBy, setUsers, setPagination, setCachedUsers, filters, context]
    );

    const handlePageChange = (page) => {
        fetchUsers(page);
    };

    const handleSort = useCallback(
        (sort) => {
            setSortBy(sort);
            setCachedUsers({});
            if (!context) saveToLocalStorage("userListCachedUsers", {});
            fetchUsers(1, filters, rowsPerPage, sort);
        },
        [fetchUsers, filters, rowsPerPage, setSortBy, setCachedUsers, context]
    );

    const archiveUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            addNotification("error", "No authentication token found. Please log in.");
            navigate("/login");
            return;
        }
        if (!userToArchive?.id) {
            addNotification("error", "Invalid user data for deactivation");
            setShowModal(false);
            return;
        }
        try {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userToArchive.id ? { ...user, status: "Deactivated" } : user
                )
            );
            setCachedUsers((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: newCache[key].data.map((user) =>
                            user.id === userToArchive.id ? { ...user, status: "Deactivated" } : user
                        ),
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_active: prev.total_active - 1,
                total_inactive: prev.total_inactive + 1,
            }));
            setShowModal(false);
            setUserToArchive(null);
            setUserToActivate(null);

            await axios.put(
                `/api/users/${userToArchive.id}/deactivate`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!context) {
                saveToLocalStorage("userListUsers", users);
                saveToLocalStorage("userListCachedUsers", cachedUsers);
                saveToLocalStorage("userListDemographics", demographics);
            }

            addNotification("success", "User deactivated successfully!");
        } catch (err) {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userToArchive.id ? { ...user, status: "Activated" } : user
                )
            );
            setCachedUsers((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: newCache[key].data.map((user) =>
                            user.id === userToArchive.id ? { ...user, status: "Activated" } : user
                        ),
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_active: prev.total_active + 1,
                total_inactive: prev.total_inactive - 1,
            }));

            if (!context) {
                saveToLocalStorage("userListUsers", users);
                saveToLocalStorage("userListCachedUsers", cachedUsers);
                saveToLocalStorage("userListDemographics", demographics);
            }

            console.error("archiveUser error:", err);
            addNotification("error", "Failed to deactivate user");
        }
    };

    const activateUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            addNotification("error", "No authentication token found. Please log in.");
            navigate("/login");
            return;
        }
        if (!userToActivate?.id) {
            addNotification("error", "Invalid user data for activation");
            setShowModal(false);
            return;
        }
        try {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userToActivate.id ? { ...user, status: "Activated" } : user
                )
            );
            setCachedUsers((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: newCache[key].data.map((user) =>
                            user.id === userToActivate.id ? { ...user, status: "Activated" } : user
                        ),
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_active: prev.total_active + 1,
                total_inactive: prev.total_inactive - 1,
            }));
            setShowModal(false);
            setUserToArchive(null);
            setUserToActivate(null);

            await axios.put(
                `/api/users/${userToActivate.id}/activate`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!context) {
                saveToLocalStorage("userListUsers", users);
                saveToLocalStorage("userListCachedUsers", cachedUsers);
                saveToLocalStorage("userListDemographics", demographics);
            }

            addNotification("success", "User activated successfully!");
        } catch (err) {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userToActivate.id ? { ...user, status: "Deactivated" } : user
                )
            );
            setCachedUsers((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: newCache[key].data.map((user) =>
                            user.id === userToActivate.id ? { ...user, status: "Deactivated" } : user
                        ),
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_active: prev.total_active - 1,
                total_inactive: prev.total_inactive + 1,
            }));

            if (!context) {
                saveToLocalStorage("userListUsers", users);
                saveToLocalStorage("userListCachedUsers", cachedUsers);
                saveToLocalStorage("userListDemographics", demographics);
            }

            console.error("activateUser error:", err);
            addNotification("error", "Failed to activate user");
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
        navigate(`/admin/users/${userId}`);
    };

    const editUser = (userId) => {
        navigate(`/admin/users/${userId}/edit`);
    };

    const handleFilterChange = (type, values) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [type]: values };
            if (!context) saveToLocalStorage("userListFilters", newFilters);
            return newFilters;
        });
        setCachedUsers({});
        if (!context) saveToLocalStorage("userListCachedUsers", {});
    };

    const handleSearchChange = (e) => {
        setFilters((prev) => {
            const newFilters = { ...prev, search: e.target.value };
            if (!context) saveToLocalStorage("userListFilters", newFilters);
            return newFilters;
        });
        setCachedUsers({});
        if (!context) saveToLocalStorage("userListCachedUsers", {});
    };

    const handleResetFilters = () => {
        const resetFilters = { search: "", roles: [], statuses: [] };
        setFilters(resetFilters);
        setSortBy(null);
        setCachedUsers({});
        setUsers([]);
        setPagination({});
        if (!context) {
            saveToLocalStorage("userListFilters", resetFilters);
            saveToLocalStorage("userListCachedUsers", {});
            saveToLocalStorage("userListUsers", []);
            saveToLocalStorage("userListPagination", {});
            saveToLocalStorage("userListSortBy", null);
        }
        fetchUsers(1, resetFilters, rowsPerPage, null);
    };

    useEffect(() => {
        fetchDemographics();
    }, [fetchDemographics]);

    useEffect(() => {
        fetchUsers(1, filters, rowsPerPage, sortBy);
    }, [filters, rowsPerPage, sortBy, fetchUsers]);

    return (
        <div className={styles.userListContainer}>
            <div className={styles.headerContainer}>
                <h2>User Management</h2>
                    <Button variant="secondary-form" to="/admin/users/create">
                        <IoIosAddCircleOutline />
                        Add a new user
                    </Button>
            </div>

            <div className={styles.demographicContainer}>
                <Card
                    title="Users"
                    value={demographics.total_users}
                    icon={IoIosPeople}
                    isLoading={demographicLoading}
                    description="Current total of users"
                />
                <Card
                    title="Admins"
                    value={demographics.total_admins}
                    icon={IoIosPerson}
                    isLoading={demographicLoading}
                    description="Current total of admins"
                />
                <Card
                    title="Professors"
                    value={demographics.total_professors}
                    icon={IoIosPerson}
                    isLoading={demographicLoading}
                    description="Current total of professors"
                />
                <Card
                    title="Students"
                    value={demographics.total_students}
                    icon={IoIosPerson}
                    isLoading={demographicLoading}
                    description="Current total of students"
                />
                <Card
                    title="Active"
                    value={demographics.total_active}
                    icon={IoIosCheckmarkCircle}
                    isLoading={demographicLoading}
                    description="Current active users"
                />
                <Card
                    title="Inactive"
                    value={demographics.total_inactive}
                    icon={IoIosPause}
                    isLoading={demographicLoading}
                    description="Current inactive users"
                />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.filterContainer}>
                <div className={styles.col}>
                    <h3>Filters</h3>
                    <div className={styles.row}>
                        <Input
                            type="text"
                            id="search"
                            value={filters.search}
                            onChange={handleSearchChange}
                            placeholder="Search users..."
                            className={styles.searchInput}
                        />
                        <CustomSelect
                            options={roleOptions}
                            value={filters.roles}
                            onChange={(values) => handleFilterChange("roles", values)}
                            isMulti
                            placeholder="Select roles"
                        />
                        <CustomSelect
                            options={statusOptions}
                            value={filters.statuses}
                            onChange={(values) => handleFilterChange("statuses", values)}
                            isMulti
                            placeholder="Select statuses"
                        />
                        <button onClick={handleResetFilters} className={styles.resetBtn}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <h3>User List</h3>
                <Table
                    columns={columns}
                    data={users}
                    loading={loading}
                    noDataMessage="No users found."
                    sortBy={sortBy}
                    onSort={handleSort}
                />
            </div>

            <div className={styles.pagination}>
                <div className={styles.paginationRows}>
                    <span>Rows per page:</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCachedUsers({});
                            if (!context) saveToLocalStorage("userListCachedUsers", {});
                            if (!context) saveToLocalStorage("userListRowsPerPage", Number(e.target.value));
                        }}
                        className={styles.rowSelection}
                    >
                        {rowsOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <span className={styles.paginationInfo}>
                    {pagination.current_page && pagination.per_page && pagination.total
                        ? `${(pagination.current_page - 1) * pagination.per_page + 1}–${
                              pagination.current_page * pagination.per_page > pagination.total
                                  ? pagination.total
                                  : pagination.current_page * pagination.per_page
                          } of ${pagination.total}`
                        : "1–1 of 1"}
                </span>
                <div className={styles.paginationButtons}>
                    <button
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        className={styles.paginationButton}
                        disabled={pagination.current_page <= 1}
                    >
                        <IoIosArrowBack />
                    </button>
                    <button
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        className={styles.paginationButton}
                        disabled={
                            pagination.current_page >= pagination.total_pages ||
                            !pagination.total_pages
                        }
                    >
                        <IoIosArrowForward />
                    </button>
                </div>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Confirm Action</h2>
                        {userToActivate ? (
                            <p>
                                Are you sure you want to activate this user{" "}
                                <strong>
                                    {userToActivate?.profile?.first_name}{" "}
                                    {userToActivate?.profile?.last_name}
                                </strong>
                                ?
                            </p>
                        ) : (
                            <p>
                                Are you sure you want to deactivate this user{" "}
                                <strong>
                                    {userToArchive?.profile?.first_name}{" "}
                                    {userToArchive?.profile?.last_name}
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