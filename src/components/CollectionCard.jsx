// Collection Card Component
// File: src/components/CollectionCard.jsx

import React, { useState, useEffect } from 'react';
import { ipfsToHttp } from '../utils/ipfs';
import VerifiedBadge from './VerifiedBadge';
import './CollectionCard.scss';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const COLLECTION_COVERS_BUCKET = 'collection-covers';

const CollectionCard = ({ collection, onClick }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const name = collection.name || 'Unnamed Collection';
  const description = collection.description || 'No description';
  const chain = collection.chain?.toUpperCase() || 'CORE';
  const collectionId = collection.id || collection.collection_id || collection.class_id;

  useEffect(() => {
    // Try to get optimized 128x128 WebP from Supabase storage first
    const cacheKey = `${collectionId}.webp`;
    const cachedUrl = `${SUPABASE_URL}/storage/v1/object/public/${COLLECTION_COVERS_BUCKET}/${cacheKey}`;
    
    // Check if cached image exists
    const img = new Image();
    img.onload = () => {
      setImageSrc(cachedUrl);
      setImageLoading(false);
    };
    img.onerror = () => {
      // Fallback to IPFS if not cached
      const ipfsUrl = ipfsToHttp(collection.image || collection.cover_image);
      setImageSrc(ipfsUrl);
      setImageLoading(false);
    };
    img.src = cachedUrl;
  }, [collectionId, collection.image, collection.cover_image]);

  const handleImageError = (e) => {
    // Inline SVG fallback (reliable)
    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23222" width="128" height="128"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ECollection%3C/text%3E%3C/svg%3E';
  };

  return (
    <div className="collection-card" onClick={onClick}>
      {/* Collection Cover Image - 128x128 */}
      <div className="collection-card__cover">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={name}
            loading="lazy"
            decoding="async"
            width="128"
            height="128"
            onError={handleImageError}
            className={imageLoading ? 'loading' : ''}
          />
        ) : (
          <div className="collection-card__cover--placeholder">
            <div className="collection-card__spinner"></div>
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

