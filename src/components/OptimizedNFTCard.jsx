// Optimized NFT Card with Lazy Loading and Image Optimization
// File: src/components/OptimizedNFTCard.jsx
// Performance-optimized version with intersection observer and smart image loading

import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { ipfsToHttp } from '../utils/ipfs';
import imageOptimizationService from '../services/imageOptimizationService';
import './NFTCard.scss';

const OptimizedNFTCard = React.memo(({ nft, onClick, priority = false }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px', // Start loading 200px before card enters viewport
    skip: priority, // Skip intersection observer for above-the-fold images
  });

  const name = nft.metadata?.name || nft.name || 'Unnamed NFT';
  const price = nft.price || 'Not listed';
  const rawImageUrl = nft.metadata?.image || nft.image;

  // Load image when in view or if priority
  useEffect(() => {
    if ((inView || priority) && rawImageUrl && !imageUrl) {
      loadOptimizedImage();
    }
  }, [inView, priority, rawImageUrl]);

  const loadOptimizedImage = async () => {
    try {
      const optimizedUrl = await imageOptimizationService.getOptimizedImageUrl(
        rawImageUrl,
        { width: 400, quality: 85 }
      );
      setImageUrl(optimizedUrl);
    } catch (error) {
      console.error('Failed to load optimized image:', error);
      setImageUrl(ipfsToHttp(rawImageUrl));
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <div 
      className="nft-card" 
      onClick={onClick}
      ref={ref}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* NFT Image */}
      <div className="nft-card__image">
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="nft-card__image-skeleton">
                <div className="skeleton-shimmer" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={name}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ opacity: imageLoaded ? 1 : 0 }}
              className="nft-card__image-img"
            />
            {imageError && (
              <div className="nft-card__image--placeholder">
                No Image
              </div>
            )}
          </>
        ) : (
          <div className="nft-card__image-skeleton">
            <div className="skeleton-shimmer" />
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
            <button className="nft-card__buy-btn" onClick={(e) => {
              e.stopPropagation();
              // Handle buy action
            }}>
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
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if these change
  return (
    prevProps.nft.id === nextProps.nft.id &&
    prevProps.nft.status === nextProps.nft.status &&
    prevProps.nft.price === nextProps.nft.price
  );
});

OptimizedNFTCard.displayName = 'OptimizedNFTCard';

export default OptimizedNFTCard;

