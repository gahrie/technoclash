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
import styles from "./ProblemList.module.scss";
import { ProblemListContext } from "../../context/ProblemListContext";

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

const ProblemList = () => {
    const navigate = useNavigate();
    const { addNotification } = useOutletContext();
    const context = useContext(ProblemListContext);

    if (!context) {
        console.error("ProblemListContext is undefined. Ensure ProblemList is wrapped in ProblemListProvider.");
    }

    // Use context if available, otherwise fallback to local state
    const {
        problems: contextProblems,
        setProblems: setContextProblems,
        cachedProblems: contextCachedProblems,
        setCachedProblems: setContextCachedProblems,
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
    const [localProblems, setLocalProblems] = useState(loadFromLocalStorage("problemListProblems", []));
    const [localCachedProblems, setLocalCachedProblems] = useState(loadFromLocalStorage("problemListCachedProblems", {}));
    const [localPagination, setLocalPagination] = useState(loadFromLocalStorage("problemListPagination", {}));
    const [localDemographics, setLocalDemographics] = useState(
        loadFromLocalStorage("problemListDemographics", {
            total_problems: null,
            total_easy: null,
            total_medium: null,
            total_hard: null,
            total_active: null,
            total_inactive: null,
        })
    );
    const [localFilters, setLocalFilters] = useState(
        loadFromLocalStorage("problemListFilters", {
            search: "",
            difficulties: [],
            statuses: [],
        })
    );
    const [localRowsPerPage, setLocalRowsPerPage] = useState(loadFromLocalStorage("problemListRowsPerPage", 10));
    const [localSortBy, setLocalSortBy] = useState(loadFromLocalStorage("problemListSortBy", null));

    // Use context if available, else local state
    const problems = context ? contextProblems : localProblems;
    const setProblems = context ? setContextProblems : (newProblems) => {
        setLocalProblems(newProblems);
        saveToLocalStorage("problemListProblems", newProblems);
    };
    const cachedProblems = context ? contextCachedProblems : localCachedProblems;
    const setCachedProblems = context ? setContextCachedProblems : (newCache) => {
        setLocalCachedProblems(newCache);
        saveToLocalStorage("problemListCachedProblems", newCache);
    };
    const pagination = context ? contextPagination : localPagination;
    const setPagination = context ? setContextPagination : (newPagination) => {
        setLocalPagination(newPagination);
        saveToLocalStorage("problemListPagination", newPagination);
    };
    const demographics = context ? contextDemographics : localDemographics;
    const setDemographics = context ? setContextDemographics : (newDemographics) => {
        setLocalDemographics(newDemographics);
        saveToLocalStorage("problemListDemographics", newDemographics);
    };
    const filters = context ? contextFilters : localFilters;
    const setFilters = context ? setContextFilters : (newFilters) => {
        setLocalFilters(newFilters);
        saveToLocalStorage("problemListFilters", newFilters);
    };
    const rowsPerPage = context ? contextRowsPerPage : localRowsPerPage;
    const setRowsPerPage = context ? setContextRowsPerPage : (rows) => {
        setLocalRowsPerPage(rows);
        saveToLocalStorage("problemListRowsPerPage", rows);
    };
    const sortBy = context ? contextSortBy : localSortBy;
    const setSortBy = context ? setContextSortBy : (newSort) => {
        setLocalSortBy(newSort);
        saveToLocalStorage("problemListSortBy", newSort);
    };
    const resetState = context ? contextResetState : () => {
        setLocalProblems([]);
        setLocalCachedProblems({});
        setLocalPagination({});
        setLocalDemographics({
            total_problems: null,
            total_easy: null,
            total_medium: null,
            total_hard: null,
            total_active: null,
            total_inactive: null,
        });
        setLocalFilters({ search: "", difficulties: [], statuses: [] });
        setLocalRowsPerPage(10);
        setLocalSortBy(null);
        localStorage.removeItem("problemListProblems");
        localStorage.removeItem("problemListCachedProblems");
        localStorage.removeItem("problemListPagination");
        localStorage.removeItem("problemListDemographics");
        localStorage.removeItem("problemListFilters");
        localStorage.removeItem("problemListRowsPerPage");
        localStorage.removeItem("problemListSortBy");
    };

    const [loading, setLoading] = useState(false);
    const [demographicLoading, setDemographicLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [problemToDelete, setProblemToDelete] = useState(null);

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
                            onClick={() => viewProblem(row.id)}
                            className={styles.actionBtn}
                            aria-label="View Problem"
                        >
                            <IoIosEye />
                        </button>
                        <span className={styles.tooltip}>View Problem</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                        <button
                            onClick={() => editProblem(row.id)}
                            className={styles.actionBtn}
                            aria-label="Edit Problem"
                        >
                            <IoIosCreate />
                        </button>
                        <span className={styles.tooltip}>Edit Problem</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                        <button
                            onClick={() => openDeleteModal(row)}
                            className={styles.actionBtn}
                            aria-label="Delete Problem"
                        >
                            <IoIosTrash />
                        </button>
                        <span className={styles.tooltip}>Delete Problem</span>
                    </span>
                </div>
            ),
        },
    ];

    const fetchDemographics = useCallback(async () => {
        // Skip if demographics already loaded
        if (demographics.total_problems !== null) {
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
            const response = await axios.get(`/api/problems/demographics`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }); 
            const newDemographics = {
                total_problems: response.data.total_problems || 0,
                total_easy: response.data.total_easy || 0,
                total_medium: response.data.total_medium || 0,
                total_hard: response.data.total_hard || 0,
                total_active: response.data.total_active || 0,
                total_inactive: response.data.total_inactive || 0,
            };
            setDemographics(newDemographics);
            if (!context) saveToLocalStorage("problemListDemographics", newDemographics);
        } catch (err) {
            console.error("Demographics error:", err.response?.status, err.message);
            addNotification("error", `Failed to fetch demographic data: ${err.message}`);
            setDemographics({
                total_problems: 0,
                total_easy: 0,
                total_medium: 0,
                total_hard: 0,
                total_active: 0,
                total_inactive: 0,
            });
        } finally {
            setDemographicLoading(false);
        }
    }, [addNotification, navigate, demographics.total_problems, setDemographics, context]);

    const fetchProblems = useCallback(
        async (page = 1, filtersArg = filters, rows = rowsPerPage, sort = sortBy) => {
            const cacheKey = `${page}-${rows}-${JSON.stringify(filtersArg)}-${JSON.stringify(sort)}`;
            if (cachedProblems[cacheKey]) {
                setProblems(cachedProblems[cacheKey].data);
                setPagination(cachedProblems[cacheKey].pagination);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/problems`, {
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
                const newProblems = response.data.data || [];
                const newPagination = response.data.meta?.pagination || {};
                setProblems(newProblems);
                setPagination(newPagination);
                setCachedProblems((prev) => {
                    const newCache = {
                        ...prev,
                        [cacheKey]: { data: newProblems, pagination: newPagination },
                    };
                    const keys = Object.keys(newCache);
                    if (keys.length > 5) delete newCache[keys[0]]; // Limit cache to 5 pages
                    if (!context) saveToLocalStorage("problemListCachedProblems", newCache);
                    return newCache;
                });
                if (!context) {
                    saveToLocalStorage("problemListProblems", newProblems);
                    saveToLocalStorage("problemListPagination", newPagination);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    addNotification("error", "You are not authorized. Please log in.");
                    navigate("/login");
                } else {
                    addNotification("error", "Something went wrong while fetching problems");
                }
            } finally {
                setLoading(false);
            }
        },
        [cachedProblems, rowsPerPage, sortBy, setProblems, setPagination, setCachedProblems, filters, addNotification, navigate, context]
    );

    const handlePageChange = (page) => {
        fetchProblems(page);
    };

    const handleSort = useCallback(
        (sort) => {
            setSortBy(sort);
            setCachedProblems({});
            if (!context) saveToLocalStorage("problemListCachedProblems", {});
            fetchProblems(1, filters, rowsPerPage, sort);
        },
        [fetchProblems, filters, rowsPerPage, setSortBy, setCachedProblems, context]
    );

    const deleteProblem = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            addNotification("error", "No authentication token found. Please log in.");
            navigate("/login");
            return;
        }
        if (!problemToDelete?.id) {
            addNotification("error", "Invalid problem data for deletion");
            setShowModal(false);
            return;
        }
        try {
            setProblems((prev) => prev.filter((problem) => problem.id !== problemToDelete.id));
            setCachedProblems((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: newCache[key].data.filter((problem) => problem.id !== problemToDelete.id),
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_problems: prev.total_problems - 1,
                [`total_${problemToDelete.difficulty}`]: prev[`total_${problemToDelete.difficulty}`] - 1,
                [problemToDelete.status === "active" ? "total_active" : "total_inactive"]:
                    prev[problemToDelete.status === "active" ? "total_active" : "total_inactive"] - 1,
            }));

            await axios.delete(`/api/problems/${problemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setShowModal(false);
            setProblemToDelete(null);
            addNotification("success", "Problem deleted successfully!");

            if (!context) {
                saveToLocalStorage("problemListProblems", problems);
                saveToLocalStorage("problemListCachedProblems", cachedProblems);
                saveToLocalStorage("problemListDemographics", demographics);
            }

            fetchDemographics(); // Refresh demographics for accuracy
        } catch (err) {
            setProblems((prev) => [...prev, problemToDelete]);
            setCachedProblems((prevCache) => {
                const newCache = { ...prevCache };
                Object.keys(newCache).forEach((key) => {
                    newCache[key] = {
                        ...newCache[key],
                        data: [...newCache[key].data, problemToDelete],
                    };
                });
                return newCache;
            });
            setDemographics((prev) => ({
                ...prev,
                total_problems: prev.total_problems + 1,
                [`total_${problemToDelete.difficulty}`]: prev[`total_${problemToDelete.difficulty}`] + 1,
                [problemToDelete.status === "active" ? "total_active" : "total_inactive"]:
                    prev[problemToDelete.status === "active" ? "total_active" : "total_inactive"] + 1,
            }));

            if (!context) {
                saveToLocalStorage("problemListProblems", problems);
                saveToLocalStorage("problemListCachedProblems", cachedProblems);
                saveToLocalStorage("problemListDemographics", demographics);
            }

            addNotification("error", "Failed to delete problem");
        }
    };

    const openDeleteModal = (problem) => {
        setProblemToDelete(problem);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setProblemToDelete(null);
    };

    const viewProblem = (problemId) => {
        navigate(`/admin/problems/${problemId}`);
    };

    const editProblem = (problemId) => {
        navigate(`/admin/problems/${problemId}/edit`);
    };

    const handleFilterChange = (type, values) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [type]: values };
            if (!context) saveToLocalStorage("problemListFilters", newFilters);
            return newFilters;
        });
        setCachedProblems({});
        if (!context) saveToLocalStorage("problemListCachedProblems", {});
    };

    const handleSearchChange = (e) => {
        setFilters((prev) => {
            const newFilters = { ...prev, search: e.target.value };
            if (!context) saveToLocalStorage("problemListFilters", newFilters);
            return newFilters;
        });
        setCachedProblems({});
        if (!context) saveToLocalStorage("problemListCachedProblems", {});
    };

    const handleResetFilters = () => {
        const resetFilters = { search: "", difficulties: [], statuses: [] };
        setFilters(resetFilters);
        setSortBy(null);
        setCachedProblems({});
        setProblems([]);
        setPagination({});
        if (!context) {
            saveToLocalStorage("problemListFilters", resetFilters);
            saveToLocalStorage("problemListCachedProblems", {});
            saveToLocalStorage("problemListProblems", []);
            saveToLocalStorage("problemListPagination", {});
            saveToLocalStorage("problemListSortBy", null);
        }
        fetchProblems(1, resetFilters, rowsPerPage, null);
    };

    useEffect(() => {
        fetchDemographics();
    }, [fetchDemographics]);

    useEffect(() => {
        fetchProblems(1, filters, rowsPerPage, sortBy);
    }, [filters, rowsPerPage, sortBy, fetchProblems]);

    return (
        <div className={styles.problemListContainer}>
            <div className={styles.headerContainer}>
                <h2>Problem Management</h2>
                <Button variant="secondary-form" to="/admin/problems/create">
                    <IoIosAddCircleOutline />
                    Create Problem
                </Button>
            </div>

            <div className={styles.demographicContainer}>
                <Card
                    title="Problems"
                    value={demographics.total_problems}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of problems"
                />
                <Card
                    title="Easy"
                    value={demographics.total_easy}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of easy problems"
                />
                <Card
                    title="Medium"
                    value={demographics.total_medium}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of medium problems"
                />
                <Card
                    title="Hard"
                    value={demographics.total_hard}
                    icon={IoIosList}
                    isLoading={demographicLoading}
                    description="Current total of hard problems"
                />
                <Card
                    title="Active"
                    value={demographics.total_active}
                    icon={IoIosCheckmarkCircle}
                    isLoading={demographicLoading}
                    description="Current active problems"
                />
                <Card
                    title="Inactive"
                    value={demographics.total_inactive}
                    icon={IoIosPause}
                    isLoading={demographicLoading}
                    description="Current inactive problems"
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
                            placeholder="Search problems..."
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
                <h3>Problem List</h3>
                <Table
                    columns={columns}
                    data={problems}
                    loading={loading}
                    noDataMessage="No problems found."
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
                            setCachedProblems({});
                            if (!context) saveToLocalStorage("problemListCachedProblems", {});
                            if (!context) saveToLocalStorage("problemListRowsPerPage", Number(e.target.value));
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
                        ? `${(pagination.current_page - 1) * pagination.per_page + 1}–${pagination.current_page * pagination.per_page > pagination.total ? pagination.total : pagination.current_page * pagination.per_page} of ${pagination.total}`
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
                        disabled={pagination.current_page >= pagination.total_pages || !pagination.total_pages}
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
                            Are you sure you want to delete the problem <strong>{problemToDelete?.title}</strong>?
                        </p>
                        <div className={styles.modalButtons}>
                            <button onClick={deleteProblem} className={styles.confirmBtn}>
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

export default ProblemList;