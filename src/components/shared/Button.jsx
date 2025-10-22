// Button Component
// File: src/components/shared/Button.jsx

import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import './Button.scss';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const classNames = [
    'button',
    `button--${variant}`,
    size !== 'md' && `button--${size}`,
    fullWidth && 'button--full'
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" inline />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

