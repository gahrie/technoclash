import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Split from "react-split";
import Editor from "@monaco-editor/react";
import axios from "axios";
import styles from "./CompetitiveMatch.module.scss";
import classNames from "classnames";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import Pusher from "pusher-js";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const JUDGE0_API_KEY =
    process.env.REACT_APP_JUDGE0_API_KEY || "your-judge0-api-key";

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

const CompetitiveMatch = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { token, userId, theme, logout } = useAuth();
    const [ideTheme, setIdeTheme] = useState(theme);
    const [match, setMatch] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProblem, setSelectedProblem] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState(
        languageOptions[0].value
    );
    const [code, setCode] = useState(languageOptions[0].comment);
    const [submissionResults, setSubmissionResults] = useState({});
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [detailTab, setDetailTab] = useState("instructions");
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isTestCaseCollapsed, setIsTestCaseCollapsed] = useState(false);
    const [fontFamily, setFontFamily] = useState("Consolas");
    const [fontSize, setFontSize] = useState(14);
    const [scores, setScores] = useState({});
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [remainingTime, setRemainingTime] = useState(null);
    const [hasFinished, setHasFinished] = useState(false);
    const testCaseRefs = useRef([]);

    const monacoTheme =
        ideTheme === "light" ? "vs" : ideTheme === "dark" ? "vs-dark" : "hc-black";

    const problemOptions =
        match?.problems?.map((problem, index) => ({
            value: index,
            label: `${problem.title} (${problem.difficulty})`,
        })) || [];

    const testCaseOptions =
        match?.problems?.[selectedProblem]?.test_cases?.map((_, index) => ({
            value: index,
            label: `Test Case ${index + 1}`,
        })) || [];

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !userId) {
                setError("Please log in to access this match.");
                setLoading(false);
                navigate("/login");
                return;
            }

            try {
                const matchResponse = await axios.get(
                    `/api/student/competitive/rooms/${roomId}/match`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (
                    !matchResponse.data?.problems ||
                    matchResponse.data.problems.length === 0
                ) {
                    throw new Error("No problems available for this match.");
                }

                setMatch(matchResponse.data);

                const profileResponse = await axios.get(
                    `/api/user-profiles/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUserProfile(profileResponse.data.data);

                const problemId = matchResponse.data.problems[0].id;
                const savedCode = localStorage.getItem(
                    `match-code-${roomId}-${problemId}-${selectedLanguage}`
                );
                setCode(
                    savedCode ||
                        matchResponse.data.problems[0].templates?.[
                            selectedLanguage
                        ] ||
                        languageOptions[0].comment
                );

                const initialScores = {};
                matchResponse.data.submissions.forEach((submission) => {
                    initialScores[submission.problem_id] = submission.score;
                });
                setScores(initialScores);
                setSubmissionResults(
                    matchResponse.data.submissions.reduce(
                        (acc, sub) => ({
                            ...acc,
                            [sub.problem_id]: sub.test_case_results,
                        }),
                        {}
                    )
                );

                setLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to load match data."
                );
                setLoading(false);
                if (err.response?.status === 401) {
                    logout();
                    navigate("/login");
                }
            }
        };

        fetchData();

        const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
        const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;
        let pusher;
        if (pusherKey && pusherCluster) {
            pusher = new Pusher(pusherKey, {
                cluster: pusherCluster,
                encrypted: true,
                authEndpoint: `${
                    import.meta.env.VITE_API_URL
                }/broadcasting/auth`,
                auth: { headers: { Authorization: `Bearer ${token}` } },
            });

            const channel = pusher.subscribe(`room-${roomId}`);
            channel.bind("submission-updated", (data) => {
                setScores((prev) => ({
                    ...prev,
                    [data.problem_id]: data.score,
                }));
            });

            channel.bind("match-started", (data) => {
                setMatch((prev) => ({
                    ...prev,
                    room: {
                        ...prev.room,
                        started_at: data.started_at,
                        duration: data.duration,
                    },
                }));
            });

            channel.bind("match-finished", (data) => {
                if (data.user_id === userId) {
                    setHasFinished(true);
                }
            });

            channel.bind("match-ended", () => {
                if (!hasFinished) {
                    confirmFinish(true);
                }
            });

            return () => {
                if (pusher) {
                    pusher.unsubscribe(`room-${roomId}`);
                    pusher.disconnect();
                }
            };
        }

        return () => {};
    }, [roomId, token, userId, navigate, logout]);

    useEffect(() => {
        if (!match?.room?.started_at || !match?.room?.duration || hasFinished) {
            return;
        }

        const startTime = new Date(match.room.started_at).getTime();
        const durationMs = match.room.duration * 60 * 1000;
        const endTime = startTime + durationMs;

        if (isNaN(startTime) || durationMs <= 0) {
            console.error("Invalid match timing data:", {
                started_at: match.room.started_at,
                duration: match.room.duration,
            });
            setError("Invalid match timing data.");
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
            setRemainingTime(timeLeft);

            if (timeLeft === 0 && !hasFinished) {
                console.log("Match timed out, triggering auto-finish");
                confirmFinish(true);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [match, hasFinished]);

    const handleProblemChange = (value) => {
        setSelectedProblem(value);
        const problemId = match?.problems?.[value]?.id;
        if (problemId) {
            const savedCode = localStorage.getItem(
                `match-code-${roomId}-${problemId}-${selectedLanguage}`
            );
            setCode(
                savedCode ||
                    match?.problems?.[value]?.templates?.[selectedLanguage] ||
                    languageOptions.find(
                        (lang) => lang.value === selectedLanguage
                    ).comment
            );
        }
        setSelectedTestCase(0);
        setSubmissionStatus(null);
    };

    const handleLanguageChange = (value) => {
        setSelectedLanguage(value);
        const problemId = match?.problems?.[selectedProblem]?.id;
        if (problemId) {
            const savedCode = localStorage.getItem(
                `match-code-${roomId}-${problemId}-${value}`
            );
            setCode(
                savedCode ||
                    match?.problems?.[selectedProblem]?.templates?.[value] ||
                    languageOptions.find((lang) => lang.value === value).comment
            );
        }
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        const problemId = match?.problems?.[selectedProblem]?.id;
        if (problemId) {
            localStorage.setItem(
                `match-code-${roomId}-${problemId}-${selectedLanguage}`,
                newCode
            );
        }
    };

    const runCode = async (runAll = false) => {
        if (!token || !userId) {
            setError("Please log in to run code.");
            navigate("/login");
            return;
        }

        const problemId = match?.problems?.[selectedProblem]?.id;
        if (!problemId) {
            setError("No problem selected.");
            return;
        }

        setSubmissionResults((prev) => ({ ...prev, [problemId]: [] }));
        setSubmissionStatus(null);

        try {
            const testCases =
                match?.problems?.[selectedProblem]?.test_cases || [];
            if (!testCases.length) throw new Error("No test cases available");

            const results = [];
            const testCasesToRun = runAll
                ? testCases
                : [testCases[selectedTestCase] || testCases[0]];

            for (const testCase of testCasesToRun) {
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

            setSubmissionResults((prev) => ({
                ...prev,
                [problemId]: results,
            }));
            return results;
        } catch (err) {
            console.error("Run Code Error:", err);
            const errorResult = {
                status: "error",
                message: err.response?.data?.message || err.message,
            };
            setSubmissionResults((prev) => ({
                ...prev,
                [problemId]: [errorResult],
            }));
            setError(errorResult.message);
            throw err;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const problemId = match?.problems?.[selectedProblem]?.id;
        if (!problemId) {
            setError("No problem selected.");
            setIsSubmitting(false);
            return;
        }

        setSubmissionResults((prev) => ({ ...prev, [problemId]: [] }));
        setSubmissionStatus(null);

        try {
            const results = await runCode(true);
            const testCaseResults = results.map((result) => result.status);
            const score = testCaseResults.reduce(
                (acc, result) => acc + (result === "Accepted" ? 2 : 0),
                0
            );

            const submissionData = {
                problem_id: problemId,
                language_id: selectedLanguage,
                source_code: code,
                test_case_results: testCaseResults,
            };

            const response = await axios.post(
                `/api/student/competitive/rooms/${roomId}/submit`,
                submissionData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSubmissionStatus(
                testCaseResults.every((r) => r === "Accepted")
                    ? "accepted"
                    : "rejected"
            );
            setScores((prev) => ({ ...prev, [problemId]: score }));
        } catch (err) {
            console.error("Submission error:", err);
            setSubmissionStatus("rejected");
            setError(err.response?.data?.message || err.message);
            if (err.response?.status === 401) {
                logout();
                navigate("/login");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinish = () => {
        setShowFinishModal(true);
    };

    const confirmFinish = async (isAutoFinish = false) => {
        if (hasFinished) return;

        try {
            const response = await axios.post(
                `/api/student/competitive/rooms/${roomId}/finish`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHasFinished(true);
            alert(
                `Match finished! Your final score: ${response.data.total_score}, Placement: ${response.data.placement}`
            );
            navigate("/competitive");
        } catch (err) {
            console.error("Finish match error:", err);
            setError(err.response?.data?.message || "Failed to finish match.");
            if (err.response?.status === 401) {
                logout();
                navigate("/login");
            }
        } finally {
            if (!isAutoFinish) {
                setShowFinishModal(false);
            }
        }
    };

    const cancelFinish = () => {
        setShowFinishModal(false);
    };

    const totalScore = Object.values(scores).reduce(
        (acc, score) => acc + score,
        0
    );

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    if (loading)
        return (
            <div className={styles.spinnerContainer}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        );
    if (error) return <div className={styles.errorMessage}>Error: {error}</div>;
    if (!match || !match.problems?.length)
        return (
            <div className={styles.errorMessage}>
                No problems available for this match.
            </div>
        );

    return (
        <div className={styles.container}>
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
                                Level {userProfile.level}, EXP:{" "}
                                {userProfile.exp}/
                                {userProfile.level < 50 ? 1000 : 999999}
                            </p>
                        )}
                        <p>Total Score: {totalScore}/60</p>
                        {remainingTime !== null && (
                            <p
                                className={classNames(styles.timer, {
                                    [styles.timerWarning]: remainingTime <= 300,
                                })}
                            >
                                Time Left: {formatTime(remainingTime)}
                            </p>
                        )}
                    </div>
                    <div className={styles.editorHeader}>
                        <CustomSelect
                            value={selectedProblem}
                            onChange={handleProblemChange}
                            options={problemOptions}
                            className={styles.problemSelect}
                            placeholder="Select Problem"
                        />
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
                        height="calc(100% - 150px)"
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
                            disabled={isSubmitting || hasFinished}
                        >
                            Run
                        </Button>
                        <Button
                            className={styles.submitButton}
                            onClick={handleSubmit}
                            variant="primary-form"
                            disabled={isSubmitting || hasFinished}
                        >
                            Submit
                        </Button>
                        <Button
                            className={styles.finishButton}
                            onClick={handleFinish}
                            variant="primary-form"
                            disabled={hasFinished}
                        >
                            Finish Match
                        </Button>
                    </div>
                </div>
                <div className={styles.rightPanel}>
                    <div className={styles.tabSection}>
                        <div className={styles.sectionHeader}>
                            <h2>{match.problems[selectedProblem].title}</h2>
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
                                        <p>
                                            {
                                                match.problems[selectedProblem]
                                                    .description
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <div className={styles.constraints}>
                                        <h3>Constraints</h3>
                                        <ul>
                                            {match.problems[
                                                selectedProblem
                                            ].constraints
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
                            <h2>
                                Test Cases (Score:{" "}
                                {scores[match.problems[selectedProblem].id] ||
                                    0}
                                /10)
                            </h2>
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
                                            <div
                                                className={styles.detailContent}
                                            >
                                                <h4>
                                                    <strong>Input:</strong>
                                                </h4>
                                                <p>
                                                    {
                                                        match.problems[
                                                            selectedProblem
                                                        ].test_cases[
                                                            option.value
                                                        ].input
                                                    }
                                                </p>
                                            </div>
                                            <hr className={styles.divider} />
                                            <div
                                                className={styles.outputSection}
                                            >
                                                <strong>
                                                    Expected Output:
                                                </strong>
                                                <p className={styles.preWrap}>
                                                    {
                                                        match.problems[
                                                            selectedProblem
                                                        ].test_cases[
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
                                                            submissionResults[
                                                                match.problems[
                                                                    selectedProblem
                                                                ].id
                                                            ]?.[option.value]
                                                                ?.status ===
                                                            "Wrong Answer",
                                                        [styles.success]:
                                                            submissionResults[
                                                                match.problems[
                                                                    selectedProblem
                                                                ].id
                                                            ]?.[option.value]
                                                                ?.status ===
                                                            "Accepted",
                                                    }
                                                )}
                                            >
                                                <strong>Your Output:</strong>
                                                <p className={styles.preWrap}>
                                                    {submissionResults[
                                                        match.problems[
                                                            selectedProblem
                                                        ].id
                                                    ]?.[option.value]?.stdout ||
                                                        submissionResults[
                                                            match.problems[
                                                                selectedProblem
                                                            ].id
                                                        ]?.[option.value]
                                                            ?.stderr ||
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
            {showFinishModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            Confirm Finish Match
                        </div>
                        <div className={styles.modalBody}>
                            Are you sure you want to finish the match? Your
                            current score is {totalScore}/60. This action cannot
                            be undone.
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={classNames(
                                    styles.modalButton,
                                    styles.cancelButton
                                )}
                                onClick={cancelFinish}
                            >
                                Cancel
                            </button>
                            <button
                                className={classNames(
                                    styles.modalButton,
                                    styles.confirmButton
                                )}
                                onClick={() => confirmFinish(false)}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitiveMatch;
