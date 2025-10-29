// Home Page - Marketplace
// File: src/pages/Home.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CollectionGrid from '../components/CollectionGrid';
import toast, { Toaster } from 'react-hot-toast';
import './Home.scss';

const Home = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    totalCollections: '∞',
    creators: 2
  });

  const handleCollectionClick = (collection) => {
    console.log('📦 Navigating to collection:', collection.name);
    navigate(`/collection/${collection.collection_id || collection.id}`);
  };

  return (
    <div className="home">
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
      
      {/* Hero Section */}
      <div className="home__hero">
        <div className="home__hero-content">
          <div className="home__hero-inner">
            <h1>Discover, Collect, and Sell NFT Collections</h1>
            <p>
              The premier multi-chain NFT marketplace on XRP and Coreum. 
              Browse collections, explore unique digital art, and find your next treasure.
            </p>
            <div className="home__hero-actions">
              <button
                onClick={() => navigate('/collections')}
                className="home__hero-btn home__hero-btn--primary"
              >
                Browse All Collections
              </button>
              <button
                onClick={() => navigate('/create-collection')}
                className="home__hero-btn home__hero-btn--secondary"
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="home__stats">
        <div className="home__stats-container">
          <div className="home__stats-grid">
            <div className="home__stats-item">
              <p className="home__stats-item-value">{stats.totalCollections}</p>
              <p className="home__stats-item-label">Collections on Coreum</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">20</p>
              <p className="home__stats-item-label">Per Page</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">Fast</p>
              <p className="home__stats-item-label">Load Times</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">{stats.creators}</p>
              <p className="home__stats-item-label">Creators</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="home__collections">
        <div className="home__collections-header">
          <h2 className="home__collections-title">Featured Collections</h2>
          <p className="home__collections-subtitle">
            Browse curated NFT collections • Click to explore
          </p>
        </div>

        <CollectionGrid onCollectionClick={handleCollectionClick} />
      </div>
    </div>
  );
};

export default Home;

