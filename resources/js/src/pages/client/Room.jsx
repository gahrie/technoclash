import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Pusher from "pusher-js";
import Button from "../../components/ui/Button";
import CustomSelect from "../../components/ui/CustomSelect";
import Table from "../../components/ui/Table";
import { useAuth } from "../../context/AuthContext";
import styles from "./Room.module.scss";

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { token, userId, userName, logout } = useAuth();
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchRoom = useCallback(async () => {
        if (!token) {
            setError("Please log in to view room");
            navigate("/login");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `/api/student/competitive/rooms/${roomId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Room API Response:", response.data);
            setRoom(response.data.room);
            setParticipants(response.data.participants);
        } catch (err) {
            console.error(
                "Fetch room error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            } else {
                setError("Something went wrong while fetching room data");
            }
        } finally {
            setLoading(false);
        }
    }, [roomId, navigate, token, logout]);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
        const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

        if (!pusherKey || !pusherCluster) {
            setError(
                "Pusher configuration is missing. Real-time updates are disabled."
            );
            fetchRoom();
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
            console.log("Pusher initialized successfully");

            const roomChannel = pusher.subscribe(`room-${roomId}`);
            roomChannel.bind("user-joined", (data) => {
                console.log("Pusher user-joined:", data);
                setParticipants((prev) => {
                    if (prev.some((p) => p.user_id === data.user_id)) {
                        return prev;
                    }
                    return [
                        ...prev,
                        {
                            user_id: data.user_id,
                            username: data.username,
                            rating: data.rating,
                        },
                    ];
                });
            });

            roomChannel.bind("user-left", (data) => {
                console.log("Pusher user-left:", data);
                setParticipants((prev) =>
                    prev.filter((p) => p.user_id !== data.user_id)
                );
            });

            roomChannel.bind("match-started", (data) => {
                console.log("Pusher match-started:", data);
                navigate(`/competitive/match/${roomId}`);
            });

            const competitiveChannel = pusher.subscribe("competitive-rooms");
            competitiveChannel.bind("room-updated", (data) => {
                console.log("Pusher room-updated:", data);
                if (data.id === parseInt(roomId)) {
                    setRoom((prev) => ({
                        ...prev,
                        host: data.host,
                        host_username: data.host_username || "No Host",
                        status: data.status || prev.status,
                    }));
                }
            });

            fetchRoom();

            return () => {
                if (pusher) {
                    pusher.unsubscribe(`room-${roomId}`);
                    pusher.unsubscribe("competitive-rooms");
                    pusher.disconnect();
                }
            };
        } catch (err) {
            console.error("Pusher initialization error:", err.message);
            setError(
                "Failed to initialize real-time updates. Please refresh the page."
            );
            fetchRoom();
        }
    }, [roomId, fetchRoom, token, navigate]);

    const handlePassHost = async (newHostId) => {
        setError(null);
        try {
            const response = await axios.post(
                `/api/student/competitive/rooms/${roomId}/pass-host`,
                { new_host_id: newHostId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Pass host response:", response.data);
            setRoom((prev) => ({
                ...prev,
                host: newHostId,
                host_username:
                    participants.find((p) => p.user_id === newHostId)
                        ?.username || "Unknown",
            }));
        } catch (err) {
            console.error(
                "Pass host error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            } else {
                setError(err.response?.data?.message || "Failed to pass host");
            }
        }
    };

    const handleStartMatch = async () => {
        setError(null);
        try {
            const response = await axios.post(
                `/api/student/competitive/rooms/${roomId}/start`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Start match response:", response.data);
        } catch (err) {
            console.error(
                "Start match error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            } else {
                setError(
                    err.response?.data?.message || "Failed to start match"
                );
            }
        }
    };

    const handleLeaveRoom = async () => {
        setError(null);
        try {
            const response = await axios.post(
                `/api/student/competitive/rooms/${roomId}/leave`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Leave room response:", response.data);
            navigate("/competitive", { state: { refetchRooms: true } });
        } catch (err) {
            console.error(
                "Leave room error:",
                err.response?.data || err.message
            );
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                logout();
                navigate("/login");
            } else {
                setError(err.response?.data?.message || "Failed to leave room");
            }
        }
    };

    const participantColumns = [
        {
            Header: "Username",
            accessor: "username",
            sortable: true,
        },
        {
            Header: "Rating",
            accessor: "rating",
            sortable: true,
        },
        {
            Header: "Host",
            accessor: "is_host",
            Cell: ({ row }) => (row.user_id === room?.host ? "Yes" : "No"),
        },
    ];

    const hostOptions = participants
        .filter((p) => p.user_id !== userId)
        .map((p) => ({
            value: p.user_id,
            label: p.username,
        }));

    if (!room) {
        return <div className={styles.loading}>Loading...</div>;
    }

    const isHost = userId === room.host && room.host !== null;

    return (
        <div className={styles.roomContainer}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2>{room.room_name || `Room #${room.id}`}</h2>
                    <p className={styles.status}>
                        Status:{" "}
                        {room.status.charAt(0).toUpperCase() +
                            room.status.slice(1)}
                    </p>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.cardContent}>
                    <div className={styles.grid}>
                        <div className={styles.section}>
                            <h3>Room Details</h3>
                            <p>
                                <strong>Name:</strong> {room.room_name || "N/A"}
                            </p>
                            <p>
                                <strong>Duration:</strong> {room.room_duration}{" "}
                                minutes
                            </p>
                            <p>
                                <strong>Rating Range:</strong>{" "}
                                {room.minimum_rating}-{room.maximum_rating}
                            </p>
                            <p>
                                <strong>Type:</strong>{" "}
                                {room.is_public ? "Public" : "Private"}
                            </p>
                            <p>
                                <strong>Host:</strong>{" "}
                                {room.host_username || "No Host"}
                            </p>
                        </div>
                        <div className={styles.section}>
                            <h3>Participants</h3>
                            <Table
                                columns={participantColumns}
                                data={participants}
                                loading={loading}
                                noDataMessage="No participants found."
                                className={styles.participantTable}
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {isHost && (
                            <>
                                <CustomSelect
                                    options={hostOptions}
                                    value=""
                                    onChange={(value) => handlePassHost(value)}
                                    placeholder="Pass Host To..."
                                    className={styles.passHostSelect}
                                    disabled={hostOptions.length === 0}
                                />
                                <Button
                                    onClick={handleStartMatch}
                                    variant="primary"
                                    className={styles.startBtn}
                                    disabled={room.status !== "Waiting"}
                                >
                                    Start Match
                                </Button>
                            </>
                        )}
                        <Button
                            onClick={handleLeaveRoom}
                            variant="secondary"
                            className={styles.leaveBtn}
                        >
                            Leave Room
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Room;
