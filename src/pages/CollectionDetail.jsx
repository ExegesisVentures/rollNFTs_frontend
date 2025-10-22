// Collection Detail Page
// File: src/pages/CollectionDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionsAPI, nftsAPI } from '../services/api';
import { ipfsToHttp } from '../utils/ipfs';
import NFTCard from '../components/NFTCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import toast, { Toaster } from 'react-hot-toast';
import './CollectionDetail.scss';

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nftsLoading, setNftsLoading] = useState(true);

  useEffect(() => {
    loadCollection();
    loadNFTs();
  }, [id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const response = await collectionsAPI.getById(id);
      if (response.success) {
        setCollection(response.data);
      } else {
        toast.error('Collection not found');
        navigate('/collections');
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      toast.error('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const loadNFTs = async () => {
    try {
      setNftsLoading(true);
      const response = await nftsAPI.getByCollection(id);
      if (response.success) {
        setNfts(response.data);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load NFTs');
    } finally {
      setNftsLoading(false);
    }
  };

  const handleNFTClick = (nft) => {
    navigate(`/nft/${nft.id}`);
  };

  if (loading) {
    return (
      <div className="collection-detail">
        <div className="collection-detail__container">
          <LoadingSpinner text="Loading collection..." />
        </div>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  const coverUrl = ipfsToHttp(collection.image || collection.cover_image);

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
        <div className="collection-detail__cover" style={{ backgroundImage: `url(${coverUrl})` }} />
        <div className="collection-detail__header-content">
          <h1 className="collection-detail__title">{collection.name}</h1>
          <p className="collection-detail__description">{collection.description}</p>
          
          <div className="collection-detail__stats">
            <div className="collection-detail__stat">
              <span className="collection-detail__stat-value">
                {collection.total_items || nfts.length}
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

      {/* NFTs Grid */}
      <div className="collection-detail__content">
        <div className="collection-detail__filter-bar">
          <h2 className="collection-detail__section-title">Items</h2>
          <select className="collection-detail__filter">
            <option>Recently Listed</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {nftsLoading ? (
          <LoadingSpinner text="Loading NFTs..." />
        ) : nfts.length > 0 ? (
          <div className="collection-detail__grid">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onClick={() => handleNFTClick(nft)}
              />
            ))}
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

export default CollectionDetail;

