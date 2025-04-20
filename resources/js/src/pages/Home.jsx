import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './Home.module.scss';

const FeatureCard = ({ title, description, youtubeLink, index }) => (
  <motion.article
    className={`${styles.feature} ${index % 2 === 0 ? styles['feature-left'] : styles['feature-right']}`}
    initial={{ opacity: 0, scale: 0.9, x: index % 2 === 0 ? -100 : 100 }}
    whileInView={{ opacity: 1, scale: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.9, x: index % 2 === 0 ? 100 : -100 }}
    transition={{ duration: 0.8, ease: 'easeInOut' }}
    viewport={{ once: true, amount: 0.5 }}
  >
    <div className={styles['feature-description']}>
      <h2>{title}</h2>
      {description}
    </div>
    <div className={styles['feature-tutorial']}>
      {youtubeLink ? (
        <iframe
          src={youtubeLink}
          title={`${title} Tutorial`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className={styles['video-placeholder']}>
          <p>Coming Soon</p>
        </div>
      )}
    </div>
  </motion.article>
);

const Home = () => {
  const features = [
    {
      title: 'Progressive Mode',
      description: (
        <>
          Start your coding journey with beginner-friendly challenges and gradually advance as you improve.
          TechnoClash provides a structured learning path where each challenge builds upon the previous one, ensuring steady progress.
        </>
      ),
      youtubeLink: null,
    },
    {
      title: 'Ranked Mode',
      description: (
        <>
          Ready for the next level? Battle it out in competitive matches to test your speed, accuracy, and problem-solving skills.
          <ul>
            <li><strong>Battle Royale (Solo)</strong> – Compete against multiple coders, where the last one standing wins.</li>
            <li><strong>Blitz Mode</strong> – Solve a set of problems under strict time pressure to earn maximum points.</li>
            <li><strong>Skill-based matchmaking</strong> – Get matched with opponents of similar skill levels.</li>
          </ul>
        </>
      ),
      youtubeLink: null,
    },
    {
      title: 'Contests & Events',
      description: (
        <>
          Join exclusive coding contests hosted by TechnoClash or partner organizations to gain exposure, win prizes, and boost your portfolio.
          <ul>
            <li><strong>Weekly & Monthly Contests</strong> – Compete against top coders.</li>
            <li><strong>Sponsorships & Company Challenges</strong> – Solve real-world problems.</li>
          </ul>
        </>
      ),
      youtubeLink: null,
    },
  ];

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles['hero-content']}>
          <h1>Train like a Warrior.</h1>
          <h1>
            Compete like a <span>Champion.</span>
          </h1>
          <p>Improve your skills, climb the ranks, and challenge the best!</p>
          <Link to="/login" className={styles['hero-cta']}>
            Start Playing!
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="explore" className={styles.features}>
        <h2 className={styles['features-header']}>
          Unleash your coding potential with our <br /> game modes and <span>challenges!</span>
        </h2>
        <div className={styles['features-content']}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className={styles['leaderboard']}>
        <h2>
          Track Your Progress in <span>Real Time!</span>
        </h2>
        <div className={styles['leaderboard-content']}>
          <p>Coming Soon</p>
        </div>
      </section>
    </div>
  );
};

export default Home;