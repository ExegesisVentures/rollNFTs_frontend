// Collections Page
// File: src/pages/Collections.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectionsAPI } from '../services/api';
import blockchainSyncService from '../services/blockchainSyncService';
import CollectionCard from '../components/CollectionCard';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import './Collections.scss';

const Collections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionsAPI.getAll();
      if (response.success) {
        setCollections(response.data);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBlockchain = async () => {
    try {
      setSyncing(true);
      toast.loading('Syncing collections from Coreum blockchain...', { id: 'sync' });
      
      // Call blockchain sync API
      const response = await axios.post('/api/sync/blockchain');
      
      if (response.data.success) {
        toast.success(
          `✅ Synced ${response.data.collections} collections from blockchain!`,
          { id: 'sync' }
        );
        
        // Reload collections
        await loadCollections();
      } else {
        toast.error('Failed to sync blockchain', { id: 'sync' });
      }
    } catch (error) {
      console.error('Error syncing blockchain:', error);
      toast.error('Failed to sync blockchain', { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCollectionClick = (collection) => {
    navigate(`/collection/${collection.id}`);
  };

  return (
    <div className="collections">
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
      
      {/* Header */}
      <div className="collections__header">
        <div className="collections__header-container">
          <div className="collections__header-text">
            <h1 className="collections__header-title">
              NFT Collections
            </h1>
            <p className="collections__header-subtitle">
              Explore all collections from Coreum blockchain
            </p>
          </div>
          <div className="collections__header-actions">
            <button 
              className="btn-sync-blockchain"
              onClick={handleSyncBlockchain}
              disabled={syncing}
            >
              {syncing ? '🔄 Syncing...' : '🔄 Sync Blockchain'}
            </button>
            <button 
              className="btn-create-collection"
              onClick={() => navigate('/create-collection')}
            >
              ✨ Create Collection
            </button>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="collections__content">
        {loading ? (
          <div className="collections__loading">
            <div className="collections__spinner"></div>
          </div>
        ) : collections.length > 0 ? (
          <div className="collections__grid">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onClick={() => handleCollectionClick(collection)}
              />
            ))}
          </div>
        ) : (
          <div className="collections__empty">
            <p>No collections found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;

