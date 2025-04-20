import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import styles from './Label.module.scss';

const Label = ({ htmlFor, children, className = '', ...props }) => {
  const classNames = clsx(styles['ui-label'], className);

  return (
    <label htmlFor={htmlFor} className={classNames} {...props}>
      {children}
    </label>
  );
};

Label.propTypes = {
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Label;