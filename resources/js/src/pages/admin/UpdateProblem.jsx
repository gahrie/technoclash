import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import styles from "./UpdateProblem.module.scss";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";

const UpdateProblem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useOutletContext();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [expReward, setExpReward] = useState(""); // For display only
    const [constraints, setConstraints] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [testCases, setTestCases] = useState([{ input: "", expected_output: "", is_sample: false }]);
    const [status, setStatus] = useState("");
    const [serverErrors, setServerErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const difficultyOptions = [
        { value: "easy", label: "Easy" },
        { value: "medium", label: "Medium" },
        { value: "hard", label: "Hard" },
    ];

    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" },
    ];

    useEffect(() => {
        const fetchProblem = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/problems/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const problem = response.data.data;
                setTitle(problem.title || "");
                setDescription(problem.description || "");
                setDifficulty(problem.difficulty?.toLowerCase() || "");
                setExpReward(problem.exp_reward || "");
                setConstraints(problem.constraints || "");
                setTags(problem.tags || []);
                setTestCases(
                    problem.test_cases?.length
                        ? problem.test_cases
                        : [{ input: "", expected_output: "", is_sample: false }]
                );
                setStatus(problem.status?.toLowerCase() || "");
            } catch (error) {
                if (error.response?.status === 404) {
                    addNotification("error", "Problem not found.");
                    setServerErrors({ general: "Problem not found." });
                } else if (error.response?.status === 401) {
                    addNotification("error", "Unauthorized. Please log in.");
                    navigate("/login");
                } else {
                    addNotification("error", "Failed to load problem data.");
                    setServerErrors({ general: "Failed to load problem data." });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id, navigate, addNotification]);

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    const addTestCase = () => {
        setTestCases([...testCases, { input: "", expected_output: "", is_sample: false }]);
    };

    const removeTestCase = (index) => {
        const newTestCases = testCases.filter((_, i) => i !== index);
        setTestCases(newTestCases.length ? newTestCases : [{ input: "", expected_output: "", is_sample: false }]);
    };

    const handleTagInput = (e) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDifficulty("");
        setExpReward("");
        setConstraints("");
        setTags([]);
        setTagInput("");
        setTestCases([{ input: "", expected_output: "", is_sample: false }]);
        setStatus("");
        setServerErrors({});
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("difficulty", difficulty);
        formData.append("constraints", constraints || "");
        formData.append("tags", JSON.stringify(tags));
        formData.append("test_cases", JSON.stringify(testCases));
        formData.append("status", status);
        formData.append("_method", "PUT");

        try {
            setLoading(true);
            await axios.get("/sanctum/csrf-cookie");
            await axios.post(`/api/problems/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            addNotification("success", "Problem updated successfully!");
        } catch (error) {
            if (error.response) {
                if (error.response.status === 422) {
                    const validationErrors = error.response.data.errors;
                    const newServerErrors = {
                        title: validationErrors.title?.[0] || "",
                        description: validationErrors.description?.[0] || "",
                        difficulty: validationErrors.difficulty?.[0] || "",
                        constraints: validationErrors.constraints?.[0] || "",
                        tags: validationErrors.tags?.[0] || "",
                        test_cases: validationErrors.test_cases?.[0] || "",
                        status: validationErrors.status?.[0] || "",
                    };
                    setServerErrors(newServerErrors);
                    addNotification("error", "Please fix the errors in the form.");
                } else if (error.response.status === 401 || error.response.status === 403) {
                    addNotification("error", "You are not authorized to perform this action.");
                    setServerErrors({ general: "You are not authorized to perform this action." });
                } else {
                    addNotification("error", "An error occurred. Please try again.");
                    setServerErrors({ general: "An error occurred. Please try again." });
                }
            } else {
                addNotification("error", "Network error. Please check your connection.");
                setServerErrors({ general: "Network error. Please check your connection." });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.navigation}>
                <Button variant="secondary-form" to="/admin/problems">
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
                    {serverErrors.general && (
                        <div className={styles.error}>{serverErrors.general}</div>
                    )}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Problem Details</h2>
                        <div className={styles.inputGroup}>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setServerErrors({ ...serverErrors, title: "" });
                                }}
                                placeholder="Enter problem title"
                                required
                            />
                            {serverErrors.title && (
                                <p className={styles.error}>{serverErrors.title}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    setServerErrors({ ...serverErrors, description: "" });
                                }}
                                placeholder="Enter problem description"
                                rows={6}
                                required
                            />
                            {serverErrors.description && (
                                <p className={styles.error}>{serverErrors.description}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <CustomSelect
                                id="difficulty"
                                value={difficulty}
                                onChange={(value) => {
                                    setDifficulty(value);
                                    setServerErrors({ ...serverErrors, difficulty: "" });
                                    // Update expReward based on difficulty
                                    switch (value) {
                                        case "easy":
                                            setExpReward(100);
                                            break;
                                        case "medium":
                                            setExpReward(300);
                                            break;
                                        case "hard":
                                            setExpReward(500);
                                            break;
                                        default:
                                            setExpReward("");
                                    }
                                }}
                                options={difficultyOptions}
                                placeholder="Select difficulty"
                                required
                                error={serverErrors.difficulty}
                            />
                            {serverErrors.difficulty && (
                                <p className={styles.error}>{serverErrors.difficulty}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Input
                                id="expReward"
                                type="text"
                                value={expReward}
                                readOnly
                                placeholder="EXP reward (auto-set based on difficulty)"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <CustomSelect
                                id="status"
                                value={status}
                                onChange={(value) => {
                                    setStatus(value);
                                    setServerErrors({ ...serverErrors, status: "" });
                                }}
                                options={statusOptions}
                                placeholder="Select status"
                                required
                                error={serverErrors.status}
                            />
                            {serverErrors.status && (
                                <p className={styles.error}>{serverErrors.status}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Textarea
                                id="constraints"
                                value={constraints}
                                onChange={(e) => {
                                    setConstraints(e.target.value);
                                    setServerErrors({ ...serverErrors, constraints: "" });
                                }}
                                placeholder="Enter constraints"
                                rows={4}
                            />
                            {serverErrors.constraints && (
                                <p className={styles.error}>{serverErrors.constraints}</p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <div className={styles.tagsContainer}>
                                {tags.map((tag, index) => (
                                    <div key={index} className={styles.tag}>
                                        {tag}
                                        <Button
                                            variant="danger"
                                            onClick={() => removeTag(tag)}
                                            className={styles.removeTag}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                                <Input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagInput}
                                    placeholder="Add a tag..."
                                    className={styles.tagInput}
                                />
                            </div>
                            {serverErrors.tags && (
                                <p className={styles.error}>{serverErrors.tags}</p>
                            )}
                        </div>
                    </div>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Test Cases</h2>
                        {testCases.map((testCase, index) => (
                            <div key={index} className={styles.testCaseGroup}>
                                <div className={styles.row}>
                                    <div className={styles.col}>
                                        <div className={styles.inputGroup}>
                                            <Textarea
                                                value={testCase.input}
                                                onChange={(e) =>
                                                    handleTestCaseChange(index, "input", e.target.value)
                                                }
                                                placeholder="Enter test case input"
                                                rows={4}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.col}>
                                        <div className={styles.inputGroup}>
                                            <Textarea
                                                value={testCase.expected_output}
                                                onChange={(e) =>
                                                    handleTestCaseChange(index, "expected_output", e.target.value)
                                                }
                                                placeholder="Enter expected output"
                                                rows={4}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <Checkbox
                                        id={`is_sample_${index}`}
                                        checked={testCase.is_sample}
                                        onChange={(e) =>
                                            handleTestCaseChange(index, "is_sample", e.target.checked)
                                        }
                                        size="large"
                                        label="Mark as sample"
                                        variant="switch"
                                    />
                                </div>
                                {testCases.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="danger"
                                        onClick={() => removeTestCase(index)}
                                        className={styles.removeButton}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="success"
                            onClick={addTestCase}
                            className={styles.addButton}
                        >
                            Add Test Case
                        </Button>
                        {serverErrors.test_cases && (
                            <p className={styles.error}>{serverErrors.test_cases}</p>
                        )}
                    </div>
                    <div className={styles.actions}>
                        <Button
                            type="submit"
                            variant="secondary-form"
                            loading={loading}
                            disabled={loading}
                        >
                            Update Problem
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UpdateProblem;