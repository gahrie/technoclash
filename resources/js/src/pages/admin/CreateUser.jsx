import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
    FaEye,
    FaEyeSlash,
    FaInfoCircle,
    FaCheck,
    FaTimes,
    FaArrowLeft,
} from "react-icons/fa";

import Input from "../../components/ui/Input";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import UploadInput from "../../components/ui/UploadInput";
import styles from "./CreateUser.module.scss";

const CreateUser = () => {
    const { addNotification } = useOutletContext();
    const [avatarKey, setAvatarKey] = useState(Date.now());
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [gender, setGender] = useState("");
    const [bio, setBio] = useState("");
    const [university, setUniversity] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [error, setError] = useState({
        firstName: "",
        lastName: "",
        username: "",
        gender: "",
        bio: "",
        university: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
        avatar: "",
        general: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        color: "",
        label: "",
    });
    const [criteria, setCriteria] = useState({
        lengthCheck: false,
        upperCheck: false,
        lowerCheck: false,
        numberCheck: false,
        specialCheck: false,
    });

    const strengthLevels = [
        { label: "None", color: "#ccc", score: 0 },
        { label: "Weak", color: "#FF4D4D", score: 1 },
        { label: "Fair", color: "#FFA500", score: 2 },
        { label: "Good", color: "#FFD700", score: 3 },
        { label: "Strong", color: "#4CAF50", score: 4 },
    ];

    const checkPasswordStrength = (password) => {
        const lengthCheck = password.length >= 8;
        const upperCheck = /[A-Z]/.test(password);
        const lowerCheck = /[a-z]/.test(password);
        const numberCheck = /\d/.test(password);
        const specialCheck = /[!@#$%^&*(),_.?":{}|<>]/.test(password);

        const score = [
            lengthCheck,
            upperCheck,
            lowerCheck,
            numberCheck,
            specialCheck,
        ].filter(Boolean).length;
        setCriteria({
            lengthCheck,
            upperCheck,
            lowerCheck,
            numberCheck,
            specialCheck,
        });
        const strength =
            strengthLevels[Math.min(score, 4)] || strengthLevels[0];
        setPasswordStrength(strength);

        return {
            lengthCheck,
            upperCheck,
            lowerCheck,
            numberCheck,
            specialCheck,
        };
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () =>
        setShowConfirmPassword(!showConfirmPassword);

    const generateAvatar = () => {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");

            const colors = [
                "#D32F2F",
                "#1976D2",
                "#388E3C",
                "#FBC02D",
                "#7B1FA2",
            ];
            const randomColor =
                colors[Math.floor(Math.random() * colors.length)];
            ctx.fillStyle = randomColor;
            ctx.fillRect(0, 0, 200, 200);

            const initials = `${firstName[0] || ""}${
                lastName[0] || ""
            }`.toUpperCase();
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 80px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(initials, 100, 100);

            canvas.toBlob((blob) => {
                const file = new File([blob], "avatar.png", {
                    type: "image/png",
                });
                resolve(file);
            }, "image/png");
        });
    };

    const handleInputChange = (e, field) => {
        let value = e.target.value;
        switch (field) {
            case "firstName":
            case "lastName":
                value = value.replace(/[^a-zA-Z'-]/g, "");
                break;
            case "username":
                value = value.replace(/[^a-zA-Z0-9]/g, "");
                break;
            case "university":
                value = value.replace(/[^a-zA-Z\s]/g, "");
                break;
            case "email":
            case "password":
            case "confirmPassword":
                value = value.replace(/\s/g, "");
                break;
            default:
                break;
        }
        setFormData(field, value);
        setError({ ...error, [field]: "" });
        if (field === "password") {
            checkPasswordStrength(value);
        }
    };

    const setFormData = (field, value) => {
        switch (field) {
            case "firstName":
                setFirstName(value);
                break;
            case "lastName":
                setLastName(value);
                break;
            case "username":
                setUsername(value);
                break;
            case "university":
                setUniversity(value);
                break;
            case "email":
                setEmail(value);
                break;
            case "password":
                setPassword(value);
                break;
            case "confirmPassword":
                setConfirmPassword(value);
                break;
            default:
                break;
        }
    };

    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setUsername("");
        setGender("");
        setBio("");
        setUniversity("");
        setEmail("");
        setRole("");
        setPassword("");
        setConfirmPassword("");
        setAvatarFile(null);
        setError({
            firstName: "",
            lastName: "",
            username: "",
            gender: "",
            bio: "",
            university: "",
            email: "",
            role: "",
            password: "",
            confirmPassword: "",
            avatar: "",
            general: "",
        });
        checkPasswordStrength("");
        setAvatarKey(Date.now());
    };

    const validateForm = () => {
        const newError = { ...error };
        let isValid = true;

        if (!firstName) {
            newError.firstName = "First name is required";
            isValid = false;
        }
        if (!lastName) {
            newError.lastName = "Last name is required";
            isValid = false;
        }
        if (!username) {
            newError.username = "Username is required";
            isValid = false;
        }
        if (!gender) {
            newError.gender = "Gender is required";
            isValid = false;
        }
        if (!email) {
            newError.email = "Email is required";
            isValid = false;
        }
        if (!role) {
            newError.role = "Role is required";
            isValid = false;
        }
        if (!password) {
            newError.password = "Password is required";
            isValid = false;
        }
        if (!confirmPassword) {
            newError.confirmPassword = "Confirm password is required";
            isValid = false;
        }
        if (avatarFile && !avatarFile.type.startsWith("image/")) {
            newError.avatar = "Please upload a valid image file";
            isValid = false;
        }

        setError(newError);
        return isValid;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError({
            firstName: "",
            lastName: "",
            username: "",
            gender: "",
            bio: "",
            university: "",
            email: "",
            role: "",
            password: "",
            confirmPassword: "",
            avatar: "",
            general: "",
        });
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            addNotification("error", "Please fill in all required fields.");
            return;
        }

        const {
            lengthCheck,
            upperCheck,
            lowerCheck,
            numberCheck,
            specialCheck,
        } = checkPasswordStrength(password);
        if (
            !(
                lengthCheck &&
                upperCheck &&
                lowerCheck &&
                numberCheck &&
                specialCheck
            )
        ) {
            setError({
                ...error,
                password: "Password must meet all criteria (see tooltip)",
            });
            setLoading(false);
            addNotification("error", "Password does not meet requirements.");
            return;
        }

        if (password !== confirmPassword) {
            setError({ ...error, confirmPassword: "Passwords do not match" });
            setLoading(false);
            addNotification("error", "Passwords do not match.");
            return;
        }

        const file = avatarFile || (await generateAvatar());

        const formData = new FormData();
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        formData.append("username", username);
        formData.append("gender", gender);
        formData.append("bio", bio);
        formData.append("university", university);
        formData.append("email", email);
        formData.append("role", role);
        formData.append("password", password);
        formData.append("password_confirmation", confirmPassword);
        formData.append("avatar", file);

        try {
            await axios.post("/api/admin/users/create", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            addNotification("success", "User created successfully!");
            resetForm();
        } catch (err) {
            if (err.response && err.response.status === 422) {
                const validationErrors = err.response.data.errors;
                const newError = {
                    firstName: validationErrors.first_name?.[0] || "",
                    lastName: validationErrors.last_name?.[0] || "",
                    username: validationErrors.username?.[0] || "",
                    gender: validationErrors.gender?.[0] || "",
                    bio: validationErrors.bio?.[0] || "",
                    university: validationErrors.university?.[0] || "",
                    email: validationErrors.email?.[0] || "",
                    role: validationErrors.role?.[0] || "",
                    password: validationErrors.password?.[0] || "",
                    confirmPassword:
                        validationErrors.password_confirmation?.[0] || "",
                    avatar: validationErrors.avatar?.[0] || "",
                };
                setError(newError);
                addNotification("error", "Please fix the errors in the form.");
            } else {
                setError({
                    ...error,
                    general: "Something went wrong.",
                });
                addNotification("error", "Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    const genderOptions = [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
    ];

    const roleOptions = [
        { value: "admin", label: "Admin" },
        { value: "student", label: "Student" },
        { value: "professor", label: "Professor" },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.navigation}>
                <Button variant="secondary-form" to="/admin/users">
                    <FaArrowLeft /> Back
                </Button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <div className={styles.card}>
                    {error.general && (
                        <div className={styles.error}>{error.general}</div>
                    )}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Information</h2>
                        <div className={styles.row}>
                            <UploadInput
                                key={avatarKey}
                                id="avatar"
                                onChange={(file) => {
                                    setAvatarFile(file);
                                    setError({ ...error, avatar: "" });
                                }}
                                accept="image/*"
                                type="avatar"
                                placeholder="Upload Avatar (Optional)"
                            />
                            {error.avatar && (
                                <p className={styles.error}>{error.avatar}</p>
                            )}
                            <div className={styles.col}>
                                <div className={styles.inputGroup}>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        value={firstName}
                                        onChange={(e) =>
                                            handleInputChange(e, "firstName")
                                        }
                                        placeholder="First Name"
                                        required
                                    />
                                    {error.firstName && (
                                        <p className={styles.error}>
                                            {error.firstName}
                                        </p>
                                    )}
                                </div>
                                <div className={styles.inputGroup}>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        value={lastName}
                                        onChange={(e) =>
                                            handleInputChange(e, "lastName")
                                        }
                                        placeholder="Last Name"
                                        required
                                    />
                                    {error.lastName && (
                                        <p className={styles.error}>
                                            {error.lastName}
                                        </p>
                                    )}
                                </div>
                                <div className={styles.inputGroup}>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                            handleInputChange(e, "username")
                                        }
                                        placeholder="Username"
                                        required
                                    />
                                    {error.username && (
                                        <p className={styles.error}>
                                            {error.username}
                                        </p>
                                    )}
                                </div>
                                <div className={styles.inputGroup}>
                                    <CustomSelect
                                        id="gender"
                                        value={gender}
                                        onChange={(value) => {
                                            setGender(value);
                                            setError({
                                                ...error,
                                                gender: "",
                                            });
                                        }}
                                        options={genderOptions}
                                        placeholder="Gender"
                                        required
                                        error={error.gender}
                                        enableSearch={false}
                                    />
                                    {error.gender && (
                                        <p className={styles.error}>
                                            {error.gender}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => {
                                    setBio(e.target.value);
                                    setError({ ...error, bio: "" });
                                }}
                                placeholder="Bio"
                            />
                            {error.bio && (
                                <p className={styles.error}>{error.bio}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Input
                                id="university"
                                type="text"
                                value={university}
                                onChange={(e) =>
                                    handleInputChange(e, "university")
                                }
                                placeholder="University (Optional)"
                            />
                            {error.university && (
                                <p className={styles.error}>
                                    {error.university}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Credentials</h2>
                        <div className={styles.inputGroup}>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => handleInputChange(e, "email")}
                                placeholder="Email"
                                required
                            />
                            {error.email && (
                                <p className={styles.error}>{error.email}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <CustomSelect
                                id="role"
                                value={role}
                                onChange={(value) => {
                                    setRole(value);
                                    setError({ ...error, role: "" });
                                }}
                                options={roleOptions}
                                placeholder="Role"
                                required
                                error={error.role}
                                enableSearch={false}
                            />
                            {error.role && (
                                <p className={styles.error}>{error.role}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <div className={styles["password-wrapper"]}>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        handleInputChange(e, "password")
                                    }
                                    className={styles.password}
                                    placeholder="Password"
                                    required
                                />
                                <div className={styles.icons}>
                                    <span
                                        className={styles["toggle-icon"]}
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash />
                                        ) : (
                                            <FaEye />
                                        )}
                                    </span>
                                    <span className={styles["info-icon"]}>
                                        <FaInfoCircle />
                                        <div
                                            className={
                                                styles["tooltip-content"]
                                            }
                                        >
                                            <ul>
                                                <li>
                                                    {criteria.lengthCheck ? (
                                                        <FaCheck
                                                            className={
                                                                styles[
                                                                    "check-icon"
                                                                ]
                                                            }
                                                        />
                                                    ) : (
                                                        <FaTimes
                                                            className={
                                                                styles[
                                                                    "times-icon"
                                                                ]
                                                            }
                                                        />
                                                    )}
                                                    At least 8 characters
                                                </li>
                                                <li>
                                                    {criteria.upperCheck ? (
                                                        <FaCheck
                                                            className={
                                                                styles[
                                                                    "check-icon"
                                                                ]
                                                            }
                                                        />
                                                    ) : (
                                                        <FaTimes
                                                            className={
                                                                styles[
                                                                    "times-icon"
                                                                ]
                                                            }
                                                        />
                                                    )}
                                                    1 uppercase letter
                                                </li>
                                                <li>
                                                    {criteria.lowerCheck ? (
                                                        <FaCheck
                                                            className={
                                                                styles[
                                                                    "check-icon"
                                                                ]
                                                            }
                                                        />
                                                    ) : (
                                                        <FaTimes
                                                            className={
                                                                styles[
                                                                    "times-icon"
                                                                ]
                                                            }
                                                        />
                                                    )}
                                                    1 lowercase letter
                                                </li>
                                                <li>
                                                    {criteria.numberCheck ? (
                                                        <FaCheck
                                                            className={
                                                                styles[
                                                                    "check-icon"
                                                                ]
                                                            }
                                                        />
                                                    ) : (
                                                        <FaTimes
                                                            className={
                                                                styles[
                                                                    "times-icon"
                                                                ]
                                                            }
                                                        />
                                                    )}
                                                    1 number
                                                </li>
                                                <li>
                                                    {criteria.specialCheck ? (
                                                        <FaCheck
                                                            className={
                                                                styles[
                                                                    "check-icon"
                                                                ]
                                                            }
                                                        />
                                                    ) : (
                                                        <FaTimes
                                                            className={
                                                                styles[
                                                                    "times-icon"
                                                                ]
                                                            }
                                                        />
                                                    )}
                                                    1 special character
                                                </li>
                                            </ul>
                                        </div>
                                    </span>
                                </div>
                            </div>
                            <div className={styles["password-strength"]}>
                                <label>
                                    Password Strength:
                                    <span
                                        className={styles["strength-label"]}
                                        style={{
                                            color: passwordStrength.color,
                                            marginLeft: "5px",
                                        }}
                                    >
                                        {passwordStrength.label || "None"}
                                    </span>
                                </label>
                            </div>
                            {error.password && (
                                <p className={styles.error}>{error.password}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <div className={styles["password-wrapper"]}>
                                <Input
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        handleInputChange(e, "confirmPassword")
                                    }
                                    className={styles.confirmPassword}
                                    placeholder="Confirm Password"
                                    required
                                />
                                <div className={styles.icons}>
                                    <span
                                        className={styles["toggle-icon"]}
                                        onClick={
                                            toggleConfirmPasswordVisibility
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <FaEyeSlash />
                                        ) : (
                                            <FaEye />
                                        )}
                                    </span>
                                </div>
                            </div>
                            {error.confirmPassword && (
                                <p className={styles.error}>
                                    {error.confirmPassword}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            variant="secondary-form"
                            type="submit"
                            loading={loading}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;
