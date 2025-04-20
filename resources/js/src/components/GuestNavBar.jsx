import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./GuestNavBar.module.scss";

const GuestNavBar = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(""); // Track active section
  const navigate = useNavigate();
  const location = useLocation();

  // Sticky navbar and scroll detection
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setIsSticky(window.scrollY > 100);

        // Detect active section based on scroll position
        const exploreSection = document.getElementById("explore");
        const leaderboardSection = document.getElementById("leaderboard");
        const scrollY = window.scrollY;

        if (exploreSection && leaderboardSection) {
          const exploreTop = exploreSection.offsetTop - 100; // Offset for navbar height
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

  // Update active section based on URL hash (e.g., from clicking a link)
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
        setActiveSection(sectionId); // Set active section on click
      }
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  // Check if on the login page
  const isLoginPage = location.pathname === "/login";
  const isSignUpCredentialPage = location.pathname === "/signup/credentials";
  const isSignUpInformationPage = location.pathname === "/signup/information";
  const isSignUpVerificationPage = location.pathname === "/signup/verify-email";
  const isSignUpCompletedPage = location.pathname === "/signup/completed";

  const isAuthPage =
    isLoginPage ||
    isSignUpCredentialPage ||
    isSignUpInformationPage ||
    isSignUpVerificationPage ||
    isSignUpCompletedPage;

  return (
    <motion.nav
      className={`${styles.navbar} ${isSticky ? styles['navbar-sticky'] : ''}`}
      transition={{ duration: 0.5 }}
    >
      <div className={styles['navbar-brand']}>
        <Link to="/" className={styles['navbar-logo']} aria-label="TechnoMatch Home">
          TechnoMatch
        </Link>
      </div>

      {/* Only show "Home" link if on auth pages */}
      {isAuthPage ? (
        <div className={styles['navbar-menu navbar-menu-desktop']}>
          <ul className={styles['navbar-links']}>
            <li className={styles['navbar-item']}>
              <Link to="/" className={styles['navbar-link']}>
                Home
              </Link>
            </li>
          </ul>
        </div>
      ) : (
        <>
          <button
            className={styles['navbar-toggle']}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className={styles['navbar-toggle-icon']}>{isMenuOpen ? "✕" : "☰"}</span>
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className={styles['navbar-menu']}
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <ul className={styles['navbar-links']}>
                  <li className={styles['navbar-item']}>
                    <a
                      href="#explore"
                      className={`${styles['navbar-link']} ${activeSection === "explore" ? styles['navbar-link-active'] : ""}`}
                      onClick={handleSectionNavigation("explore")}
                    >
                      Explore
                    </a>
                  </li>
                  <li className={styles['navbar-item']}>
                    <a
                      href="#leaderboard"
                      className={`${styles['navbar-link']} ${activeSection === "leaderboard" ? styles['navbar-link-active'] : ""}`}
                      onClick={handleSectionNavigation("leaderboard")}
                    >
                      Leaderboard
                    </a>
                  </li>
                  <li className={styles['navbar-item']}>
                    <Link to="/about" className={styles['navbar-link']}>
                      About Us
                    </Link>
                  </li>
                  <li className={styles['navbar-item']}>
                    <Link to="/login" className={`${styles['navbar-link']} ${styles['navbar-link-cta']}`}>
                      Sign In
                    </Link>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Menu */}
          <div className={`${styles['navbar-menu']} ${styles['navbar-menu-desktop']}`}>
            <ul className={styles['navbar-links']}>
              <li className={styles['navbar-item']}>
                <a
                  href="#explore"
                  className={`${styles['navbar-link']} ${activeSection === "explore" ? styles['navbar-link-active'] : ""}`}
                  onClick={handleSectionNavigation("explore")}
                >
                  Explore
                </a>
              </li>
              <li className={styles['navbar-item']}>
                <a
                  href="#leaderboard"
                  className={`${styles['navbar-link']} ${activeSection === "leaderboard" ? styles['navbar-link-active'] : ""}`}
                  onClick={handleSectionNavigation("leaderboard")}
                >
                  Leaderboard
                </a>
              </li>
              <li className={styles['navbar-item']}>
                <Link to="/about" className={styles['navbar-link']}>
                  About Us
                </Link>
              </li>
              <li className={styles['navbar-item']}>
                <Link to="/login" className={`${styles['navbar-link']} ${styles['navbar-link-cta']}`}>
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}
    </motion.nav>
  );
};

export default GuestNavBar;