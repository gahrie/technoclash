import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import styles from './Button.module.scss';
import PropTypes from 'prop-types';

const Button = ({ children, to, variant = 'primary', className = '', loading = false, disabled, ...props }) => {
  const classNames = clsx(styles['ui-button'], styles[`ui-button--${variant}`], className);

  const buttonContent = (
    <>
      {loading && <span className={styles.spinner}></span>}
      <span className={loading ? styles['button-content-hidden'] : ''}>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classNames} {...props}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button className={classNames} disabled={disabled || loading} {...props}>
      {buttonContent}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'icon', 'form']),
  className: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default Button;