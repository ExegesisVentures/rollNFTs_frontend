// Home Page - Marketplace
// File: src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nftsAPI } from '../services/api';
import NFTCard from '../components/NFTCard';
import toast, { Toaster } from 'react-hot-toast';
import './Home.scss';

const Home = () => {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNFTs: 0,
    totalCollections: 0,
    listedNFTs: 0,
    creators: 0
  });

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const response = await nftsAPI.getListed({ page: 1, limit: 20 });
      if (response.success) {
        setNfts(response.data);
        // Update stats from response
        if (response.pagination) {
          setStats(prev => ({
            ...prev,
            totalNFTs: response.pagination.total || response.data.length,
            listedNFTs: response.data.length
          }));
        }
      } else {
        toast.error(response.message || 'Failed to load NFTs');
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load NFTs from blockchain');
    } finally {
      setLoading(false);
    }
  };

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
              <p className="home__stats-item-value">{stats.totalNFTs || '...'}</p>
              <p className="home__stats-item-label">NFTs on Coreum</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">{stats.totalCollections || '5'}</p>
              <p className="home__stats-item-label">Collections</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">{nfts.length}</p>
              <p className="home__stats-item-label">Loaded</p>
            </div>
            <div className="home__stats-item">
              <p className="home__stats-item-value">{stats.creators || '2'}</p>
              <p className="home__stats-item-label">Creators</p>
            </div>
          </div>
        </div>
      </div>

      {/* NFTs Grid */}
      <div className="home__nfts">
        <div className="home__nfts-header">
          <h2 className="home__nfts-title">NFTs from Coreum Blockchain</h2>
          <select className="home__nfts-filter">
            <option>Recently Listed</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="home__nfts-loading">
            <div className="home__nfts-spinner"></div>
            <p style={{ color: '#888', marginTop: '1rem' }}>Loading NFTs from blockchain...</p>
          </div>
        ) : nfts.length > 0 ? (
          <div className="home__nfts-grid">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onClick={() => handleNFTClick(nft)}
              />
            ))}
          </div>
        ) : (
          <div className="home__nfts-empty">
            <p className="home__nfts-empty-text">No NFTs found on blockchain</p>
            <button
              onClick={() => loadNFTs()}
              className="home__nfts-empty-btn"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

