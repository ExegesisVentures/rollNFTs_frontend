/**
 * Collection Preview Modal
 * File: src/components/CollectionPreviewModal.jsx
 * 
 * Shows users exactly how their collection will look before creation
 */

import React from 'react';
import Modal from './shared/Modal';
import Button from './shared/Button';
import './CollectionPreviewModal.scss';

const CollectionPreviewModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  coverImagePreview, 
  onConfirm,
  onEdit 
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preview Your Collection">
      <div className="collection-preview">
        <div className="collection-preview__header">
          <h3>🎨 Here's how your collection will appear</h3>
          <p>Make sure everything looks perfect before creating!</p>
        </div>

        {/* Preview Card - Exactly as it will appear */}
        <div className="collection-preview__card">
          <div className="preview-card">
            {/* Cover Image */}
            <div className="preview-card__cover">
              {coverImagePreview ? (
                <img
                  src={coverImagePreview}
                  alt={formData.name || 'Collection Preview'}
                  loading="lazy"
                />
              ) : (
                <div className="preview-card__cover--placeholder">
                  No Image
                </div>
              )}
            </div>

            {/* Collection Details */}
            <div className="preview-card__details">
              <h3 className="preview-card__name">
                {formData.name || 'Unnamed Collection'}
              </h3>
              
              <p className="preview-card__description">
                {formData.description || 'No description'}
              </p>

              {/* Stats (will be 0 initially) */}
              <div className="preview-card__stats">
                <div className="preview-card__stats-item">
                  <p className="preview-card__stats-item-label">Items</p>
                  <p className="preview-card__stats-item-value">0</p>
                </div>
                <div className="preview-card__stats-item">
                  <p className="preview-card__stats-item-label">Owners</p>
                  <p className="preview-card__stats-item-value">0</p>
                </div>
                <div className="preview-card__stats-item">
                  <p className="preview-card__stats-item-label">Floor</p>
                  <p className="preview-card__stats-item-value">-</p>
                </div>
              </div>

              {/* Chain Badge */}
              <div className="preview-card__chain-container">
                <span className="preview-card__chain preview-card__chain--core">
                  COREUM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Info Summary */}
        <div className="collection-preview__info">
          <h4>Collection Details</h4>
          <div className="collection-preview__info-grid">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{formData.name || 'Not set'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Symbol:</span>
              <span className="info-value">{formData.symbol || 'Not set'}</span>
            </div>
            {formData.website && (
              <div className="info-item">
                <span className="info-label">Website:</span>
                <span className="info-value">{formData.website}</span>
              </div>
            )}
            {formData.twitter && (
              <div className="info-item">
                <span className="info-label">Twitter:</span>
                <span className="info-value">@{formData.twitter}</span>
              </div>
            )}
            {formData.discord && (
              <div className="info-item">
                <span className="info-label">Discord:</span>
                <span className="info-value">{formData.discord}</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="collection-preview__confirmation">
          <p className="confirmation-question">
            ✨ <strong>Are you happy with how this looks?</strong>
          </p>
          <p className="confirmation-hint">
            You can edit any details or proceed with creating your collection.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="collection-preview__actions">
          <Button
            variant="secondary"
            onClick={onEdit}
          >
            ✏️ Make Changes
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
          >
            ✅ Looks Perfect, Create Collection!
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CollectionPreviewModal;

