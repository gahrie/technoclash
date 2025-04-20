import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import styles from './Input.module.scss';

const Input = forwardRef(
  ({ type = 'text', id, value, onChange, placeholder, className = '', noFloat = false, ...props }, ref) => {
    const isFilled = !!value;
    const classNames = clsx(
      styles['ui-input'],
      { [styles['ui-input--filled']]: isFilled, [styles['ui-input--no-float']]: noFloat },
      className
    );

    return (
      <div className={styles['ui-input-container']}>
        <div className={styles['ui-input-wrapper']}>
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            className={classNames}
            ref={ref}
            {...props}
          />
          {placeholder && !noFloat && (
            <span className={clsx(styles['ui-input-span'], { [styles['ui-input-span--float']]: isFilled })}>
              {placeholder}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  noFloat: PropTypes.bool,
};

export default Input;