import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import debounce from "lodash/debounce";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

// Store SCSS module class names
let styles = {};

const StudentChallengeList = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchFilterLoading, setSearchFilterLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });
  const [stylesLoaded, setStylesLoaded] = useState(false);

  const difficultyOptions = [
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
  ];

  const [tagOptions, setTagOptions] = useState([]);

  // Lazy-load SCSS and use <link> tag
  useEffect(() => {
    let isMounted = true;
    let link;

    const loadStyles = async () => {
      try {
        // Import SCSS module for class names
        const styleModule = await import("./StudentChallengeList.module.scss");
        if (isMounted) {
          styles = styleModule.default || styleModule;
          console.log("Styles loaded:", styles); // Debug

          // Add <link> tag for CSS (mimics production)
          if (!document.querySelector(`link[data-vite-student-challenge]`)) {
            link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = import.meta.env.DEV
              ? "/src/components/StudentChallengeList.module.scss" // Dev path
              : "/assets/StudentChallengeList.module.css"; // Adjust for prod dist/
            link.dataset.viteStudentChallenge = "true";
            document.head.appendChild(link);
          }

          setStylesLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load styles:", err);
        if (isMounted) setError("Failed to load styles.");
      }
    };

    loadStyles();

    // Support HMR in dev
    if (import.meta.hot) {
      import.meta.hot.accept("./StudentChallengeList.module.scss", (newModule) => {
        if (newModule && isMounted) {
          styles = newModule.default || newModule;
          console.log("HMR updated styles:", styles);
          setStylesLoaded(true);
        }
      });
    }

    return () => {
      isMounted = false;
      if (link) link.remove();
    };
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get("/api/challenge-problems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
          params: { rows: 1000 },
        });
        const allTags = [...new Set(response.data.data.flatMap((problem) => problem.tags || []))];
        setTagOptions(allTags.map((tag) => ({ value: tag, label: tag })));
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      }
    };
    fetchTags();
  }, []);

  const fetchChallenges = useCallback(
    debounce(
      async (page = 1, difficulty = filterDifficulty, tags = filterTags, search = searchQuery, sort = sortConfig, isSearchFilter = false) => {
        setLoading(true);
        if (isSearchFilter) setSearchFilterLoading(true);
        setError(null);
        try {
          const response = await axios.get("/api/challenge-problems", {
            params: {
              page,
              difficulty: difficulty.map((d) => d.value),
              tags: tags.map((t) => t.value),
              search,
              sort_key: sort.key,
              sort_direction: sort.direction,
              rows: 10,
            },
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setChallenges(response.data.data || []);
          setPagination(response.data.meta?.pagination || {});
        } catch (err) {
          if (err.response?.status === 401) {
            setError("You are not authorized. Please log in.");
            navigate("/login");
          } else {
            setError("Something went wrong while fetching challenges");
          }
        } finally {
          setLoading(false);
          setHasLoaded(true);
          if (isSearchFilter) setSearchFilterLoading(false);
        }
      },
      200
    ),
    []
  );

  const handlePageChange = (page) => {
    fetchChallenges(page, filterDifficulty, filterTags, searchQuery, sortConfig, false);
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return { key, direction: prevConfig.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <IoIosArrowUp /> : <IoIosArrowDown />;
  };

  useEffect(() => {
    fetchChallenges(1, filterDifficulty, filterTags, searchQuery, sortConfig, false);
  }, []);

  useEffect(() => {
    fetchChallenges(1, filterDifficulty, filterTags, searchQuery, sortConfig, true);
  }, [filterDifficulty, filterTags, searchQuery, sortConfig]);

  if (!stylesLoaded) return <div>Loading styles...</div>;

  return (
    <div className={styles.challengeList}>
      <h1>Challenge Problems</h1>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBar}
        />
        <div className={styles.selectContainer}>
          <Select
            value={filterDifficulty}
            onChange={setFilterDifficulty}
            options={difficultyOptions}
            isMulti
            placeholder="Filter by Difficulty"
            className={styles.select}
            classNamePrefix="react-select"
          />
        </div>
        <div className={styles.selectContainer}>
          <Select
            value={filterTags}
            onChange={setFilterTags}
            options={tagOptions}
            isMulti
            placeholder="Filter by Tags"
            className={styles.select}
            classNamePrefix="react-select"
          />
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={`${styles.problemTable} ${searchFilterLoading ? styles.loading : ""}`}>
          <thead>
            <tr>
              <th onClick={() => handleSort("title")} className={styles.sortable}>
                Title {getSortIndicator("title")}
              </th>
              <th onClick={() => handleSort("difficulty")} className={styles.sortable}>
                Difficulty {getSortIndicator("difficulty")}
              </th>
              <th onClick={() => handleSort("tags")} className={styles.sortable}>
                Tags {getSortIndicator("tags")}
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasLoaded ? (
              <tr>
                <td colSpan="3"></td>
              </tr>
            ) : challenges.length > 0 ? (
              challenges.map((challenge) => (
                <tr key={challenge.id}>
                  <td>
                    <Link to={`/student/challenges/${challenge.id}`} className={styles.problemLink}>
                      {challenge.title || "N/A"}
                    </Link>
                  </td>
                  <td className={styles[challenge.difficulty?.toLowerCase()]}>
                    {challenge.difficulty || "N/A"}
                  </td>
                  <td>{(challenge.tags || []).join(", ")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className={styles.noChallenges}>
                  No challenges found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(pagination.current_page - 1)}
          className={styles.pageButton}
          disabled={pagination.total_pages === 1 || pagination.current_page === 1}
        >
          Previous
        </button>
        {[...Array(pagination.total_pages || 1)].map((_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`${styles.pageButton} ${
              pagination.current_page === index + 1 ? styles.activePage : ""
            }`}
          >
            {index + 1}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(pagination.current_page + 1)}
          className={styles.pageButton}
          disabled={
            pagination.total_pages === 1 || pagination.current_page === pagination.total_pages
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StudentChallengeList;