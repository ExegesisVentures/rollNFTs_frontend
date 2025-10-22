// Collection Card Component
// File: src/components/CollectionCard.jsx

import React from 'react';
import { ipfsToHttp } from '../utils/ipfs';
import VerifiedBadge from './VerifiedBadge';
import './CollectionCard.scss';

const CollectionCard = ({ collection, onClick }) => {
  const imageUrl = ipfsToHttp(collection.image || collection.cover_image);
  const name = collection.name || 'Unnamed Collection';
  const description = collection.description || 'No description';
  const chain = collection.chain?.toUpperCase() || 'CORE';
  const collectionId = collection.id || collection.collection_id || collection.class_id;

  return (
    <div className="collection-card" onClick={onClick}>
      {/* Collection Cover Image */}
      <div className="collection-card__cover">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/600x400?text=Collection';
            }}
          />
        ) : (
          <div className="collection-card__cover--placeholder">
            No Image
          </div>
        )}
      </div>

      {/* Collection Details */}
      <div className="collection-card__details">
        <h3 className="collection-card__name">
          {name}
          {collectionId && (
            <VerifiedBadge
              entityType="collection"
              entityId={collectionId}
              showLabel={false}
              size="small"
            />
          )}
        </h3>
        
        <p className="collection-card__description">
          {description}
        </p>

        {/* Stats */}
        <div className="collection-card__stats">
          <div className="collection-card__stats-item">
            <p className="collection-card__stats-item-label">Items</p>
            <p className="collection-card__stats-item-value">
              {collection.total_items || collection.stats?.total_items || 0}
            </p>
          </div>
          <div className="collection-card__stats-item">
            <p className="collection-card__stats-item-label">Owners</p>
            <p className="collection-card__stats-item-value">
              {collection.total_owners || collection.stats?.total_owners || 0}
            </p>
          </div>
          <div className="collection-card__stats-item">
            <p className="collection-card__stats-item-label">Floor</p>
            <p className="collection-card__stats-item-value">
              {collection.floor_price || collection.stats?.floor_price || '-'}
            </p>
          </div>
        </div>

        {/* Chain Badge */}
        <div className="collection-card__chain-container">
          <span className={`collection-card__chain collection-card__chain--${chain.toLowerCase()}`}>
            {chain}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;

