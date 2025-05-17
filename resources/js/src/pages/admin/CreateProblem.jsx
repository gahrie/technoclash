import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import styles from "./CreateProblem.module.scss";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";

const CreateProblem = () => {
    const navigate = useNavigate();
    const { addNotification } = useOutletContext();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [constraints, setConstraints] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [testCases, setTestCases] = useState([
        { input: "", expected_output: "", is_sample: false },
    ]);
    const [errors, setErrors] = useState({});
    const [serverErrors, setServerErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const difficultyOptions = [
        { value: "easy", label: "Easy" },
        { value: "medium", label: "Medium" },
        { value: "hard", label: "Hard" },
    ];

    const validateForm = () => {
        const newErrors = {};
        if (!title) newErrors.title = "Title is required";
        if (!description) newErrors.description = "Description is required";
        if (!difficulty) newErrors.difficulty = "Difficulty is required";
        if (testCases.length === 0)
            newErrors.testCases = "At least one test case is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    const addTestCase = () => {
        setTestCases([
            ...testCases,
            { input: "", expected_output: "", is_sample: false },
        ]);
    };

    const removeTestCase = (index) => {
        setTestCases(testCases.filter((_, i) => i !== index));
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        setServerErrors({});

        if (!validateForm()) {
            addNotification("error", "Please fix the errors in the form.");
            return;
        }

        const data = {
            title,
            description,
            difficulty,
            constraints,
            tags,
            test_cases: testCases,
            status: "active", // Default status for new problems
        };

        try {
            setLoading(true);
            await axios.get("/sanctum/csrf-cookie");
            await axios.post("/api/problems", data, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            addNotification("success", "Problem created successfully!");
            setTimeout(() => navigate("/admin/problems"), 2000);
        } catch (error) {
            if (error.response) {
                if (error.response.status === 422) {
                    setServerErrors(error.response.data.errors);
                    addNotification(
                        "error",
                        "Please fix the errors in the form."
                    );
                } else if (
                    error.response.status === 401 ||
                    error.response.status === 403
                ) {
                    setServerErrors({
                        general:
                            "You are not authorized to perform this action.",
                    });
                    addNotification(
                        "error",
                        "You are not authorized to perform this action."
                    );
                } else {
                    setServerErrors({
                        general: "An error occurred. Please try again.",
                    });
                    addNotification(
                        "error",
                        "An error occurred. Please try again."
                    );
                }
            } else {
                setServerErrors({
                    general: "Network error. Please check your connection.",
                });
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
                <Button variant="secondary-form" to="/admin/problems">
                    <FaArrowLeft /> Back
                </Button>
            </div>
            {loading && <div className={styles.loading}>Loading...</div>}
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <div className={styles.card}>
                    {serverErrors.general && (
                        <div className={styles.error}>
                            {serverErrors.general}
                        </div>
                    )}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Problem Details
                        </h2>
                        <div className={styles.inputGroup}>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter problem title"
                                required
                            />
                            {(errors.title || serverErrors.title) && (
                                <p className={styles.error}>
                                    {errors.title || serverErrors.title?.[0]}
                                </p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter problem description"
                                rows={6}
                                required
                            />
                            {(errors.description ||
                                serverErrors.description) && (
                                <p className={styles.error}>
                                    {errors.description ||
                                        serverErrors.description?.[0]}
                                </p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <CustomSelect
                                id="difficulty"
                                value={difficulty}
                                onChange={(value) => setDifficulty(value)}
                                options={difficultyOptions}
                                placeholder="Select difficulty"
                                required
                                error={
                                    errors.difficulty || serverErrors.difficulty
                                }
                            />
                            {(errors.difficulty || serverErrors.difficulty) && (
                                <p className={styles.error}>
                                    {errors.difficulty ||
                                        serverErrors.difficulty?.[0]}
                                </p>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <Textarea
                                id="constraints"
                                value={constraints}
                                onChange={(e) => setConstraints(e.target.value)}
                                placeholder="Enter constraints"
                                rows={4}
                            />
                            {serverErrors.constraints && (
                                <p className={styles.error}>
                                    {serverErrors.constraints?.[0]}
                                </p>
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
                                    onChange={(e) =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={handleTagInput}
                                    placeholder="Add a tag..."
                                    className={styles.tagInput}
                                />
                            </div>
                            {serverErrors.tags && (
                                <p className={styles.error}>
                                    {serverErrors.tags?.[0]}
                                </p>
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
                                                    handleTestCaseChange(
                                                        index,
                                                        "input",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter test case input"
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.col}>
                                        <div className={styles.inputGroup}>
                                            <Textarea
                                                value={testCase.expected_output}
                                                onChange={(e) =>
                                                    handleTestCaseChange(
                                                        index,
                                                        "expected_output",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter expected output"
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <Checkbox
                                        id={`is_sample_${index}`}
                                        checked={testCase.is_sample}
                                        onChange={(e) =>
                                            handleTestCaseChange(
                                                index,
                                                "is_sample",
                                                e.target.checked
                                            )
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
                        {errors.testCases && (
                            <p className={styles.error}>{errors.testCases}</p>
                        )}
                    </div>
                    <div className={styles.actions}>
                        <Button
                            type="submit"
                            variant="secondary-form"
                            loading={loading}
                        >
                            Create Problem
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateProblem;