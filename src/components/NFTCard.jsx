// NFT Card Component
// File: src/components/NFTCard.jsx

import React from 'react';
import { ipfsToHttp } from '../utils/ipfs';
import './NFTCard.scss';

const NFTCard = ({ nft, onClick }) => {
  const imageUrl = ipfsToHttp(nft.metadata?.image || nft.image);
  const name = nft.metadata?.name || nft.name || 'Unnamed NFT';
  const price = nft.price || 'Not listed';

  return (
    <div className="nft-card" onClick={onClick}>
      {/* NFT Image */}
      <div className="nft-card__image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Prevent infinite error loop
              if (e.target.dataset.fallbackAttempted) return;
              e.target.dataset.fallbackAttempted = 'true';
              
              // Use a data URI as fallback (always works)
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23222" width="400" height="400"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENFT%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="nft-card__image--placeholder">
            No Image
          </div>
        )}
        
        {/* Status Badge */}
        {nft.status === 'listed' && (
          <div className="nft-card__badge">
            Listed
          </div>
        )}
        {nft.status === 'sold' && (
          <div className="nft-card__badge nft-card__badge--sold">
            Sold
          </div>
        )}
      </div>

      {/* NFT Details */}
      <div className="nft-card__details">
        <h3 className="nft-card__name">
          {name}
        </h3>
        
        {/* Collection */}
        {nft.collection_name && (
          <p className="nft-card__collection">
            {nft.collection_name}
          </p>
        )}

        {/* Price */}
        <div className="nft-card__footer">
          <div className="nft-card__price">
            <p className="nft-card__price-label">Price</p>
            <p className="nft-card__price-value">
              {typeof price === 'number' ? `${price} XRP` : price}
            </p>
          </div>

          {nft.status === 'listed' && (
            <button className="nft-card__buy-btn">
              Buy Now
            </button>
          )}
        </div>

        {/* Owner */}
        {nft.owner && (
          <div className="nft-card__owner">
            Owner: {nft.owner.slice(0, 8)}...{nft.owner.slice(-6)}
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard;

