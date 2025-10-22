// Empty State Component
// File: src/components/shared/EmptyState.jsx

import React from 'react';
import './EmptyState.scss';

const EmptyState = ({ icon = '📭', title, description, actionText, onAction }) => {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {actionText && onAction && (
        <button className="empty-state__action" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

