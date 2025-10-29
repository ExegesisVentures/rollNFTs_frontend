// Virtual NFT Grid with Infinite Scroll
// File: src/components/VirtualNFTGrid.jsx
// High-performance virtual scrolling for large NFT collections

import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import OptimizedNFTCard from './OptimizedNFTCard';
import LoadingSpinner from './shared/LoadingSpinner';
import './VirtualNFTGrid.scss';

const VirtualNFTGrid = ({ 
  nfts, 
  onNFTClick, 
  onLoadMore,
  hasMore,
  loading,
  itemsPerRow = 4 
}) => {
  // Group NFTs into rows for grid layout
  const rows = [];
  for (let i = 0; i < nfts.length; i += itemsPerRow) {
    rows.push(nfts.slice(i, i + itemsPerRow));
  }

  const renderRow = useCallback((index) => {
    const row = rows[index];
    const isFirstRow = index === 0;

    return (
      <div className="virtual-nft-grid__row" key={`row-${index}`}>
        {row.map((nft, colIndex) => (
          <div key={nft.id} className="virtual-nft-grid__item">
            <OptimizedNFTCard
              nft={nft}
              onClick={() => onNFTClick(nft)}
              priority={isFirstRow && colIndex < 4} // Prioritize first row
            />
          </div>
        ))}
      </div>
    );
  }, [rows, onNFTClick]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [loading, hasMore, onLoadMore]);

  if (nfts.length === 0 && !loading) {
    return (
      <div className="virtual-nft-grid__empty">
        <p>No NFTs found</p>
      </div>
    );
  }

  return (
    <div className="virtual-nft-grid">
      <Virtuoso
        data={rows}
        endReached={loadMore}
        itemContent={(index) => renderRow(index)}
        overscan={200} // Render extra 200px before/after visible area
        components={{
          Footer: () => (
            loading ? (
              <div className="virtual-nft-grid__loading">
                <LoadingSpinner text="Loading more NFTs..." />
              </div>
            ) : null
          ),
        }}
        className="virtual-nft-grid__list"
      />
    </div>
  );
};

export default React.memo(VirtualNFTGrid);

