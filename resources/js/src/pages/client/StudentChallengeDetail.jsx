import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Split from "react-split";
import Editor from "@monaco-editor/react";
import axios from "axios";
import styles from "./StudentChallengeDetail.module.scss";
import classNames from "classnames";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

// RapidAPI Judge0 configuration
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const JUDGE0_API_KEY =
    process.env.REACT_APP_JUDGE0_API_KEY ||
    "3c8179566amshcf5a7ade6a901c1p1ce45fjsn03d088b0e648";

const languageOptions = [
    {
        value: 71,
        label: "Python (3.8.1)",
        monaco: "python",
        comment: "# Python Language",
    },
    {
        value: 62,
        label: "Java (OpenJDK 13)",
        monaco: "java",
        comment: "// Java Language",
    },
    {
        value: 52,
        label: "C (GCC 9.2.0)",
        monaco: "c",
        comment: "// C Language",
    },
    {
        value: 39,
        label: "Swift (5.2.4)",
        monaco: "swift",
        comment: "// Swift Language",
    },
    {
        value: 63,
        label: "Node.js (14.15.0)",
        monaco: "javascript",
        comment: "// Node.js Language",
    },
];

const fontFamilyOptions = [
    { value: "Consolas", label: "Consolas" },
    { value: "Courier New", label: "Courier New" },
    { value: "Monaco", label: "Monaco" },
    { value: "Menlo", label: "Menlo" },
];

const fontSizeOptions = [
    { value: 10, label: "10px" },
    { value: 12, label: "12px" },
    { value: 14, label: "14px" },
    { value: 16, label: "16px" },
    { value: 18, label: "18px" },
    { value: 20, label: "20px" },
];

const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "hc-black", label: "High Contrast" },
];

const StudentChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, userId, theme, logout } = useAuth();
    const [ideTheme, setIdeTheme] = useState(theme);
    const [problem, setProblem] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(
        languageOptions[0].value
    );
    const [code, setCode] = useState(() => {
        return (
            localStorage.getItem(`code-${id}-${languageOptions[0].value}`) ||
            languageOptions[0].comment
        );
    });
    const [submissionResult, setSubmissionResult] = useState([]);
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [detailTab, setDetailTab] = useState("instructions");
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isTestCaseCollapsed, setIsTestCaseCollapsed] = useState(false);
    const [fontFamily, setFontFamily] = useState("Consolas");
    const [fontSize, setFontSize] = useState(14);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [expAwarded, setExpAwarded] = useState(0);
    const [wasPreviouslySolved, setWasPreviouslySolved] = useState(false);
    const testCaseRefs = useRef([]);

    const monacoTheme =
        ideTheme === "light"
            ? "vs"
            : ideTheme === "dark"
            ? "vs-dark"
            : "hc-black";

    const testCaseOptions =
        problem?.test_cases?.map((_, index) => ({
            value: index,
            label: `Test Case ${index + 1}`,
        })) || [];

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !userId) {
                setError("Please log in to access this challenge.");
                setLoading(false);
                navigate("/login");
                return;
            }

            try {
                // Fetch problem
                const problemResponse = await axios.get(`/api/problems/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });
                const problemData = problemResponse.data.data;
                setProblem(problemData);
                setCode(
                    localStorage.getItem(`code-${id}-${selectedLanguage}`) ||
                        problemData.templates?.[selectedLanguage] ||
                        languageOptions.find(
                            (lang) => lang.value === selectedLanguage
                        ).comment
                );

                // Fetch user profile
                const profileResponse = await axios.get(
                    `/api/user-profiles/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );
                setUserProfile(profileResponse.data.data);

                // Fetch latest submission
                const submissionResponse = await axios.get(
                    `/api/submissions/latest/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );
                if (
                    submissionResponse.data &&
                    submissionResponse.data.source_code
                ) {
                    setCode(submissionResponse.data.source_code);
                    setSelectedLanguage(submissionResponse.data.language_id);
                }

                setLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                const errorMessage = err.response?.data?.message || err.message;
                setError(errorMessage);
                setLoading(false);
                if (err.response?.status === 401) {
                    logout();
                    navigate("/login");
                }
            }
        };

        fetchData();

        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === "s") {
                event.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [id, token, userId, selectedLanguage, logout, navigate]);

    const handleLanguageChange = (value) => {
        setSelectedLanguage(value);
        const option = languageOptions.find((opt) => opt.value === value);
        const savedCode = localStorage.getItem(`code-${id}-${value}`);
        setCode(savedCode || problem?.templates?.[value] || option.comment);
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        localStorage.setItem(`code-${id}-${selectedLanguage}`, newCode);
    };

    const runCode = async (runAll = false) => {
        if (!token || !userId) {
            setError("Please log in to run code.");
            navigate("/login");
            return;
        }

        setSubmissionResult([]);
        setSubmissionStatus(null);

        try {
            const testCases = problem.test_cases || [];
            if (!testCases.length) throw new Error("No test cases available");

            const results = [];
            const testCasesToRun = runAll
                ? testCases
                : [testCases[selectedTestCase] || testCases[0]];

            for (const [index, testCase] of testCasesToRun.entries()) {
                const stdin = testCase.input || "";
                const expectedOutput = testCase.expected_output || "";
                const driverCode = code.trim();

                const judge0Response = await axios.post(
                    JUDGE0_API_URL,
                    {
                        source_code: driverCode,
                        language_id: selectedLanguage,
                        stdin: stdin,
                        expected_output: expectedOutput,
                        base64_encoded: false,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "X-RapidAPI-Key": JUDGE0_API_KEY,
                            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                        },
                    }
                );

                const submissionToken = judge0Response.data.token;

                let result;
                for (let i = 0; i < 10; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    const statusResponse = await axios.get(
                        `${JUDGE0_API_URL}/${submissionToken}`,
                        {
                            headers: {
                                "X-RapidAPI-Key": JUDGE0_API_KEY,
                                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                            },
                            params: {
                                base64_encoded: false,
                                fields: "stdout,stderr,status,time,memory",
                            },
                        }
                    );

                    const status = statusResponse.data.status.id;
                    if (status === 3 || status > 3) {
                        result = statusResponse.data;
                        break;
                    }
                }

                if (!result) throw new Error("Submission processing timed out");

                results.push({
                    status: result.status.description,
                    stdout: result.stdout || "",
                    stderr: result.stderr || "",
                    time: result.time,
                    memory: result.memory,
                    testCaseInput: stdin,
                    testCaseExpected: expectedOutput,
                });
            }

            console.log("Judge0 Results:", results);
            setSubmissionResult(results);
            return results;
        } catch (err) {
            console.error("Run Code Error:", err);
            const errorResult = {
                status: "error",
                message: err.response?.data?.message || err.message,
            };
            setSubmissionResult([errorResult]);
            setError(errorResult.message);
            throw err;
        }
    };

    const handleSave = async () => {
        try {
            const submissionData = {
                problem_id: id,
                language_id: selectedLanguage,
                source_code: code,
                status: "Saved",
                stdout: null,
                stderr: null,
                execution_time: null,
                memory_used: null,
            };

            await axios.post("/api/submissions", submissionData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            console.log("Code saved successfully");
        } catch (err) {
            console.error("Save error:", err);
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            if (err.response?.status === 401) {
                logout();
                navigate("/login");
            }
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmissionResult([]);
        setSubmissionStatus(null);

        try {
            const results = await runCode(true);

            const allAccepted = results.every(
                (result) => result.status === "Accepted"
            );
            const submissionData = {
                problem_id: id,
                language_id: selectedLanguage,
                source_code: code,
                status: allAccepted ? "Accepted" : "Rejected",
                stdout: results.map((r) => r.stdout).join("\n"),
                stderr: results.map((r) => r.stderr || "").join("\n"),
                execution_time: Math.max(
                    ...results.map((r) => parseFloat(r.time) || 0)
                ),
                memory_used: Math.max(...results.map((r) => r.memory || 0)),
            };

            const response = await axios.post("/api/submissions", submissionData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            setSubmissionStatus(allAccepted ? "accepted" : "rejected");
            if (allAccepted) {
                setExpAwarded(response.data.exp_awarded || 0);
                setWasPreviouslySolved(response.data.was_previously_solved || false);
                setShowSuccessModal(true);
            }
        } catch (err) {
            console.error("Submission error:", err);
            const errorMessage = err.response?.data?.message || err.message;
            setSubmissionStatus("rejected");
            setError(errorMessage);
            if (err.response?.status === 401) {
                logout();
                navigate("/login");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        setExpAwarded(0);
        setWasPreviouslySolved(false);
        navigate(`/progressive`);
    };

    const handleBack = () => {
        navigate(`/progressive`);
    };

    if (loading)
        return (
            <div className={styles.spinnerContainer}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        );
    if (error) return <div className={styles.errorMessage}>Error: {error}</div>;
    if (!problem)
        return <div className={styles.errorMessage}>Problem not found</div>;

    return (
        <div className={styles.container}>
            {showSuccessModal && (
                <div className={styles.successModal}>
                    <div className={styles.modalContent}>
                        <h2>Success!</h2>
                        {expAwarded > 0 ? (
                            <p>
                                Congratulations! Your solution was accepted and you
                                earned {expAwarded} EXP.
                            </p>
                        ) : (
                            <>
                                <p>
                                    Congratulations! Your solution was accepted.
                                </p>
                                <p className={styles.noExpMessage}>
                                    This problem was previously solved, so no additional EXP was awarded.
                                </p>
                            </>
                        )}
                        <button
                            className={styles.modalButton}
                            onClick={handleCloseModal}
                        >
                            Back to Challenges
                        </button>
                    </div>
                </div>
            )}
            <Split
                className={styles.split}
                sizes={[60, 40]}
                minSize={200}
                gutterSize={5}
                direction="horizontal"
            >
                <div className={styles.leftPanel}>
                    <div className={styles.userInfo}>
                        {userProfile && (
                            <p>
                                Level {userProfile.level}, EXP: {userProfile.exp}/
                                {userProfile.level < 50
                                    ? problem?.levels?.find(
                                        (lvl) => lvl.level === userProfile.level + 1
                                    )?.minimum_exp || 999999
                                    : 999999}
                            </p>
                        )}
                    </div>
                    <div className={styles.editorHeader}>
                        <CustomSelect
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                            options={languageOptions}
                            className={styles.languageSelect}
                            placeholder="Language"
                        />
                    </div>
                    <div className={styles.editorSettings}>
                        <div>
                            <CustomSelect
                                value={fontFamily}
                                onChange={setFontFamily}
                                options={fontFamilyOptions}
                                placeholder="Font Family"
                            />
                        </div>
                        <div>
                            <CustomSelect
                                value={fontSize}
                                onChange={setFontSize}
                                options={fontSizeOptions}
                                placeholder="Font Size"
                            />
                        </div>
                        <div>
                            <CustomSelect
                                value={ideTheme}
                                onChange={setIdeTheme}
                                options={themeOptions}
                                placeholder="Theme"
                            />
                        </div>
                    </div>
                    <Editor
                        height="calc(100% - 100px)"
                        language={
                            languageOptions.find(
                                (lang) => lang.value === selectedLanguage
                            ).monaco
                        }
                        theme={monacoTheme}
                        value={code}
                        onChange={handleCodeChange}
                        options={{
                            minimap: { enabled: false },
                            fontSize: fontSize,
                            fontFamily: fontFamily,
                            automaticLayout: true,
                        }}
                    />
                    <div className={styles.buttonContainer}>
                        <Button
                            className={styles.runButton}
                            onClick={() => runCode(false)}
                            variant="secondary-form"
                            disabled={isSubmitting}
                        >
                            Run
                        </Button>
                        <Button
                            className={styles.submitButton}
                            onClick={handleSubmit}
                            variant="primary-form"
                            disabled={isSubmitting}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
                <div className={styles.rightPanel}>
                    <div className={styles.tabSection}>
                        <div className={styles.sectionHeader}>
                            <h2>Problem Details</h2>
                            <button
                                className={classNames(styles.collapseButton, {
                                    [styles.collapsed]: isCollapsed,
                                    [styles.expanded]: !isCollapsed,
                                })}
                                onClick={() => setIsCollapsed(!isCollapsed)}
                            >
                                {isCollapsed ? "Show Details" : "Hide Details"}
                                <span className={styles.arrow}>›</span>
                            </button>
                        </div>
                        <div
                            className={classNames(styles.collapsibleContent, {
                                [styles.collapsed]: isCollapsed,
                            })}
                        >
                            <div className={styles.tabNavigation}>
                                <button
                                    className={classNames(styles.tab, {
                                        [styles.active]:
                                            detailTab === "instructions",
                                    })}
                                    onClick={() => setDetailTab("instructions")}
                                >
                                    Instructions
                                </button>
                                <button
                                    className={classNames(styles.tab, {
                                        [styles.active]:
                                            detailTab === "constraints",
                                    })}
                                    onClick={() => setDetailTab("constraints")}
                                >
                                    Constraints
                                </button>
                            </div>
                            <div className={styles.tabContent}>
                                {detailTab === "instructions" ? (
                                    <div className={styles.instructions}>
                                        <h3>Instructions</h3>
                                        <p>{problem.description}</p>
                                    </div>
                                ) : (
                                    <div className={styles.constraints}>
                                        <h3>Constraints</h3>
                                        <ul>
                                            {problem.constraints
                                                .split("\n")
                                                .map((constraint, index) => (
                                                    <li key={index}>
                                                        {constraint}
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.tabSection}>
                        <div className={styles.sectionHeader}>
                            <h2>Test Cases</h2>
                            <button
                                className={classNames(styles.collapseButton, {
                                    [styles.collapsed]: isTestCaseCollapsed,
                                    [styles.expanded]: !isTestCaseCollapsed,
                                })}
                                onClick={() =>
                                    setIsTestCaseCollapsed(!isTestCaseCollapsed)
                                }
                            >
                                {isTestCaseCollapsed
                                    ? "Show Test Cases"
                                    : "Hide Test Cases"}
                                <span className={styles.arrow}>›</span>
                            </button>
                        </div>
                        <div
                            className={classNames(styles.collapsibleContent, {
                                [styles.collapsed]: isTestCaseCollapsed,
                            })}
                        >
                            <div className={styles.testCaseNavigation}>
                                {testCaseOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={classNames(
                                            styles.testCaseButton,
                                            {
                                                [styles.active]:
                                                    selectedTestCase ===
                                                    option.value,
                                            }
                                        )}
                                        onClick={() =>
                                            setSelectedTestCase(option.value)
                                        }
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.detailContainer}>
                                {testCaseOptions.length > 0 ? (
                                    testCaseOptions.map((option, index) => (
                                        <div
                                            key={option.value}
                                            ref={(el) =>
                                                (testCaseRefs.current[
                                                    option.value
                                                ] = el)
                                            }
                                            style={{
                                                display:
                                                    selectedTestCase ===
                                                    option.value
                                                        ? "block"
                                                        : "none",
                                            }}
                                        >
                                            <h3>
                                                Test Case {option.value + 1}
                                            </h3>
                                            <div className={styles.detailContent}>
                                                <h4>
                                                    <strong>Input:</strong>
                                                </h4>
                                                <p>
                                                    {
                                                        problem.test_cases[
                                                            option.value
                                                        ].input
                                                    }
                                                </p>
                                            </div>
                                            <hr className={styles.divider} />
                                            <div className={styles.outputSection}>
                                                <strong>
                                                    Expected Output:
                                                </strong>
                                                <p className={styles.preWrap}>
                                                    {
                                                        problem.test_cases[
                                                            option.value
                                                        ].expected_output
                                                    }
                                                </p>
                                            </div>
                                            <hr className={styles.divider} />
                                            <div
                                                className={classNames(
                                                    styles.outputSection,
                                                    {
                                                        [styles.wrongAnswer]:
                                                            submissionResult[
                                                                option.value
                                                            ]?.status ===
                                                            "Wrong Answer",
                                                        [styles.success]:
                                                            submissionResult[
                                                                option.value
                                                            ]?.status ===
                                                            "Accepted",
                                                    }
                                                )}
                                            >
                                                <strong>Your Output:</strong>
                                                <p className={styles.preWrap}>
                                                    {submissionResult[
                                                        option.value
                                                    ]?.stdout ||
                                                        submissionResult[
                                                            option.value
                                                        ]?.stderr ||
                                                        "No Output"}
                                                </p>
                                            </div>
                                            <hr className={styles.divider} />
                                        </div>
                                    ))
                                ) : (
                                    <p>No test cases available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Split>
        </div>
    );
};

export default StudentChallengeDetail;