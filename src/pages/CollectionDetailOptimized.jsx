// Optimized Collection Detail Page with Virtual Scrolling and React Query
// File: src/pages/CollectionDetailOptimized.jsx
// High-performance version with infinite scroll and smart caching

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ipfsToHttp } from '../utils/ipfs';
import { useCollection, useInfiniteCollectionNFTs } from '../hooks/useNFTsQuery';
import OptimizedNFTCard from '../components/OptimizedNFTCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import SpinWheel from '../components/SpinWheel';
import { freeSpinService } from '../services/freeSpinService';
import toast, { Toaster } from 'react-hot-toast';
import imageOptimizationService from '../services/imageOptimizationService';
import { Virtuoso } from 'react-virtuoso';
import './CollectionDetail.scss';

const CollectionDetailOptimized = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [spinCampaigns, setSpinCampaigns] = React.useState([]);
  const [activeCampaign, setActiveCampaign] = React.useState(null);

  // Use React Query for collection data
  const {
    data: collection,
    isLoading: collectionLoading,
    error: collectionError,
  } = useCollection(id);

  // Use infinite query for NFTs
  const {
    data: nftsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: nftsLoading,
  } = useInfiniteCollectionNFTs(id, { limit: 50 });

  // Flatten pages into single array
  const nfts = React.useMemo(
    () => nftsData?.pages.flatMap((page) => page.data) || [],
    [nftsData]
  );

  useEffect(() => {
    if (id) {
      loadSpinCampaigns();
    }
  }, [id]);

  // Preload images for better UX
  useEffect(() => {
    if (nfts.length > 0) {
      const imageUrls = nfts.slice(0, 10).map(nft => 
        ipfsToHttp(nft.metadata?.image || nft.image)
      );
      imageOptimizationService.preloadImages(imageUrls);
    }
  }, [nfts]);

  const loadSpinCampaigns = async () => {
    try {
      const campaigns = await freeSpinService.getActiveCampaigns(id);
      setSpinCampaigns(campaigns);
      if (campaigns.length > 0) {
        setActiveCampaign(campaigns[0]);
      }
    } catch (error) {
      console.error('Error loading spin campaigns:', error);
    }
  };

  const handleNFTClick = (nft) => {
    navigate(`/nft/${nft.id}`);
  };

  const handlePrizeWon = () => {
    // Refresh NFTs after winning
    setTimeout(() => {
      fetchNextPage();
    }, 2000);
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (collectionLoading) {
    return (
      <div className="collection-detail">
        <div className="collection-detail__container">
          <LoadingSpinner text="Loading collection..." />
        </div>
      </div>
    );
  }

  if (collectionError || !collection) {
    toast.error('Collection not found');
    navigate('/collections');
    return null;
  }

  const coverUrl = ipfsToHttp(collection.image || collection.cover_image);

  // Group NFTs into rows for grid layout
  const itemsPerRow = 4;
  const rows = [];
  for (let i = 0; i < nfts.length; i += itemsPerRow) {
    rows.push(nfts.slice(i, i + itemsPerRow));
  }

  return (
    <div className="collection-detail">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#101216',
            color: '#fff',
            border: '1px solid #1b1d23',
          },
        }}
      />

      {/* Header with cover image */}
      <div className="collection-detail__header">
        <div 
          className="collection-detail__cover" 
          style={{ backgroundImage: `url(${coverUrl})` }}
          role="img"
          aria-label={`${collection.name} cover image`}
        />
        <div className="collection-detail__header-content">
          <h1 className="collection-detail__title">{collection.name}</h1>
          <p className="collection-detail__description">{collection.description}</p>
          
          <div className="collection-detail__stats">
            <div className="collection-detail__stat">
              <span className="collection-detail__stat-value">
                {nftsData?.pages[0]?.totalCount || collection.total_items || nfts.length}
              </span>
              <span className="collection-detail__stat-label">Items</span>
            </div>
            <div className="collection-detail__stat">
              <span className="collection-detail__stat-value">
                {collection.total_owners || '-'}
              </span>
              <span className="collection-detail__stat-label">Owners</span>
            </div>
            <div className="collection-detail__stat">
              <span className="collection-detail__stat-value">
                {collection.floor_price || '-'}
              </span>
              <span className="collection-detail__stat-label">Floor Price</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spin Wheel Section */}
      {activeCampaign && (
        <div className="collection-detail__spin-section">
          <div className="spin-section-header">
            <h2 className="spin-section-title">
              <span className="spin-icon">🎡</span>
              {activeCampaign.name}
            </h2>
            <p className="spin-section-subtitle">
              Connect your wallet and spin to win exclusive prizes!
            </p>
          </div>
          <SpinWheel 
            campaignId={activeCampaign.id}
            embedded={true}
            onPrizeWon={handlePrizeWon}
          />
        </div>
      )}

      {/* NFTs Grid with Virtual Scrolling */}
      <div className="collection-detail__content">
        <div className="collection-detail__filter-bar">
          <h2 className="collection-detail__section-title">Items</h2>
          <select className="collection-detail__filter">
            <option>Recently Listed</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {nftsLoading && nfts.length === 0 ? (
          <LoadingSpinner text="Loading NFTs..." />
        ) : nfts.length > 0 ? (
          <div className="collection-detail__virtualized-grid">
            <Virtuoso
              data={rows}
              endReached={loadMore}
              itemContent={(index) => {
                const row = rows[index];
                const isFirstRow = index === 0;
                
                return (
                  <div className="collection-detail__grid-row" key={`row-${index}`}>
                    {row.map((nft, colIndex) => (
                      <div key={nft.id} className="collection-detail__grid-item">
                        <OptimizedNFTCard
                          nft={nft}
                          onClick={() => handleNFTClick(nft)}
                          priority={isFirstRow && colIndex < 4}
                        />
                      </div>
                    ))}
                  </div>
                );
              }}
              components={{
                Footer: () => (
                  isFetchingNextPage ? (
                    <div className="collection-detail__loading-more">
                      <LoadingSpinner text="Loading more NFTs..." />
                    </div>
                  ) : null
                ),
              }}
              style={{ height: 'calc(100vh - 600px)', minHeight: '600px' }}
              overscan={200}
            />
          </div>
        ) : (
          <EmptyState
            icon="🖼️"
            title="No NFTs in this collection yet"
            description="This collection doesn't have any NFTs listed at the moment."
            actionText="Browse Other Collections"
            onAction={() => navigate('/collections')}
          />
        )}
      </div>
    </div>
  );
};

export default CollectionDetailOptimized;

