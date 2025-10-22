// Loading Spinner Component
// File: src/components/shared/LoadingSpinner.jsx

import React from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ size = 'md', text, inline = false }) => {
  const sizeClass = size !== 'md' ? `loading-spinner__spinner--${size}` : '';
  const containerClass = inline ? 'loading-spinner loading-spinner--inline' : 'loading-spinner';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner__spinner ${sizeClass}`} />
      {text && <p className="loading-spinner__text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

