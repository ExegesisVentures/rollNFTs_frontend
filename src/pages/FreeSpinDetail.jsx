// FreeSpinDetail Page - Individual campaign with spin wheel
// Location: src/pages/FreeSpinDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { freeSpinService } from '../services/freeSpinService';
import SpinWheel from '../components/SpinWheel';
import { toast } from 'react-toastify';
import './FreeSpinDetail.scss';

const FreeSpinDetail = () => {
  const { campaignId } = useParams();
  const { address, isConnected } = useWalletStore();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const [campaignData, statsData] = await Promise.all([
        freeSpinService.getCampaignById(campaignId),
        freeSpinService.getCampaignStats(campaignId)
      ]);
      
      setCampaign(campaignData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeWon = (prizeResult) => {
    // Refresh stats after winning
    setTimeout(() => {
      freeSpinService.getCampaignStats(campaignId).then(setStats);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="free-spin-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="free-spin-detail-error">
        <h2>Campaign Not Found</h2>
        <p>The requested spin campaign could not be found.</p>
        <Link to="/free-spins" className="btn btn-primary">
          View All Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="free-spin-detail-page">
      {/* Back Button */}
      <div className="back-navigation">
        <Link to="/free-spins" className="back-link">
          ← Back to Campaigns
        </Link>
      </div>

      {/* Campaign Header */}
      <section className="campaign-header">
        {campaign.collections?.banner_image && (
          <div className="header-banner">
            <img 
              src={campaign.collections.banner_image} 
              alt={campaign.name}
              className="banner-image"
            />
            <div className="banner-overlay"></div>
          </div>
        )}
        
        <div className="header-content">
          <h1 className="campaign-title">{campaign.name}</h1>
          
          {campaign.collections && (
            <Link 
              to={`/collections/${campaign.collections.id}`}
              className="collection-link"
            >
              <span className="collection-icon">📦</span>
              <span>{campaign.collections.name}</span>
            </Link>
          )}
          
          {campaign.description && (
            <p className="campaign-description">{campaign.description}</p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="main-content">
        <div className="content-wrapper">
          {/* Spin Wheel */}
          <div className="wheel-container">
            <SpinWheel 
              campaignId={campaignId} 
              embedded={false}
              onPrizeWon={handlePrizeWon}
            />
          </div>

          {/* Campaign Details Sidebar */}
          <aside className="campaign-sidebar">
            <div className="sidebar-section">
              <h3>Campaign Details</h3>
              
              <div className="detail-item">
                <span className="detail-label">Spins Per Wallet</span>
                <span className="detail-value">{campaign.spins_per_wallet}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Whitelist Required</span>
                <span className="detail-value">
                  {campaign.require_whitelist ? '🔐 Yes' : '✅ No'}
                </span>
              </div>
              
              {campaign.end_date && (
                <div className="detail-item">
                  <span className="detail-label">Ends On</span>
                  <span className="detail-value">
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {!campaign.end_date && (
                <div className="detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">No End Date</span>
                </div>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="sidebar-section">
                <h3>Campaign Stats</h3>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-icon">🎯</span>
                    <span className="stat-value">{stats.totalSpins}</span>
                    <span className="stat-label">Total Spins</span>
                  </div>
                  
                  <div className="stat-card">
                    <span className="stat-icon">✅</span>
                    <span className="stat-value">{stats.completedSpins}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                  
                  <div className="stat-card">
                    <span className="stat-icon">🎁</span>
                    <span className="stat-value">{stats.nftPrizes}</span>
                    <span className="stat-label">NFT Prizes</span>
                  </div>
                  
                  <div className="stat-card">
                    <span className="stat-icon">📦</span>
                    <span className="stat-value">{stats.availablePrizes}</span>
                    <span className="stat-label">Available</span>
                  </div>
                </div>
              </div>
            )}

            {/* Prizes List */}
            {campaign.prizes && campaign.prizes.length > 0 && (
              <div className="sidebar-section">
                <h3>Possible Prizes</h3>
                <div className="prizes-list">
                  {campaign.prizes.map((prize, index) => (
                    <div key={index} className="prize-item">
                      <span className="prize-icon">
                        {prize.type === 'nft' ? '🎁' : '💬'}
                      </span>
                      <div className="prize-info">
                        <span className="prize-name">
                          {prize.label || prize.name || `Prize ${index + 1}`}
                        </span>
                        {prize.probability && (
                          <span className="prize-chance">
                            {(prize.probability * 100).toFixed(1)}% chance
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default FreeSpinDetail;

