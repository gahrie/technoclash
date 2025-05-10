import React, { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
    IoIosArrowBack,
    IoIosArrowForward,
    IoIosEye,
    IoIosCreate,
    IoIosTrash,
    IoIosAddCircleOutline,
    IoIosList,
    IoIosCheckmarkCircle,
    IoIosPause,
} from "react-icons/io";
import CustomSelect from "../../components/ui/CustomSelect";
import Input from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import styles from "./ChallengeList.module.scss";
import { ChallengeListContext } from "../../context/ChallengeListContext"; // Adjust path

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

const ChallengeList = () => {
    const navigate = useNavigate();
    const { addNotification } = useOutletContext();
    const context = useContext(ChallengeListContext);

    if (!context) {
        console.error("ChallengeListContext is undefined. Ensure ChallengeList is wrapped in ChallengeListProvider.");
    }

    // Use context if available, otherwise fallback to local state
    const {
        challenges: contextChallenges,
        setChallenges: setContextChallenges,
        cachedChallenges: contextCachedChallenges,
        setCachedChallenges: setContextCachedChallenges,
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
    const [localChallenges, setLocalChallenges] = useState(loadFromLocalStorage("challengeListChallenges", []));
    const [localCachedChallenges, setLocalCachedChallenges] = useState(loadFromLocalStorage("challengeListCachedChallenges", {}));
    const [localPagination, setLocalPagination] = useState(loadFromLocalStorage("challengeListPagination", {}));
    const [localDemographics, setLocalDemographics] = useState(
        loadFromLocalStorage("challengeListDemographics", {
            total_challenges: null,
            total_easy: null,
            total_medium: null,
            total_hard: null,
            total_active: null,
            total_inactive: null,
        })
    );
    const [localFilters, setLocalFilters] = useState(
        loadFromLocalStorage("challengeListFilters", {
            search: "",
            difficulties: [],
            statuses: [],
        })
    );
    const [localRowsPerPage, setLocalRowsPerPage] = useState(loadFromLocalStorage("challengeListRowsPerPage", 10));
    const [localSortBy, setLocalSortBy] = useState(loadFromLocalStorage("challengeListSortBy", null));

    // Use context if available, else local state
    const challenges = context ? contextChallenges : localChallenges;
    const setChallenges = context ? setContextChallenges : (newChallenges) => {
        setLocalChallenges(newChallenges);
        saveToLocalStorage("challengeListChallenges", newChallenges);
    };
    const cachedChallenges = context ? contextCachedChallenges : localCachedChallenges;
    const setCachedChallenges = context ? setContextCachedChallenges : (newCache) => {
        setLocalCachedChallenges(newCache);
        saveToLocalStorage("challengeListCachedChallenges", newCache);
    };
    const pagination = context ? contextPagination : localPagination;
    const setPagination = context ? setContextPagination : (newPagination) => {
        setLocalPagination(newPagination);
        saveToLocalStorage("challengeListPagination", newPagination);
    };
    const demographics = context ? contextDemographics : localDemographics;
    const setDemographics = context ? setContextDemographics : (newDemographics) => {
        setLocalDemographics(newDemographics);
        saveToLocalStorage("challengeListDemographics", newDemographics);
    };
    const filters = context ? contextFilters : localFilters;
    const setFilters = context ? setContextFilters : (newFilters) => {
        setLocalFilters(newFilters);
        saveToLocalStorage("challengeListFilters", newFilters);
    };
    const rowsPerPage = context ? contextRowsPerPage : localRowsPerPage;
    const setRowsPerPage = context ? setContextRowsPerPage : (rows) => {
        setLocalRowsPerPage(rows);
        saveToLocalStorage("challengeListRowsPerPage", rows);
    };
    const sortBy = context ? contextSortBy : localSortBy;
    const setSortBy = context ? setContextSortBy : (newSort) => {
        setLocalSortBy(newSort);
        saveToLocalStorage("challengeListSortBy", newSort);
    };
    const resetState = context ? contextResetState : () => {
        setLocalChallenges([]);
        setLocalCachedChallenges({});
        setLocalPagination({});
        setLocalDemographics({
            total_challenges: null,
            total_easy: null,
            total_medium: null,
            total_hard: null,
            total_active: null,
            total_inactive: null,
        });
        setLocalFilters({ search: "", difficulties: [], statuses: [] });
        setLocalRowsPerPage(10);
        setLocalSortBy(null);
        localStorage.removeItem("challengeListChallenges");
        localStorage.removeItem("challengeListCachedChallenges");
        localStorage.removeItem("challengeListPagination");
        localStorage.removeItem("challengeListDemographics");
        localStorage.removeItem("challengeListFilters");
        localStorage.removeItem("challengeListRowsPerPage");
        localStorage.removeItem("challengeListSortBy");
    };

    const [loading, setLoading] = useState(false);
    const [demographicLoading, setDemographicLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [challengeToDelete, setChallengeToDelete] = useState(null);

    const difficultyOptions = [
        { value: "easy", label: "Easy", type: "difficulty" },
        { value: "medium", label: "Medium", type: "difficulty" },
        { value: "hard", label: "Hard", type: "difficulty" },
    ];

    const statusOptions = [
        { value: "active", label: "Active", type: "status" },
        { value: "archived", label: "Archived", type: "status" },
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
            Header: "Title",
            accessor: "title",
            sortable: true,
            Cell: ({ value }) => value || "N/A",
        },
        {
            Header: "Created By",
            accessor: "user",
            sortable: true,
            Cell: ({ value }) =>
                value?.profile?.first_name && value?.profile?.last_name
                    ? `${value.profile.first_name} ${value.profile.last_name}`
                    : "N/A",
        },
        {
            Header: "Difficulty",
            accessor: "difficulty",
            sortable: true,
            Cell: ({ value }) => value || "N/A",
        },
        {
            Header: "Status",
            accessor: "status",
            sortable: true,
            Cell: ({ value }) => {
                const statusStyle = {
                    fontWeight: "bold",
                    color: value === "active" ? "green" : value === "archived" ? "red" : "inherit",
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
                            onClick={() => viewChallenge(row.id)}
                            className={styles.actionBtn}
                            aria-label="View Challenge"
                        >
                            <IoIosEye />
                        </button>
                        <span className={styles.tooltip}>View Challenge</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                        <button
                            onClick={() => editChallenge(row.id)}
                            className={styles.actionBtn}
                            aria-label="Edit Challenge"
                        >
                            <IoIosCreate />
                        </button>
                        <span className={styles.tooltip}>Edit Challenge</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                        <button
                            onClick={() => openDeleteModal(row)}
                            className={styles.actionBtn}
                            aria-label="Delete Challenge"
                        >
                            <IoIosTrash />
                        </button>
                        <span className={styles.tooltip}>Delete Challenge</span>
                    </span>
                </div>
            ),
        },
    ];

    const fetchDemographics = useCallback(async () => {
        // Skip if demographics already loaded
        if (demographics.total_challenges !== null) {
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
            const response = await axios.get(`/api/challenges/demographics`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }); 
            const newDemographics = {
                total_challenges: response.data.total_challenges || 0,
                total_easy: response.data.total_easy || 0,
                total_medium: response.data.total_medium || 0,
                total_hard: response.data.total_hard || 0,
                total_active: response.data.total_active || 0,
                total_inactive: response.data.total_inactive || 0,
            };
            setDemographics(newDemographics);
            if (!context) saveToLocalStorage("challengeListDemographics", newDemographics);
        } catch (err) {
            console.error("Demographics error:", err.response?.status, err.message);
            addNotification("error", `Failed to fetch demographic data: ${err.message}`);
            // Optionally reset demographics to default on error
            setDemographics({
                total_challenges: 0,
                total_easy: 0,
                total_medium: 0,
                total_hard: 0,
                total_active: 0,
                total_inactive: 0,
            });
        } finally {
            setDemographicLoading(false);
        }
    }, [addNotification, navigate, demographics.total_challenges, setDemographics, context]);

    const fetchChallenges = useCallback(
        async (page = 1, filtersArg = filters, rows = rowsPerPage, sort = sortBy) => {
            const cacheKey = `${page}-${rows}-${JSON.stringify(filtersArg)}-${JSON.stringify(sort)}`;
            if (cachedChallenges[cacheKey]) {
                setChallenges(cachedChallenges[cacheKey].data);
                setPagination(cachedChallenges[cacheKey].pagination);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/challenges`, {
                    params: {
                        page,
                        difficulty: filtersArg.difficulties,
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
                const newChallenges = response.data.data || [];
                const newPagination = response.data.meta?.pagination || {};
                setChallenges(newChallenges);
                setPagination(newPagination);
                setCachedChallenges((prev) => {
                    const newCache = {
                        ...prev,
                        [cacheKey]: { data: newChallenges, pagination: newPagination },
                    };
                    const keys = Object.keys(newCache);
                    if (keys.length > 5) delete newCache[keys[0]]; // Limit cache to 5 pages
                    if (!context) saveToLocalStorage("challengeListCachedChallenges", newCache);
                    return newCache;
                });
                if (!context) {
                    saveToLocalStorage("challengeListChallenges", newChallenges);
                    saveToLocalStorage("challengeListPagination", newPagination);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    addNotification("error", "You are not authorized. Please log in.");
                    navigate("/login");
                } else {
                    addNotification("error", "Something went wrong while fetching challenges");
                }
            } finally {
                setLoading(false);
            }
        },
        [cachedChallenges, rowsPerPage, sortBy, setChallenges, setPagination, setCachedChallenges, filters, addNotification, navigate, context]
    );

    const handlePageChange = (page) => {
        fetchChallenges(page);
    };

    const handleSort = useCallback(
        (sort) => {
            setSortBy(sort);
            setCachedChallenges({});
            if (!context) saveToLocalStorage("challengeListCachedChallenges", {});
            fetchChallenges(1, filters, rowsPerPage, sort);
        },
        [fetchChallenges, filters, rowsPerPage, setSortBy, setCachedChallenges, context]
    );

    const deleteChallenge = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            addNotification("error", "No authentication token found. Please log in.");
            navigate("/login");
            return;
        }
        if (!challengeToDelete?.id) {
            addNotification("error", "Invalid challenge data for deletion");
            setShowModal(false);
            return;
        }
        try {
            setChallenges((prev) => prev.filter((challenge) => challenge.id !== challengeToDelete.id));
            setCachedChallenges((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: newCache[key].data.filter((challenge) => challenge.id !== challengeToDelete.id),
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_challenges: prev.total_challenges - 1,
                [`total_${challengeToDelete.difficulty}`]: prev[`total_${challengeToDelete.difficulty}`] - 1,
                [challengeToDelete.status === "active" ? "total_active" : "total_inactive"]:
                    prev[challengeToDelete.status === "active" ? "total_active" : "total_inactive"] - 1,
            }));

            await axios.delete(`/api/challenges/${challengeToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setShowModal(false);
            setChallengeToDelete(null);
            addNotification("success", "Challenge deleted successfully!");

            if (!context) {
                saveToLocalStorage("challengeListChallenges", challenges);
                saveToLocalStorage("challengeListCachedChallenges", cachedChallenges);
                saveToLocalStorage("challengeListDemographics", demographics);
            }

            fetchDemographics(); // Refresh demographics for accuracy
        } catch (err) {
            setChallenges((prev) => [...prev, challengeToDelete]);
            setCachedChallenges((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: [...newCache[key].data, challengeToDelete],
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_challenges: prev.total_challenges + 1,
                [`total_${challengeToDelete.difficulty}`]: prev[`total_${challengeToDelete.difficulty}`] + 1,
                [challengeToDelete.status === "active" ? "total_active" : "total_inactive"]:
                    prev[challengeToDelete.status === "active" ? "total_active" : "total_inactive"] + 1,
            }));

            if (!context) {
                saveToLocalStorage("challengeListChallenges", challenges);
                saveToLocalStorage("challengeListCachedChallenges", cachedChallenges);
                saveToLocalStorage("challengeListDemographics", demographics);
            }

            addNotification("error", "Failed to delete challenge");
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

    const handleFilterChange = (type, values) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [type]: values };
            if (!context) saveToLocalStorage("challengeListFilters", newFilters);
            return newFilters;
        });
        setCachedChallenges({});
        if (!context) saveToLocalStorage("challengeListCachedChallenges", {});
    };

    const handleSearchChange = (e) => {
        setFilters((prev) => {
            const newFilters = { ...prev, search: e.target.value };
            if (!context) saveToLocalStorage("challengeListFilters", newFilters);
            return newFilters;
        });
        setCachedChallenges({});
        if (!context) saveToLocalStorage("challengeListCachedChallenges", {});
    };

    const handleResetFilters = () => {
        const resetFilters = { search: "", difficulties: [], statuses: [] };
        setFilters(resetFilters);
        setSortBy(null);
        setCachedChallenges({});
        setChallenges([]);
        setPagination({});
        if (!context) {
            saveToLocalStorage("challengeListFilters", resetFilters);
            saveToLocalStorage("challengeListCachedChallenges", {});
            saveToLocalStorage("challengeListChallenges", []);
            saveToLocalStorage("challengeListPagination", {});
            saveToLocalStorage("challengeListSortBy", null);
        }
        fetchChallenges(1, resetFilters, rowsPerPage, null);
    };

    useEffect(() => {
        fetchDemographics();
    }, [fetchDemographics]);

    useEffect(() => {
        fetchChallenges(1, filters, rowsPerPage, sortBy);
    }, [filters, rowsPerPage, sortBy, fetchChallenges]);

    return (
        <div className={styles.challengeListContainer}>
            <div className={styles.headerContainer}>
                <h2>Challenge Management</h2>
                <Button variant="secondary-form" to="/admin/challenges/create">
                    <IoIosAddCircleOutline />
                    Create Challenge
                </Button>
            </div>

            <div className={styles.demographicContainer}>
                <Card
                    title="Challenges"
                    value={demographics.total_challenges}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of challenges"
                />
                <Card
                    title="Easy"
                    value={demographics.total_easy}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of easy challenges"
                />
                <Card
                    title="Medium"
                    value={demographics.total_medium}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of medium challenges"
                />
                <Card
                    title="Hard"
                    value={demographics.total_hard}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of hard challenges"
                />
                <Card
                    title="Active"
                    value={demographics.total_active}
                    icon={IoIosCheckmarkCircle}
                    isLoading={demographicLoading}
                    description="Current active challenges"
                />
                <Card
                    title="Inactive"
                    value={demographics.total_inactive}
                    icon={IoIosPause}
                    isLoading={demographicLoading}
                    description="Current inactive challenges"
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
                            placeholder="Search challenges..."
                            className={styles.searchInput}
                        />
                        <CustomSelect
                            options={difficultyOptions}
                            value={filters.difficulties}
                            onChange={(values) => handleFilterChange("difficulties", values)}
                            isMulti
                            placeholder="Select difficulties"
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
                <h3>Challenge List</h3>
                <Table
                    columns={columns}
                    data={challenges}
                    loading={loading}
                    noDataMessage="No challenges found."
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
                            setCachedChallenges({});
                            if (!context) saveToLocalStorage("challengeListCachedChallenges", {});
                            if (!context) saveToLocalStorage("challengeListRowsPerPage", Number(e.target.value));
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
                        <h2>Confirm Deletion</h2>
                        <p>
                            Are you sure you want to delete the challenge{" "}
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