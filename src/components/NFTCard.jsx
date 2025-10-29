// NFT Card Component
// File: src/components/NFTCard.jsx

import React, { useState, useEffect } from 'react';
import { ipfsToHttp } from '../utils/ipfs';
import imageCache from '../services/imageCache';
import './NFTCard.scss';

const NFTCard = ({ nft, onClick }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const rawImageUrl = nft.metadata?.image || nft.image;
  const name = nft.metadata?.name || nft.name || 'Unnamed NFT';
  const price = nft.price || 'Not listed';

  // Load image with proper caching strategy
  useEffect(() => {
    if (!rawImageUrl) {
      console.warn(`⚠️ No image URL for NFT: ${name}`);
      setImageLoading(false);
      setImageError(true);
      return;
    }

    let mounted = true;

    const loadImage = async () => {
      try {
        console.log(`🖼️ Loading image for ${name}:`, rawImageUrl);

        // Try to get optimized/cached version first
        const nftId = nft.id || `${nft.collection_id}-${nft.token_id}`;
        const optimizedUrl = await imageCache.getThumbnailUrl(rawImageUrl, nftId);

        if (mounted) {
          // Use optimized URL if available, fallback to direct IPFS conversion
          const finalUrl = optimizedUrl || ipfsToHttp(rawImageUrl);
          console.log(`✅ Using URL: ${finalUrl.substring(0, 60)}...`);
          setImageSrc(finalUrl);
        }
      } catch (error) {
        console.error(`❌ Failed to load image for ${name}:`, error);
        if (mounted) {
          // Fallback to direct IPFS conversion
          setImageSrc(ipfsToHttp(rawImageUrl));
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [rawImageUrl, name, nft.id, nft.collection_id, nft.token_id]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    console.log(`✅ Image loaded successfully: ${name}`);
  };

  const handleImageError = (e) => {
    console.error(`❌ Image failed to load: ${name}`, imageSrc);
    
    // Prevent infinite error loop
    if (e.target.dataset.fallbackAttempted) {
      setImageLoading(false);
      setImageError(true);
      return;
    }
    
    e.target.dataset.fallbackAttempted = 'true';
    
    // Try alternative gateway
    if (rawImageUrl && rawImageUrl.startsWith('ipfs://')) {
      const hash = rawImageUrl.replace('ipfs://', '');
      // Try Cloudflare gateway as fallback
      console.log(`🔄 Trying fallback gateway for: ${name}`);
      e.target.src = `https://cloudflare-ipfs.com/ipfs/${hash}`;
    } else {
      // Use SVG placeholder
      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23222" width="400" height="400"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENFT%3C/text%3E%3C/svg%3E';
      setImageLoading(false);
      setImageError(true);
    }
  };

  return (
    <div className="nft-card" onClick={onClick}>
      {/* NFT Image */}
      <div className="nft-card__image">
        {imageSrc ? (
          <>
            {imageLoading && (
              <div className="nft-card__image-loading">
                <div className="nft-card__spinner"></div>
              </div>
            )}
            <img
              src={imageSrc}
              alt={name}
              loading="lazy"
              decoding="async"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </>
        ) : (
          <div className="nft-card__image--placeholder">
            {imageError ? '⚠️ No Image' : 'Loading...'}
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

