import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import styles from './Select.module.scss';

const Select = forwardRef(
  ({ id, value, onChange, options, placeholder, error, className = '', filled, ...props }, ref) => {
    const classNames = clsx(
      styles['ui-select'],
      { [styles['ui-select--filled']]: filled || value, [styles['ui-select--error']]: error },
      className
    );

    return (
      <div className={styles['ui-select-container']}>
        <select id={id} value={value} onChange={onChange} className={classNames} ref={ref} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className={styles['ui-select-error']}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

Select.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  filled: PropTypes.bool,
};

export default Select;