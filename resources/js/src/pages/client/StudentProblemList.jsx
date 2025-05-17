import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaCode, FaPercentage } from "react-icons/fa";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Input from "../../components/ui/Input";
import CustomSelect from "../../components/ui/CustomSelect";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import styles from "./StudentProblemList.module.scss";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const StudentProblemList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [problems, setProblems] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);
    const [progressLoading, setProgressLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        difficulties: [],
        tags: [],
        statuses: [],
    });
    const [sortBy, setSortBy] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [progressData, setProgressData] = useState({
        solved: null,
        attempted: null,
        not_attempted: null,
        total: null,
        total_submissions: null,
        avg_submissions_per_problem: null,
        avg_success_rate: null,
    });

    const difficultyOptions = [
        { value: "Easy", label: "Easy", type: "difficulty" },
        { value: "Medium", label: "Medium", type: "difficulty" },
        { value: "Hard", label: "Hard", type: "difficulty" },
    ];

    const statusOptions = [
        { value: "Solved", label: "Solved", type: "status" },
        { value: "Attempted", label: "Attempted", type: "status" },
        { value: "Not Attempted", label: "Not Attempted", type: "status" },
    ];

    const [tagOptions, setTagOptions] = useState([]);

    const rowsOptions = [
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
    ];

    const columns = [
        {
            Header: "Title",
            accessor: "title",
            sortable: true,
            Cell: ({ value, row }) => (
                <Link
                    to={`/progressive/${row.id}`}
                    className={styles.problemLink}
                >
                    {value || "N/A"}
                </Link>
            ),
        },
        {
            Header: "Difficulty",
            accessor: "difficulty",
            sortable: true,
            Cell: ({ value }) => (
                <span className={styles[value?.toLowerCase()]}>
                    {value || "N/A"}
                </span>
            ),
        },
        {
            Header: "Tags",
            accessor: "tags",
            sortable: true,
            Cell: ({ value }) => (value || []).join(", ") || "N/A",
        },
        {
            Header: "Status",
            accessor: "progress_status",
            sortable: true,
            Cell: ({ value }) => value || "Not Attempted",
        },
        {
            Header: "Submissions",
            accessor: "submission_count",
            sortable: true,
            Cell: ({ value }) => value ?? 0,
        },
        {
            Header: "Success Rate",
            accessor: "success_rate",
            sortable: true,
            Cell: ({ value }) => (value ? `${value.toFixed(1)}%` : "0%"),
        },
    ];

    // Chart data and options
    const chartData = {
        labels: ["Solved", "Attempted", "Not Attempted"],
        datasets: [
            {
                data:
                    progressData.total > 0
                        ? [
                              progressData.solved,
                              progressData.attempted,
                              progressData.not_attempted,
                          ]
                        : [0, 0, 1],
                backgroundColor: ["#e53e3e", "#ffc107", "#D3D3D3"],
            },
        ],
    };

    const chartOptions = {
        cutout: "70%",
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                titleFont: { size: 14, family: "'Inter', sans-serif" },
                bodyFont: { size: 12, family: "'Inter', sans-serif" },
                padding: 10,
                cornerRadius: 6,
                borderColor: "#4A90E2",
                borderWidth: 1,
            },
        },
        maintainAspectRatio: false,
    };

    // Fetch tags for filter options
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axios.get("/api/student/problems", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                    params: { rows: 1000 },
                });
                const allTags = [
                    ...new Set(
                        response.data.data.flatMap(
                            (problem) => problem.tags || []
                        )
                    ),
                ];
                setTagOptions(
                    allTags.map((tag) => ({
                        value: tag,
                        label: tag,
                        type: "tag",
                    }))
                );
            } catch (err) {
                console.error("Failed to fetch tags:", err);
            }
        };
        fetchTags();
    }, []);

    // Fetch progress data
    const fetchProgress = useCallback(async () => {
        setProgressLoading(true);
        try {
            const response = await axios.get("/api/student/problems/progress", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            console.log("Progress API Response:", response.data);
            setProgressData({
                solved: response.data.progress?.solved || 0,
                attempted: response.data.progress?.attempted || 0,
                not_attempted: response.data.progress?.not_attempted || 0,
                total: response.data.progress?.total || 0,
                total_submissions:
                    response.data.progress?.total_submissions || 0,
                avg_submissions_per_problem:
                    response.data.progress?.avg_submissions_per_problem || 0,
                avg_success_rate: response.data.progress?.avg_success_rate || 0,
            });
        } catch (err) {
            console.error(
                "Fetch progress error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("You are not authorized. Please log in.");
                navigate("/login");
            } else {
                setError("Something went wrong while fetching progress data");
            }
        } finally {
            setProgressLoading(false);
        }
    }, [navigate]);

    // Fetch problems
    const fetchProblems = useCallback(
        async (
            page = 1,
            filtersArg = filters,
            rows = rowsPerPage,
            sort = sortBy
        ) => {
            setLoading(true);
            setError(null);
            setProblems([]); // Reset problems to avoid stale data
            const params = {
                page,
                difficulty: filtersArg.difficulties,
                tags: filtersArg.tags,
                progress_status: filtersArg.statuses,
                search: filtersArg.search,
                sort_by: sort?.field,
                sort_direction: sort?.direction,
                rows,
            };
            console.log("Fetch problems params:", params);
            try {
                const response = await axios.get("/api/student/problems", {
                    params,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                });
                console.log("Problems API Response:", response.data);
                setProblems(response.data.data || []);
                setPagination(response.data.meta?.pagination || {});
            } catch (err) {
                console.error(
                    "Fetch problems error:",
                    err.response?.data || err.message
                );
                if (err.response?.status === 401) {
                    setError("You are not authorized. Please log in.");
                    navigate("/login");
                } else {
                    setError("Something went wrong while fetching problems");
                }
            } finally {
                setLoading(false);
            }
        },
        [navigate, filters, rowsPerPage, sortBy]
    );

    // Fetch problems and progress on mount and navigation
    useEffect(() => {
        fetchProblems(1, filters, rowsPerPage, sortBy);
        fetchProgress();
    }, [fetchProblems, fetchProgress, location.key]);

    const handlePageChange = (page) => {
        fetchProblems(page, filters, rowsPerPage, sortBy);
    };

    const handleSort = (sort) => {
        setSortBy(sort);
        fetchProblems(1, filters, rowsPerPage, sort);
    };

    const handleFilterChange = (type, values) => {
        console.log(`Filter changed: ${type}`, values);
        setFilters((prev) => {
            const newFilters = { ...prev, [type]: values || [] };
            console.log("Updated filters state:", newFilters);
            return newFilters;
        });
    };

    const handleSearchChange = (e) => {
        const searchValue = e.target.value;
        console.log("Search changed:", searchValue);
        setFilters((prev) => {
            const newFilters = { ...prev, search: searchValue };
            console.log("Updated filters state:", newFilters);
            return newFilters;
        });
    };

    const handleResetFilters = () => {
        const resetFilters = {
            search: "",
            difficulties: [],
            tags: [],
            statuses: [],
        };
        setFilters(resetFilters);
        setSortBy(null);
        fetchProblems(1, resetFilters, rowsPerPage, null);
    };

    return (
        <div className={styles.problemListContainer}>
            <div className={styles.headerContainer}>
                <h2>Problem List</h2>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.contentContainer}>
                <div className={styles.tableContainer}>
                    <div className={styles.tableContentContainer}>
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
                                        onChange={(values) =>
                                            handleFilterChange(
                                                "difficulties",
                                                values
                                            )
                                        }
                                        isMulti
                                        placeholder="Select difficulties"
                                    />
                                    <CustomSelect
                                        options={tagOptions}
                                        value={filters.tags}
                                        onChange={(values) =>
                                            handleFilterChange("tags", values)
                                        }
                                        isMulti
                                        placeholder="Select tags"
                                    />
                                    <CustomSelect
                                        options={statusOptions}
                                        value={filters.statuses}
                                        onChange={(values) =>
                                            handleFilterChange(
                                                "statuses",
                                                values
                                            )
                                        }
                                        isMulti
                                        placeholder="Select progress status"
                                    />
                                    <Button
                                        onClick={handleResetFilters}
                                        className={styles.resetBtn}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </div>
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
                                onChange={(e) =>
                                    setRowsPerPage(Number(e.target.value))
                                }
                                className={styles.rowSelection}
                            >
                                {rowsOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className={styles.paginationInfo}>
                            {pagination.current_page &&
                            pagination.per_page &&
                            pagination.total
                                ? `${
                                      (pagination.current_page - 1) *
                                          pagination.per_page +
                                      1
                                  }–${Math.min(
                                      pagination.current_page *
                                          pagination.per_page,
                                      pagination.total
                                  )} of ${pagination.total}`
                                : "1–1 of 1"}
                        </span>
                        <div className={styles.paginationButtons}>
                            <Button
                                onClick={() =>
                                    handlePageChange(
                                        pagination.current_page - 1
                                    )
                                }
                                className={styles.paginationButton}
                                disabled={pagination.current_page <= 1}
                                variant="secondary"
                            >
                                <IoIosArrowBack />
                            </Button>
                            <Button
                                onClick={() =>
                                    handlePageChange(
                                        pagination.current_page + 1
                                    )
                                }
                                className={styles.paginationButton}
                                disabled={
                                    pagination.current_page >=
                                        pagination.total_pages ||
                                    !pagination.total_pages
                                }
                                variant="secondary"
                            >
                                <IoIosArrowForward />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className={styles.chartContainer}>
                    <h3>Progress Dashboard</h3>
                    {progressLoading ? (
                        <div className={styles.progressLoading}>
                            <div className={styles.spinnerContainer}>
                                <div className={styles.spinner}></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.chartWrapper}>
                                <Doughnut
                                    data={chartData}
                                    options={chartOptions}
                                    className={styles.progressChart}
                                />
                                <div className={styles.chartLabel}>
                                    {progressData.total > 0
                                        ? `${Math.round(
                                              (progressData.solved /
                                                  progressData.total) *
                                                  100
                                          )}%`
                                        : "0%"}
                                </div>
                            </div>
                            <p className={styles.chartDescription}>
                                Solved: {progressData.solved} | Attempted:{" "}
                                {progressData.attempted} | Not Attempted:{" "}
                                {progressData.not_attempted} of{" "}
                                {progressData.total}
                            </p>
                            <div className={styles.statsDashboard}>
                                <div className={styles.statCard}>
                                    <FaCode className={styles.statIcon} />
                                    <h4>Total Submissions</h4>
                                    <p>{progressData.total_submissions}</p>
                                </div>
                                <div className={styles.statCard}>
                                    <FaPercentage className={styles.statIcon} />
                                    <h4>Success Rate</h4>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: `${progressData.avg_success_rate}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p>
                                        {progressData.avg_success_rate.toFixed(
                                            1
                                        )}
                                        %
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProblemList;
