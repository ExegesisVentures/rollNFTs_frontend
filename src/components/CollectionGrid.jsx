// Collection Grid Component
// File: src/components/CollectionGrid.jsx
// Displays collections with infinite scroll

import React, { useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { collectionsAPI } from '../services/api';
import CollectionCard from './CollectionCard';
import './CollectionGrid.scss';

const CollectionGrid = ({ onCollectionClick }) => {
  const loadMoreRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['collections', 'infinite'],
    
    queryFn: async ({ pageParam = 1 }) => {
      console.log(`📦 Fetching collections page ${pageParam}`);
      const response = await collectionsAPI.getAll({ page: pageParam, limit: 20 });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch collections');
      }

      return {
        collections: response.data || [],
        pagination: response.pagination,
        nextPage: response.pagination?.hasMore ? pageParam + 1 : undefined,
      };
    },

    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log('📥 Loading more collections...');
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  // Get all collections from pages
  const collections = data?.pages.flatMap(page => page.collections) || [];

  if (isLoading) {
    return (
      <div className="collection-grid">
        <div className="collection-grid__loading">
          <div className="collection-grid__spinner"></div>
          <p>Loading collections...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="collection-grid">
        <div className="collection-grid__error">
          <p>❌ Error loading collections: {error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="collection-grid__retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="collection-grid">
        <div className="collection-grid__empty">
          <p>No collections found</p>
          <button 
            onClick={() => window.location.href = '/create-collection'}
            className="collection-grid__create-btn"
          >
            Create First Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-grid">
      <div className="collection-grid__items">
        {collections.map((collection) => (
          <div 
            key={collection.id || collection.collection_id} 
            className="collection-grid__item"
          >
            <CollectionCard
              collection={collection}
              onClick={() => onCollectionClick(collection)}
            />
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="collection-grid__load-more">
        {isFetchingNextPage && (
          <div className="collection-grid__loading-more">
            <div className="collection-grid__spinner"></div>
            <p>Loading more collections...</p>
          </div>
        )}
        {!hasNextPage && collections.length > 0 && (
          <p className="collection-grid__end">
            🎉 All collections loaded! ({collections.length} total)
          </p>
        )}
      </div>
    </div>
  );
};

export default CollectionGrid;

