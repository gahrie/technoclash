import React, { createContext, useState, useEffect, useContext } from "react";
import styles from "./AuthContext.module.scss";
import Cookies from "js-cookie"; // Import js-cookie

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [userName, setUserName] = useState(
        localStorage.getItem("name") || ""
    );
    const [userRole, setUserRole] = useState(
        localStorage.getItem("role") || "Guest"
    );
    const [userId, setUserId] = useState(
        localStorage.getItem("user_id") || null
    );
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState("light"); // Default theme

    // Fetch theme from cookie and auth data on mount
    useEffect(() => {
        // Get theme from cookie (e.g., 'light' or 'dark')
        const savedTheme = Cookies.get("theme") || "light";
        setTheme(savedTheme);

        // Apply theme to <body>
        document.body.classList.remove("light", "dark");
        document.body.classList.add(savedTheme);

        // Existing auth logic
        if (token) {
            fetch("/api/user", {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Invalid token");
                    return res.json();
                })
                .then((data) => {
                    setUserRole(data.data.role);
                    setUserName(
                        `${data.data.profile.first_name} ${data.data.profile.last_name}`
                    );
                    setUserId(data.data.id);
                    localStorage.setItem(
                        "name",
                        `${data.data.profile.first_name} ${data.data.profile.last_name}`
                    );
                    localStorage.setItem("role", data.data.role);
                    localStorage.setItem("user_id", data.data.id);
                })
                .catch(() => {
                    handleLogout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    // Update theme and cookie when theme changes
    useEffect(() => {
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        Cookies.set("theme", theme, { expires: 365 });
    }, [theme]);

    const login = (newToken, name, role) => {
        setToken(newToken);
        setUserName(name);
        setUserRole(role);
        localStorage.setItem("name", name);
        localStorage.setItem("token", newToken);
        localStorage.setItem("role", role);
        localStorage.setItem("user_id", userId);
    };

    const handleLogout = () => {
        fetch("/api/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        }).finally(() => {
            setToken(null);
            setUserName("");
            setUserRole("Guest");
            localStorage.removeItem("name");
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user_id");
        });
    };

    // Function to update theme
    const updateTheme = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                userName,
                userRole,
                login,
                logout: handleLogout,
                loading,
                userId,
                theme,
                setTheme: updateTheme,
            }}
        >
            {loading ? (
                <div className={styles.container}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loading}>Loading...</p>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
