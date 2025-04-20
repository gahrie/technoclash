import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import styles from './CustomLink.module.scss';

const CustomLink = ({ to, children, className = '', onClick, disabled, ...props }) => {
  const classNames = clsx(styles['ui-link'], { [styles['ui-link--disabled']]: disabled }, className);

  return (
    <RouterLink to={to} className={classNames} onClick={disabled ? null : onClick} {...props}>
      {children}
    </RouterLink>
  );
};

CustomLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

export default CustomLink;