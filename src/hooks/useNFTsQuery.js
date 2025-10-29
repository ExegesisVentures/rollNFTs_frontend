// React Query Hooks for NFT Data Fetching
// File: src/hooks/useNFTsQuery.js
// Provides intelligent caching and automatic refetching

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { nftsAPI, collectionsAPI } from '../services/api';

/**
 * Hook to fetch NFTs for a collection with pagination
 */
export function useCollectionNFTs(collectionId, options = {}) {
  const { page = 1, limit = 50, enabled = true } = options;

  return useQuery({
    queryKey: ['collection-nfts', collectionId, page, limit],
    queryFn: async () => {
      const response = await nftsAPI.getByCollection(collectionId, { page, limit });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch NFTs');
      }
      return response.data;
    },
    enabled: enabled && !!collectionId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch NFTs with infinite scroll
 */
export function useInfiniteCollectionNFTs(collectionId, options = {}) {
  const { limit = 50 } = options;

  return useInfiniteQuery({
    queryKey: ['collection-nfts-infinite', collectionId, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await nftsAPI.getByCollection(collectionId, { 
        page: pageParam, 
        limit 
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch NFTs');
      }
      return {
        data: response.data,
        nextPage: response.hasMore ? pageParam + 1 : undefined,
        totalCount: response.totalCount,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch single collection
 */
export function useCollection(collectionId, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const response = await collectionsAPI.getById(collectionId);
      if (!response.success) {
        throw new Error(response.message || 'Collection not found');
      }
      return response.data;
    },
    enabled: enabled && !!collectionId,
    staleTime: 10 * 60 * 1000, // Collections change less frequently
    cacheTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch all collections
 */
export function useCollections(options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch collections');
      }
      return response.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch user's NFTs
 */
export function useUserNFTs(walletAddress, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['user-nfts', walletAddress],
    queryFn: async () => {
      const response = await nftsAPI.getByOwner(walletAddress);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch NFTs');
      }
      return response.data;
    },
    enabled: enabled && !!walletAddress,
    staleTime: 2 * 60 * 1000, // User's NFTs change more frequently
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user comes back
  });
}

/**
 * Hook to prefetch next page of NFTs
 */
export function usePrefetchNextPage(collectionId, currentPage, limit = 50) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['collection-nfts', collectionId, currentPage + 1, limit],
      queryFn: async () => {
        const response = await nftsAPI.getByCollection(collectionId, { 
          page: currentPage + 1, 
          limit 
        });
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetch };
}

/**
 * Hook to invalidate NFT queries (useful after mutations)
 */
export function useInvalidateNFTQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateCollection: (collectionId) => {
      queryClient.invalidateQueries({ queryKey: ['collection-nfts', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
    },
    invalidateUserNFTs: (walletAddress) => {
      queryClient.invalidateQueries({ queryKey: ['user-nfts', walletAddress] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}

