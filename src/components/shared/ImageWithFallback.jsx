// Image with Fallback and Loading State Component
// File: src/components/shared/ImageWithFallback.jsx

import React, { useState } from 'react';
import './ImageWithFallback.scss';

const ImageWithFallback = ({ 
  src, 
  alt, 
  fallbackSrc = 'https://via.placeholder.com/400x400?text=NFT',
  loading = 'lazy',
  className = '',
  aspectRatio = '1/1',
  showSkeleton = true,
  onLoad,
  onError,
  ...props 
}) => {
  const [imageState, setImageState] = useState('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = (e) => {
    setImageState('loaded');
    onLoad?.(e);
  };

  const handleError = (e) => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageState('loading');
    } else {
      setImageState('error');
    }
    onError?.(e);
  };

  return (
    <div 
      className={`image-with-fallback ${className}`}
      style={{ aspectRatio }}
    >
      {showSkeleton && imageState === 'loading' && (
        <div className="image-with-fallback__skeleton" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`image-with-fallback__img ${imageState === 'loaded' ? 'image-with-fallback__img--loaded' : ''}`}
        {...props}
      />
    </div>
  );
};

export default ImageWithFallback;

