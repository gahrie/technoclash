import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
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
import styles from "./UpdateUser.module.scss";

const UpdateUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
    const [level, setLevel] = useState("");
    const [rating, setRating] = useState("");
    const [exp, setExp] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [currentAvatar, setCurrentAvatar] = useState(null);
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
        level: "",
        rating: "",
        exp: "",
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

    const genderOptions = [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
        { value: "Other", label: "Other" },
    ];

    const roleOptions = [
        { value: "Admin", label: "Admin" },
        { value: "Student", label: "Student" },
        { value: "Professsor", label: "Professor" },
    ];

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/users/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const user = response.data.data;
                setFirstName(user.profile.first_name || "");
                setLastName(user.profile.last_name || "");
                setUsername(user.profile.username || "");
                setGender(user.profile.gender || "");
                setBio(user.profile.bio || "");
                setUniversity(user.profile.university || "");
                setEmail(user.email || "");
                setRole(user.role || "");
                setLevel(user.profile.level || "");
                setRating(user.profile.rating || "");
                setExp(user.profile.exp || "");
                setCurrentAvatar(
                    user.profile.avatar
                        ? `/storage/${user.profile.avatar}`
                        : null
                );
            } catch (error) {
                if (error.response?.status === 404) {
                    addNotification("error", "User not found.");
                } else if (error.response?.status === 401) {
                    addNotification("error", "Unauthorized. Please log in.");
                    navigate("/login");
                } else {
                    addNotification("error", "Failed to load user data.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, navigate, addNotification]);

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

    const fetchMinimumExp = async (level) => {
        if (!level) return;
        try {
            const response = await axios.get(`/api/levels/${level}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setExp(response.data.minimum_exp.toString());
            setError({ ...error, level: "", exp: "" });
        } catch (err) {
            setError({ ...error, level: "Invalid level" });
            setExp("");
        }
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
            case "level":
            case "rating":
                value = value.replace(/[^0-9]/g, "");
                break;
            default:
                break;
        }
        setFormData(field, value);
        setError({ ...error, [field]: "" });
        if (field === "password") {
            checkPasswordStrength(value);
        }
        if (field === "level") {
            fetchMinimumExp(value);
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
            case "level":
                setLevel(value);
                break;
            case "rating":
                setRating(value);
                break;
            default:
                break;
        }
    };

    const resetForm = () => {
        setPassword("");
        setConfirmPassword("");
        setLevel("");
        setRating("");
        setExp("");
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
            level: "",
            rating: "",
            exp: "",
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
        if (!level) {
            newError.level = "Level is required";
            isValid = false;
        }
        if (!rating) {
            newError.rating = "Rating is required";
            isValid = false;
        }
        if (!exp) {
            newError.exp = "Experience points are required";
            isValid = false;
        }
        if (password && password !== confirmPassword) {
            newError.confirmPassword = "Passwords do not match";
            isValid = false;
        }
        if (avatarFile && !avatarFile.type.startsWith("image/")) {
            newError.avatar = "Please upload a valid image file";
            isValid = false;
        }
        if (password) {
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
                newError.password =
                    "Password must meet all criteria (see tooltip)";
                isValid = false;
            }
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
            level: "",
            rating: "",
            exp: "",
            avatar: "",
            general: "",
        });
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            addNotification("error", "Please fix the errors in the form.");
            return;
        }

        const formData = new FormData();
        if (avatarFile) formData.append("avatar", avatarFile);
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        formData.append("username", username);
        formData.append("gender", gender);
        formData.append("bio", bio || "");
        formData.append("university", university || "");
        formData.append("email", email);
        formData.append("role", role);
        formData.append("level", level);
        formData.append("rating", rating);
        formData.append("exp", exp);
        if (password) {
            formData.append("password", password);
            formData.append("password_confirmation", confirmPassword);
        }
        formData.append("_method", "PUT");

        try {
            await axios.get("/sanctum/csrf-cookie");
            await axios.post(`/api/users/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            addNotification("success", "User updated successfully!");
        } catch (error) {
            if (error.response) {
                if (error.response.status === 422) {
                    const validationErrors = error.response.data.errors;
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
                        level: validationErrors.level?.[0] || "",
                        rating: validationErrors.rating?.[0] || "",
                        exp: validationErrors.exp?.[0] || "",
                        avatar: validationErrors.avatar?.[0] || "",
                        general: "",
                    };
                    setError(newError);
                    addNotification(
                        "error",
                        "Please fix the errors in the form."
                    );
                } else if (
                    error.response.status === 401 ||
                    error.response.status === 403
                ) {
                    addNotification(
                        "error",
                        "You are not authorized to perform this action."
                    );
                } else {
                    addNotification(
                        "error",
                        "An error occurred. Please try again."
                    );
                }
            } else {
                addNotification(
                    "error",
                    "Network error. Please check your connection."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.navigation}>
                <Button variant="secondary-form" to="/admin/users">
                    <FaArrowLeft /> Back
                </Button>
            </div>
            {loading && (
                <div className={styles.spinnerContainer}>
                    <div className={styles.spinner}></div>
                </div>
            )}
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
                                initialPreview={currentAvatar}
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
                                            setError({ ...error, gender: "" });
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
                        <div className={styles.inputGroup}>
                            <Input
                                id="level"
                                type="text"
                                value={level}
                                onChange={(e) => handleInputChange(e, "level")}
                                placeholder="Level (1-50)"
                                required
                                min="1"
                                max="50"
                            />
                            {error.level && (
                                <p className={styles.error}>{error.level}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Input
                                id="rating"
                                type="text"
                                value={rating}
                                onChange={(e) => handleInputChange(e, "rating")}
                                placeholder="Rating"
                                required
                                min="0"
                            />
                            {error.rating && (
                                <p className={styles.error}>{error.rating}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Input
                                id="exp"
                                type="text"
                                value={exp}
                                readOnly
                                placeholder="Experience Points"
                                required
                            />
                            {error.exp && (
                                <p className={styles.error}>{error.exp}</p>
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
                                    placeholder="Password (Leave blank to keep unchanged)"
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
                            Update User
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UpdateUser;