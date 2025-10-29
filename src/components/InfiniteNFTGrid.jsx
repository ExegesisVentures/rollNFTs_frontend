// Infinite Scroll NFT Grid Component
// File: src/components/InfiniteNFTGrid.jsx
// Loads NFTs in batches as user scrolls

import React, { useRef, useCallback, useEffect } from 'react';
import { useInfiniteNFTs, getAllNFTs } from '../hooks/useInfiniteNFTs';
import NFTCard from './NFTCard';
import './InfiniteNFTGrid.scss';

const InfiniteNFTGrid = ({ collectionId = null, onNFTClick }) => {
  const loadMoreRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteNFTs({
    pageSize: 12, // Load 12 at a time to avoid rate limits
    collectionId,
  });

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log('📥 Loading more NFTs...');
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '100px', // Start loading 100px before reaching bottom
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  // Get all NFTs from pages
  const nfts = getAllNFTs(data);

  if (isLoading) {
    return (
      <div className="infinite-grid">
        <div className="infinite-grid__loading">
          <div className="infinite-grid__spinner"></div>
          <p>Loading NFTs from blockchain...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="infinite-grid">
        <div className="infinite-grid__error">
          <p>❌ Error loading NFTs: {error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="infinite-grid__retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="infinite-grid">
        <div className="infinite-grid__empty">
          <p>No NFTs found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="infinite-grid">
      <div className="infinite-grid__items">
        {nfts.map((nft, index) => (
          <div key={nft.id || `${nft.collection_id}-${nft.token_id}-${index}`} className="infinite-grid__item">
            <NFTCard
              nft={nft}
              onClick={() => onNFTClick(nft)}
            />
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="infinite-grid__load-more">
        {isFetchingNextPage && (
          <div className="infinite-grid__loading-more">
            <div className="infinite-grid__spinner"></div>
            <p>Loading more NFTs...</p>
          </div>
        )}
        {!hasNextPage && nfts.length > 0 && (
          <p className="infinite-grid__end">
            🎉 You've reached the end! ({nfts.length} NFTs loaded)
          </p>
        )}
      </div>
    </div>
  );
};

export default InfiniteNFTGrid;

