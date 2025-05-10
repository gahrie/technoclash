import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./GuestNavBar.module.scss";

const GuestNavBar = () => {
    const [isSticky, setIsSticky] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // Sticky navbar and scroll detection
    useEffect(() => {
        const handleScroll = () => {
            requestAnimationFrame(() => {
                setIsSticky(window.scrollY > 100);

                // Detect active section based on scroll position
                const exploreSection = document.getElementById("explore");
                const leaderboardSection =
                    document.getElementById("leaderboard");
                const scrollY = window.scrollY;

                if (exploreSection && leaderboardSection) {
                    const exploreTop = exploreSection.offsetTop - 100;
                    const leaderboardTop = leaderboardSection.offsetTop - 100;

                    if (scrollY >= leaderboardTop) {
                        setActiveSection("leaderboard");
                    } else if (scrollY >= exploreTop) {
                        setActiveSection("explore");
                    } else {
                        setActiveSection("");
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Update active section based on URL hash
    useEffect(() => {
        if (location.pathname === "/" && location.hash) {
            setActiveSection(location.hash.replace("#", ""));
        }
    }, [location]);

    // Smooth scroll to section
    const handleSectionNavigation = (sectionId) => (e) => {
        e.preventDefault();
        if (location.pathname !== "/") {
            navigate("/", { state: { scrollTo: sectionId } });
        } else {
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
                setActiveSection(sectionId);
            }
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Check if on auth pages
    const isLoginPage = location.pathname === "/login";
    const isSignUpCredentialPage = location.pathname === "/signup/credentials";
    const isSignUpInformationPage = location.pathname === "/signup/information";
    const isSignUpVerificationPage =
        location.pathname === "/signup/verify-email";
    const isSignUpCompletedPage = location.pathname === "/signup/completed";

    const isAuthPage =
        isLoginPage ||
        isSignUpCredentialPage ||
        isSignUpInformationPage ||
        isSignUpVerificationPage ||
        isSignUpCompletedPage;

    return (
        <nav
            className={`${styles.navbar} ${
                isSticky ? styles["navbar-sticky"] : ""
            }`}
        >
            <div className={styles["navbar-brand"]}>
                <Link
                    to="/"
                    className={styles["navbar-logo"]}
                    aria-label="TechnoMatch Home"
                >
                    Techno<span>Match</span>
                </Link>
            </div>

            {/* Only show "Home" link if on auth pages */}
            {isAuthPage ? (
                <div className={styles["navbar-menu navbar-menu-desktop"]}>
                    <ul className={styles["navbar-links"]}>
                        <li className={styles["navbar-item"]}>
                            <Link to="/" className={styles["navbar-link"]}>
                                Home
                            </Link>
                        </li>
                    </ul>
                </div>
            ) : (
                <>
                    <button
                        className={styles["navbar-toggle"]}
                        onClick={toggleMenu}
                        aria-label="Toggle navigation menu"
                        aria-expanded={isMenuOpen}
                    >
                        <span className={styles["navbar-toggle-icon"]}>
                            {isMenuOpen ? "✕" : "☰"}
                        </span>
                    </button>

                    <div
                        className={`${styles["navbar-menu"]} ${
                            isMenuOpen ? styles["navbar-menu-open"] : ""
                        }`}
                    >
                        <ul className={styles["navbar-links"]}>
                            <li className={styles["navbar-item"]}>
                                <a
                                    href="#explore"
                                    className={`${styles["navbar-link"]} ${
                                        activeSection === "explore"
                                            ? styles["navbar-link-active"]
                                            : ""
                                    }`}
                                    onClick={handleSectionNavigation("explore")}
                                >
                                    Explore
                                </a>
                            </li>
                            <li className={styles["navbar-item"]}>
                                <a
                                    href="#leaderboard"
                                    className={`${styles["navbar-link"]} ${
                                        activeSection === "leaderboard"
                                            ? styles["navbar-link-active"]
                                            : ""
                                    }`}
                                    onClick={handleSectionNavigation(
                                        "leaderboard"
                                    )}
                                >
                                    Leaderboard
                                </a>
                            </li>
                            <li className={styles["navbar-item"]}>
                                <Link
                                    to="/about"
                                    className={styles["navbar-link"]}
                                >
                                    About Us
                                </Link>
                            </li>
                            <li className={styles["navbar-item"]}>
                                <Link
                                    to="/login"
                                    className={`${styles["navbar-link"]} ${styles["navbar-link-cta"]}`}
                                >
                                    Sign In
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Desktop Menu */}
                    <div
                        className={`${styles["navbar-menu"]} ${styles["navbar-menu-desktop"]}`}
                    >
                        <ul className={styles["navbar-links"]}>
                            <li className={styles["navbar-item"]}>
                                <a
                                    href="#explore"
                                    className={`${styles["navbar-link"]} ${
                                        activeSection === "explore"
                                            ? styles["navbar-link-active"]
                                            : ""
                                    }`}
                                    onClick={handleSectionNavigation("explore")}
                                >
                                    Explore
                                </a>
                            </li>
                            <li className={styles["navbar-item"]}>
                                <a
                                    href="#leaderboard"
                                    className={`${styles["navbar-link"]} ${
                                        activeSection === "leaderboard"
                                            ? styles["navbar-link-active"]
                                            : ""
                                    }`}
                                    onClick={handleSectionNavigation(
                                        "leaderboard"
                                    )}
                                >
                                    Leaderboard
                                </a>
                            </li>
                            <li className={styles["navbar-item"]}>
                                <Link
                                    to="/about"
                                    className={styles["navbar-link"]}
                                >
                                    About Us
                                </Link>
                            </li>
                            <li className={styles["navbar-item"]}>
                                <Link
                                    to="/login"
                                    className={`${styles["navbar-link"]} ${styles["navbar-link-cta"]}`}
                                >
                                    Sign In
                                </Link>
                            </li>
                        </ul>
                    </div>
                </>
            )}
        </nav>
    );
};

export default GuestNavBar;
