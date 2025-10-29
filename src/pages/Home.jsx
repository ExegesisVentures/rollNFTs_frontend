// Home Page - Marketplace
// File: src/pages/Home.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InfiniteNFTGrid from '../components/InfiniteNFTGrid';
import toast, { Toaster } from 'react-hot-toast';
import './Home.scss';

const Home = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    totalCollections: 5,
    creators: 2
  });

  const handleNFTClick = (nft) => {
    navigate(`/nft/${nft.id}`);
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
            <h1>Discover, Collect, and Sell NFTs</h1>
            <p>
              The premier multi-chain NFT marketplace on XRP and Coreum. 
              Experience the future of digital collectibles with seamless trading and advanced features.
            </p>
            <div className="home__hero-actions">
              <button
                onClick={() => navigate('/collections')}
                className="home__hero-btn home__hero-btn--primary"
              >
                Explore Collections
              </button>
              <button
                onClick={() => navigate('/create')}
                className="home__hero-btn home__hero-btn--secondary"
              >
                Create NFT
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
              <p className="home__stats-item-value">∞</p>
              <p className="home__stats-item-label">NFTs on Coreum</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">{stats.totalCollections}</p>
              <p className="home__stats-item-label">Collections</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">12</p>
              <p className="home__stats-item-label">Per Batch</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">{stats.creators}</p>
              <p className="home__stats-item-label">Creators</p>
            </div>
          </div>
        </div>
      </div>

      {/* NFTs Grid - Infinite Scroll */}
      <div className="home__nfts">
        <div className="home__nfts-header">
          <h2 className="home__nfts-title">NFTs from Coreum Blockchain</h2>
          <p className="home__nfts-subtitle">
            Scroll down to load more • Images optimized & cached
          </p>
        </div>

        <InfiniteNFTGrid
          onNFTClick={handleNFTClick}
        />
      </div>
    </div>
  );
};

export default Home;

