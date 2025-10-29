// Infinite Scroll Hook for NFTs
// File: src/hooks/useInfiniteNFTs.js
// Uses React Query for smart caching and pagination

import { useInfiniteQuery } from '@tanstack/react-query';
import { nftsAPI } from '../services/api';

/**
 * Hook for infinite scrolling NFT list
 * @param {Object} options - Query options
 * @returns {Object} - Query result with NFTs, loading state, and fetchNextPage
 */
export const useInfiniteNFTs = (options = {}) => {
  const {
    pageSize = 12,
    collectionId = null,
    enabled = true,
  } = options;

  return useInfiniteQuery({
    queryKey: ['nfts', 'infinite', collectionId, pageSize],
    
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: pageSize,
      };

      if (collectionId) {
        params.collection_id = collectionId;
      }

      const response = await nftsAPI.getListed(params);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch NFTs');
      }

      return {
        nfts: response.data || [],
        pagination: response.pagination,
        nextPage: response.pagination?.hasMore ? pageParam + 1 : undefined,
      };
    },

    getNextPageParam: (lastPage) => lastPage.nextPage,
    
    initialPageParam: 1,
    
    enabled,
    
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    
    // Keep data fresh
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

/**
 * Get all NFTs from paginated data
 * @param {Object} data - React Query infinite data
 * @returns {Array} - Flattened array of NFTs
 */
export const getAllNFTs = (data) => {
  if (!data?.pages) return [];
  return data.pages.flatMap(page => page.nfts);
};

/**
 * Get total NFT count from paginated data
 * @param {Object} data - React Query infinite data  
 * @returns {number} - Total NFT count
 */
export const getTotalCount = (data) => {
  if (!data?.pages || data.pages.length === 0) return 0;
  return data.pages[0]?.pagination?.total || 0;
};

