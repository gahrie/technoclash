import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Pusher from "pusher-js";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaTrophy } from "react-icons/fa";
import Input from "../../components/ui/Input";
import Checkbox from "../../components/ui/Checkbox";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import { useAuth } from "../../context/AuthContext";
import styles from "./CompetitiveList.module.scss";

const CompetitiveList = () => {
    const { token, userId, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [rooms, setRooms] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        minRating: "",
        maxRating: "",
        isPublic: [],
    });
    const [sortBy, setSortBy] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [rankData, setRankData] = useState({
        rank_title: null,
        rating: null,
        minimum_rating: null,
        maximum_rating: null,
        rank_icon: null,
    });
    const [rankLoading, setRankLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        room_name: "",
        room_duration: 30,
        minimum_rating: 1,
        maximum_rating: 999999,
        is_public: true,
        password: "",
    });

    // Define rank colors for progress bar and icon
    const rankColors = {
        Iron: "#808080",
        Bronze: "#cd7f32",
        Silver: "#c0c0c0",
        Gold: "#ffd700",
        Platinum: "#6abac3",
        Diamond: "#4169e1",
        null: "#6b7280",
    };

    const publicOptions = [
        { value: "1", label: "Public", type: "is_public" },
        { value: "0", label: "Private", type: "is_public" },
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
        },
        {
            Header: "Room Name",
            accessor: "room_name",
            sortable: true,
            Cell: ({ value }) => value || "N/A",
        },
        {
            Header: "Duration (min)",
            accessor: "room_duration",
            sortable: true,
            Cell: ({ value }) => value || "N/A",
        },
        {
            Header: "Rating Range",
            accessor: "rating_range",
            sortable: true,
            Cell: ({ row }) => `${row.minimum_rating}-${row.maximum_rating}`,
        },
        {
            Header: "Type",
            accessor: "is_public",
            sortable: true,
            Cell: ({ value }) => (value ? "Public" : "Private"),
        },
        {
            Header: "Host",
            accessor: "host_username",
            sortable: true,
            Cell: ({ row }) => row.host_username || "No Host",
        },
        {
            Header: "Status",
            accessor: "status",
            sortable: true,
            Cell: ({ value }) => value.charAt(0).toUpperCase() + value.slice(1),
        },
        {
            Header: "Score",
            accessor: "score",
            sortable: true,
            Cell: ({ value }) => (value !== null ? `${value}/60` : "N/A"),
        },
        {
            Header: "Action",
            accessor: "action",
            Cell: ({ row }) => {
                if (row.status === "finished") {
                    return <span>Completed</span>;
                }
                if (row.status === "Started") {
                    return <span>In Progress</span>;
                }
                return (
                    <Button
                        onClick={() => handleJoinRoom(row.id, row.is_public)}
                        className={styles.joinBtn}
                        variant="primary"
                    >
                        Join
                    </Button>
                );
            },
        },
    ];

    const checkPendingRooms = useCallback(async () => {
        if (!token) {
            setError("Please log in to view rooms");
            navigate("/login");
            return;
        }
        try {
            const response = await axios.get(
                "/api/student/competitive/pending-rooms",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data.room_id) {
                setError(
                    "You have a pending room. Please complete or leave it before accessing the room list."
                );
                navigate(`/competitive/room/${response.data.room_id}`);
            }
        } catch (err) {
            console.error(
                "Check pending rooms error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            }
        }
    }, [navigate, token, logout]);

    const fetchRooms = useCallback(
        async (
            page = 1,
            filtersArg = filters,
            rows = rowsPerPage,
            sort = sortBy
        ) => {
            if (!token) {
                setError("Please log in to view rooms");
                navigate("/login");
                return;
            }
            setLoading(true);
            setError(null);
            setRooms([]); // Reset rooms to avoid stale data
            const params = {
                page,
                min_rating: filtersArg.minRating,
                max_rating: filtersArg.maxRating,
                is_public: filtersArg.isPublic,
                search: filtersArg.search,
                sort_by: sort?.field,
                sort_direction: sort?.direction,
                rows,
            };
            console.log("Fetch rooms params:", params);
            try {
                const response = await axios.get(
                    "/api/student/competitive/rooms",
                    {
                        params,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log("Rooms API Response:", response.data);
                setRooms(response.data.data || []);
                setPagination(response.data.meta?.pagination || {});
            } catch (err) {
                console.error(
                    "Fetch rooms error:",
                    err.response?.data || err.message
                );
                if (err.response?.status === 401) {
                    setError("Session expired. Please log in again.");
                    logout();
                    navigate("/login");
                } else {
                    setError("Something went wrong while fetching rooms");
                }
            } finally {
                setLoading(false);
            }
        },
        [navigate, filters, rowsPerPage, sortBy, token, logout]
    );

    const fetchRank = useCallback(async () => {
        if (!token) {
            setError("Please log in to view rank");
            navigate("/login");
            return;
        }
        setRankLoading(true);
        try {
            const response = await axios.get("/api/student/competitive/rank", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Rank API Response:", response.data);
            setRankData({
                rank_title: response.data.rank_title || "Unranked",
                rating: response.data.rating || 0,
                minimum_rating: response.data.minimum_rating || 0,
                maximum_rating: response.data.maximum_rating || 999999,
                rank_icon: response.data.rank_icon || null,
            });
        } catch (err) {
            console.error(
                "Fetch rank error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            } else {
                setError("Something went wrong while fetching rank data");
            }
        } finally {
            setRankLoading(false);
        }
    }, [navigate, token, logout]);

    useEffect(() => {
        checkPendingRooms();
        fetchRooms(1, filters, rowsPerPage, sortBy);
        fetchRank();

        const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
        const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

        if (!pusherKey || !pusherCluster) {
            console.warn(
                "Pusher configuration missing. Real-time room updates disabled."
            );
            return;
        }

        let pusher;
        try {
            pusher = new Pusher(pusherKey, {
                cluster: pusherCluster,
                encrypted: true,
                authEndpoint: `${
                    import.meta.env.REACT_APP_API_URL
                }/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            });
            console.log("Pusher initialized for room list");

            const channel = pusher.subscribe("competitive-rooms");
            channel.bind("room-created", (data) => {
                console.log("Pusher room-created:", data);
                setRooms((prev) => {
                    if (prev.some((room) => room.id === data.id)) return prev;
                    return [data, ...prev];
                });
            });

            channel.bind("room-updated", (data) => {
                console.log("Pusher room-updated:", data);
                setRooms((prev) =>
                    prev.map((room) =>
                        room.id === data.id
                            ? {
                                  ...room,
                                  host: data.host,
                                  host_username: data.host_username,
                                  status: data.status || room.status,
                                  score: data.score || room.score,
                              }
                            : room
                    )
                );
            });

            channel.bind("room-deleted", (data) => {
                console.log("Pusher room-deleted:", data);
                setRooms((prev) => prev.filter((room) => room.id !== data.id));
            });

            return () => {
                if (pusher) {
                    pusher.unsubscribe("competitive-rooms");
                    pusher.disconnect();
                }
            };
        } catch (err) {
            console.error("Pusher initialization error:", err.message);
        }
    }, [checkPendingRooms, fetchRooms, fetchRank, location.key, token]);

    const handlePageChange = (page) => {
        fetchRooms(page, filters, rowsPerPage, sortBy);
    };

    const handleSort = (sort) => {
        setSortBy(sort);
        fetchRooms(1, filters, rowsPerPage, sort);
    };

    const handleFilterChange = (type, values) => {
        console.log(`Filter changed: ${type}`, values);
        setFilters((prev) => {
            const newFilters = { ...prev, [type]: values || [] };
            console.log("Updated filters state:", newFilters);
            return newFilters;
        });
    };

    const handleInputFilterChange = (type, value) => {
        console.log(`Input filter changed: ${type}`, value);
        setFilters((prev) => {
            const newFilters = { ...prev, [type]: value };
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
            minRating: "",
            maxRating: "",
            isPublic: [],
        };
        setFilters(resetFilters);
        setSortBy(null);
        fetchRooms(1, resetFilters, rowsPerPage, null);
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!token) {
            setError("Please log in to create a room");
            navigate("/login");
            return;
        }
        setError(null);
        try {
            const payload = {
                room_name: createForm.room_name,
                room_duration: createForm.room_duration,
                minimum_rating: createForm.minimum_rating,
                maximum_rating: createForm.maximum_rating,
                is_public: createForm.is_public,
                password: createForm.is_public ? null : createForm.password,
            };
            console.log("Create room payload:", payload);
            const response = await axios.post(
                "/api/student/competitive/rooms",
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Create room response:", response.data);
            setShowCreateModal(false);
            setCreateForm({
                room_name: "",
                room_duration: 30,
                minimum_rating: 0,
                maximum_rating: 999999,
                is_public: true,
                password: "",
            });
            navigate(`/competitive/room/${response.data.room.id}`);
        } catch (err) {
            console.error(
                "Create room error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            } else if (err.response?.status === 422) {
                const errors = err.response?.data?.errors;
                const errorMessage = errors
                    ? Object.values(errors).flat().join(", ")
                    : err.response?.data?.message || "Failed to create room";
                setError(errorMessage);
            } else {
                setError(
                    err.response?.data?.message || "Failed to create room"
                );
            }
        }
    };

    const handleJoinRoom = async (roomId, isPublic) => {
        if (!token) {
            setError("Please log in to join a room");
            navigate("/login");
            return;
        }
        setError(null);
        let password = "";
        if (!isPublic) {
            password = prompt("Enter room password:");
            if (!password) return;
        }
        try {
            const response = await axios.post(
                `/api/student/competitive/rooms/${roomId}/join`,
                { password: isPublic ? "" : password },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Join room response:", response.data);
            navigate(`/competitive/room/${roomId}`);
        } catch (err) {
            console.error(
                "Join room error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            } else {
                setError(err.response?.data?.message || "Failed to join room");
            }
        }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setCreateForm({
            room_name: "",
            room_duration: 30,
            minimum_rating: 0,
            maximum_rating: 999999,
            is_public: true,
            password: "",
        });
        setError(null);
    };

    return (
        <div className={styles.problemListContainer}>
            <div className={styles.headerContainer}>
                <h2>Competitive Rooms</h2>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className={styles.createBtn}
                    variant="primary"
                >
                    Create Room
                </Button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Create New Room</h3>
                        <form onSubmit={handleCreateRoom}>
                            <div className={styles.formRow}>
                                <Input
                                    type="text"
                                    value={createForm.room_name}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            room_name: e.target.value,
                                        })
                                    }
                                    placeholder="Room Name"
                                    required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <Input
                                    type="text"
                                    value={createForm.room_duration}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            room_duration: e.target.value,
                                        })
                                    }
                                    placeholder="Duration"
                                    required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <Input
                                    type="text"
                                    value={createForm.minimum_rating}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            minimum_rating: e.target.value,
                                        })
                                    }
                                    placeholder="Min Rating"
                                    required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <Input
                                    type="text"
                                    value={createForm.maximum_rating}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            maximum_rating: e.target.value,
                                        })
                                    }
                                    placeholder="Max Rating"
                                    min={createForm.minimum_rating || 0}
                                    required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <Checkbox
                                    id="is_public"
                                    checked={!createForm.is_public}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            is_public: !e.target.checked,
                                            password: e.target.checked
                                                ? createForm.password
                                                : "",
                                        })
                                    }
                                    label="Private Room"
                                    labelPosition="right"
                                    variant="switch"
                                />
                            </div>
                            {!createForm.is_public && (
                                <div className={styles.formRow}>
                                    <Input
                                        type="text"
                                        value={createForm.password}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                password: e.target.value,
                                            })
                                        }
                                        placeholder="Password"
                                        required
                                        className={styles.formInput}
                                    />
                                </div>
                            )}
                            <div className={styles.modalButtons}>
                                <Button type="submit" variant="secondary">
                                    Create
                                </Button>
                                <Button
                                    type="button"
                                    onClick={closeModal}
                                    className={styles.cancelBtn}
                                    variant="primary"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                        placeholder="Search by room ID or name..."
                                        className={styles.searchInput}
                                    />
                                    <Input
                                        type="text"
                                        id="minRating"
                                        value={filters.minRating}
                                        onChange={(e) =>
                                            handleInputFilterChange(
                                                "minRating",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Min Rating"
                                        className={styles.ratingInput}
                                        min="0"
                                    />
                                    <Input
                                        type="text"
                                        id="maxRating"
                                        value={filters.maxRating}
                                        onChange={(e) =>
                                            handleInputFilterChange(
                                                "maxRating",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Max Rating"
                                        className={styles.ratingInput}
                                        min="0"
                                    />
                                    <CustomSelect
                                        options={publicOptions}
                                        value={filters.isPublic}
                                        onChange={(values) =>
                                            handleFilterChange(
                                                "isPublic",
                                                values
                                            )
                                        }
                                        isMulti
                                        placeholder="Select type"
                                    />
                                    <Button
                                        onClick={handleResetFilters}
                                        className={styles.resetBtn}
                                        variant="secondary"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Table
                            columns={columns}
                            data={rooms}
                            loading={loading}
                            noDataMessage="No rooms found."
                            sortBy={sortBy}
                            onSort={handleSort}
                            getRowProps={(row) => ({
                                className:
                                    row.original.status === "finished"
                                        ? styles.disabledRow
                                        : "",
                            })}
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
                    {rankLoading ? (
                        <div className={styles.rankLoading}>
                            <div className={styles.spinnerContainer}>
                                <div className={styles.spinner}></div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.rankWrapper}>
                            {rankData.rank_icon ? (
                                <img
                                    src={`/storage/${rankData.rank_icon}`}
                                    alt={rankData.rank_title}
                                    className={styles.rankIcon}
                                />
                            ) : (
                                <FaTrophy
                                    className={styles.rankIcon}
                                    style={{
                                        color: rankColors[rankData.rank_title],
                                    }}
                                />
                            )}
                            <h4>{rankData.rank_title}</h4>
                            <p>Rating: {rankData.rating}</p>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{
                                        width: `${
                                            ((rankData.rating -
                                                rankData.minimum_rating) /
                                                (rankData.maximum_rating -
                                                    rankData.minimum_rating)) *
                                            100
                                        }%`,
                                        backgroundColor:
                                            rankColors[rankData.rank_title],
                                    }}
                                ></div>
                            </div>
                            <p>
                                {rankData.rating}/{rankData.maximum_rating}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompetitiveList;