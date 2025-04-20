import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Split from "react-split";
import Editor from "@monaco-editor/react";
import Select from "react-select";
import axios from "axios";
import styles from "./StudentChallengeDetail.module.scss";
import classNames from "classnames";

const languageOptions = [
  { value: 71, label: "Python (3.8.1)", monaco: "python", comment: "# Python Language" },
  { value: 62, label: "Java (OpenJDK 13)", monaco: "java", comment: "// Java Language" },
  { value: 52, label: "C (GCC 9.2.0)", monaco: "c", comment: "// C Language" },
];

const StudentChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [code, setCode] = useState(() => {
    return localStorage.getItem(`code-${id}-${languageOptions[0].value}`) || languageOptions[0].comment;
  });
  const [submissionResult, setSubmissionResult] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [resultTab, setResultTab] = useState("testcase");
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const testCaseRefs = useRef([]);

  const sanctumToken = localStorage.getItem("token");

  useEffect(() => {
    const fetchProblemAndSubmission = async () => {
      try {
        const problemResponse = await axios.get(`/api/challenge-problems/${id}`, {
          headers: {
            Authorization: `Bearer ${sanctumToken}`,
            Accept: "application/json",
          },
        });
        const problemData = problemResponse.data.data;
        setProblem(problemData);
        setCode(
          localStorage.getItem(`code-${id}-${selectedLanguage.value}`) ||
            problemData.templates?.[selectedLanguage.value] ||
            selectedLanguage.comment
        );

        const submissionResponse = await axios.get(`/api/submissions/latest/${id}`, {
          headers: {
            Authorization: `Bearer ${sanctumToken}`,
            Accept: "application/json",
          },
        });
        if (submissionResponse.data && submissionResponse.data.source_code) {
          setCode(submissionResponse.data.source_code);
          setSelectedLanguage(
            languageOptions.find((lang) => lang.value === submissionResponse.data.language_id) || languageOptions[0]
          );
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProblemAndSubmission();

    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [id, sanctumToken, selectedLanguage]);

  const handleLanguageChange = (option) => {
    setSelectedLanguage(option);
    const savedCode = localStorage.getItem(`code-${id}-${option.value}`);
    setCode(savedCode || problem?.templates?.[option.value] || option.comment);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    localStorage.setItem(`code-${id}-${selectedLanguage.value}`, newCode);
  };

  const handleTestCaseClick = (index) => {
    setSelectedTestCase(index);
    testCaseRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  const runCode = async (runAll = false) => {
    setSubmissionResult(null);
    setSubmissionStatus(null);
    try {
      const testCases = problem.test_cases || [];
      if (!testCases.length) throw new Error("No test cases available");

      const results = [];
      const testCasesToRun = runAll ? testCases : [testCases[selectedTestCase] || testCases[0]];

      for (const testCase of testCasesToRun) {
        const stdin = testCase.input || "";
        const expectedOutput = testCase.expected_output || "";
        const driverCode = code.trim();

        const judge0Response = await axios.post(
          "https://judge0-ce.p.rapidapi.com/submissions",
          {
            source_code: driverCode,
            language_id: selectedLanguage.value,
            stdin: stdin,
            expected_output: expectedOutput,
            base64_encoded: false,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": "3c8179566amshcf5a7ade6a901c1p1ce45fjsn03d088b0e648",
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        const submissionToken = judge0Response.data.token;

        let result;
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const statusResponse = await axios.get(
            `https://judge0-ce.p.rapidapi.com/submissions/${submissionToken}`,
            {
              headers: {
                "X-RapidAPI-Key": "3c8179566amshcf5a7ade6a901c1p1ce45fjsn03d088b0e648",
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              },
              params: { base64_encoded: false, fields: "stdout,stderr,status,time,memory" },
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
        message: err.message,
      };
      setSubmissionResult([errorResult]);
      throw err;
    }
  };

  const handleSave = async () => {
    try {
      const submissionData = {
        challenge_problem_id: id,
        language_id: selectedLanguage.value,
        source_code: code,
        status: "Saved",
        stdout: null,
        stderr: null,
        execution_time: null,
        memory_used: null,
      };

      await axios.post("/api/submissions", submissionData, {
        headers: {
          Authorization: `Bearer ${sanctumToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("Code saved successfully");
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionResult(null);
    setSubmissionStatus(null);

    try {
      const results = await runCode(true); // Run all test cases

      const allAccepted = results.every((result) => result.status === "Accepted");
      const submissionData = {
        challenge_problem_id: id,
        language_id: selectedLanguage.value,
        source_code: code,
        status: allAccepted ? "Accepted" : "Rejected",
        stdout: results.map((r) => r.stdout).join("\n"),
        stderr: results.map((r) => r.stderr || "").join("\n"),
        execution_time: Math.max(...results.map((r) => parseFloat(r.time) || 0)),
        memory_used: Math.max(...results.map((r) => r.memory || 0)),
      };

      await axios.post("/api/submissions", submissionData, {
        headers: {
          Authorization: `Bearer ${sanctumToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      setSubmissionStatus(allAccepted ? "accepted" : "rejected");
    } catch (err) {
      console.error("Submission error:", err);
      setSubmissionStatus("rejected");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/student/challenges`);
  };

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  if (error) return <div>Error: {error}</div>;
  if (!problem) return <div>Problem not found</div>;

  return (
    <div className={styles.container}>
      <Split className={styles.split} sizes={[50, 50]} minSize={300} gutterSize={5} direction="horizontal">
        <div className={styles.leftPanel}>
          <div className={styles.problemDetails}>
            <div className={styles.navigation}>
              <button onClick={handleBack} className={styles.navButton}>
                Back
              </button>
            </div>
            <h1>{problem.title}</h1>
            <div className={styles.difficulty}>
              <h2>Difficulty</h2>
              <span className={styles[problem.difficulty?.toLowerCase() || "default"]}>{problem.difficulty}</span>
            </div>
            <div className={styles.description}>{problem.description}</div>
            <div className={styles.constraints}>
              <h2>Constraints</h2>
              <ul>
                {problem.constraints.split("\n").map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
            <div className={styles.tags}>
              <h2>Tags</h2>
              <p>{problem.tags.join(", ")}</p>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <Split
            className={styles.verticalSplit}
            sizes={[50, 25, 25]}
            minSize={100}
            gutterSize={5}
            direction="vertical"
          >
            <div className={styles.editorContainer}>
              <div className={styles.languageSelector}>
                <Select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  options={languageOptions}
                  placeholder="Select Language"
                />
              </div>
              <Editor
                height="100%"
                language={selectedLanguage.monaco}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  automaticLayout: true,
                }}
              />
            </div>

            <div className={styles.testCasesPanel}>
              <div className={styles.testCaseTabs}>
                {Array.isArray(problem.test_cases) && problem.test_cases.length > 0 ? (
                  problem.test_cases.map((_, index) => (
                    <button
                      key={index}
                      className={classNames(styles.testCaseTab, {
                        [styles.active]: selectedTestCase === index,
                      })}
                      onClick={() => handleTestCaseClick(index)}
                    >
                      Case {index + 1}
                    </button>
                  ))
                ) : (
                  <div>No test cases available</div>
                )}
              </div>

              <div className={styles.testCaseContent}>
                {Array.isArray(problem.test_cases) && problem.test_cases.length > 0 && (
                  <div
                    ref={(el) => (testCaseRefs.current[selectedTestCase] = el)}
                    className={classNames(styles.testCase, {
                      [styles.success]: submissionStatus === "accepted" && !isSubmitting,
                      [styles.error]: submissionStatus === "rejected" && !isSubmitting,
                    })}
                  >
                    <p>
                      <strong>Input:</strong> {problem.test_cases[selectedTestCase].input}
                    </p>
                    <p>
                      <strong>Expected Output:</strong> {problem.test_cases[selectedTestCase].expected_output}
                    </p>
                  </div>
                )}
              </div>

              <div className={styles.buttonContainer}>
                <button onClick={() => runCode(false)} className={styles.runButton}>
                  Run Code
                </button>
                <button
                  onClick={handleSubmit}
                  className={classNames(styles.submitButton, { [styles.submitting]: isSubmitting })}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className={styles.loadingSpinner}></span> : "Submit"}
                </button>
              </div>
            </div>

            <div className={styles.resultsPanel}>
              <div className={styles.resultTabs}>
                <button
                  className={`${styles.resultTab} ${resultTab === "testcase" ? styles.active : ""}`}
                  onClick={() => setResultTab("testcase")}
                >
                  Testcase
                </button>
                <button
                  className={`${styles.resultTab} ${resultTab === "result" ? styles.active : ""}`}
                  onClick={() => setResultTab("result")}
                >
                  Result
                </button>
              </div>

              <div className={styles.resultContent}>
                {submissionResult ? (
                  resultTab === "testcase" ? (
                    <div className={styles.testCaseResult}>
                      {submissionResult.map((result, index) => (
                        <div key={index} className={styles.testCaseItem}>
                          <h4>Test Case {index + 1}</h4>
                          <p>
                            <strong>Input:</strong>
                            <pre>{result.testCaseInput}</pre>
                          </p>
                          <p>
                            <strong>Expected Output:</strong>
                            <pre>{result.testCaseExpected}</pre>
                          </p>
                          <p>
                            <strong>Your Output:</strong>
                            <pre>{result.stdout}</pre>
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.executionResult}>
                      {submissionStatus === "accepted" ? (
                        <div className={styles.successMessage}>
                          <h3>Accepted</h3>
                          <p>Your submission passed all test cases.</p>
                        </div>
                      ) : submissionStatus === "rejected" ? (
                        <div className={styles.errorMessage}>
                          <h3>Rejected</h3>
                          {submissionResult.some((r) => r.stderr) ? (
                            <p>
                              <strong>Stderr:</strong>
                              <pre>{submissionResult.map((r) => r.stderr || "").join("\n")}</pre>
                            </p>
                          ) : (
                            <p>
                              Wrong Answer: Your output didn’t match the expected output for one or more test cases.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {submissionResult.every((r) => r.status === "Accepted") ? (
                            <div className={styles.successMessage}>
                              <h3>Accepted</h3>
                              <p>Your code passed the selected test case(s). Submit to verify all cases.</p>
                            </div>
                          ) : (
                            <div className={styles.errorMessage}>
                              <h3>{submissionResult[0].status}</h3>
                              {submissionResult.some((r) => r.stderr) ? (
                                <p>
                                  <strong>Stderr:</strong>
                                  <pre>{submissionResult.map((r) => r.stderr || "").join("\n")}</pre>
                                </p>
                              ) : (
                                <p>Wrong Answer: Your output didn’t match the expected output.</p>
                              )}
                            </div>
                          )}
                          <div className={styles.executionDetails}>
                            <p>
                              Time: {Math.max(...submissionResult.map((r) => parseFloat(r.time) || 0))} s
                            </p>
                            <p>
                              Memory: {Math.max(...submissionResult.map((r) => r.memory || 0))} KB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <p className={styles.noResult}>Run your code to see results here.</p>
                )}
              </div>
            </div>
          </Split>
        </div>
      </Split>
    </div>
  );
};

export default StudentChallengeDetail;