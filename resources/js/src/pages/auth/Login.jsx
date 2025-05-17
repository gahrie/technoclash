import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import Button from "../../components/ui/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./Login.module.scss";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState({
        email: "",
        password: "",
        general: "",
    });
    const [loading, setLoading] = useState(false);
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError({ email: "", password: "", general: "" });
        setLoading(true);

        try {
            const { data } = await axios.post("/api/login", {
                email,
                password,
            });
            const { token, role } = data;

            if (!token || !role) {
                throw new Error(
                    "Invalid server response. Please contact support."
                );
            }

            const adminRoles = ["Admin", "Professor"];
            const clientRoles = ["Student"];
            if (adminRoles.includes(role)) {
                authLogin(token, role);
                navigate(`/${role.toLowerCase()}/dashboard`);
            } else if (clientRoles.includes(role)) {
                authLogin(token, role);
                navigate(`/progressive`);
            } else {
                throw new Error("Unauthorized role detected");
            }
        } catch (err) {
            if (err.response) {
                if (err.response.status === 403) {
                    const { registration_progress, signup_email } =
                        err.response.data;
                    localStorage.setItem("signup_email", signup_email);
                    localStorage.setItem(
                        "registration_progress",
                        registration_progress
                    );
                    const redirectMap = {
                        Credentials: "/signup/credentials",
                        Information: "/signup/information",
                        Verification: "/signup/verification",
                    };
                    navigate(
                        redirectMap[registration_progress] ||
                            "/signup/credentials"
                    );
                } else if (err.response.status === 401) {
                    setError({
                        ...error,
                        general: "Invalid email or password",
                    });
                } else if (err.response.status === 500) {
                    setError({
                        ...error,
                        general: "Server error. Please try again later.",
                    });
                } else {
                    setError({ ...error, general: "Something went wrong." });
                }
            } else {
                setError({ ...error, general: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value.replace(/\s/g, ""));
        setError({ ...error, email: "" });
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value.replace(/\s/g, ""));
        setError({ ...error, password: "" });
    };

    const preventSpace = (e) => {
        if (e.key === " ") {
            e.preventDefault();
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>Sign In</h1>
                {error.general && (
                    <p className={styles.error}>{error.general}</p>
                )}
                <form onSubmit={handleSubmit}>
                    <div className={styles["form-group"]}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onKeyDown={preventSpace}
                            onChange={handleEmailChange}
                            className={email}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className={styles["form-group"]}>
                        <div className={styles["forgot-password-wrapper"]}>
                            <label htmlFor="password">Password</label>
                            <Link
                                to="/forgot-password"
                                className={styles["forgot-password-link"]}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <div className={styles["password-wrapper"]}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                onKeyDown={preventSpace}
                                className={password}
                                required
                                placeholder="Enter your password"
                            />
                            <span
                                className={styles["toggle-icon"]}
                                onClick={togglePasswordVisibility}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        {error.password && (
                            <p className={styles.error}>{error.password}</p>
                        )}
                    </div>
                    <Button variant="form" type="submit" loading={loading}>
                        Login
                    </Button>
                </form>
                <p>
                    Don't have an account?{" "}
                    <Link to="/signup/credentials" className={styles.link}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
