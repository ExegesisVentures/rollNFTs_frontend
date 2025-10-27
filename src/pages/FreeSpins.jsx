// FreeSpins Landing Page - Lists all available spin campaigns
// Location: src/pages/FreeSpins.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { freeSpinService } from '../services/freeSpinService';
import { toast } from 'react-toastify';
import './FreeSpins.scss';

const FreeSpins = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useWalletStore();
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'participated'
  const [eligibilityMap, setEligibilityMap] = useState({});

  /**
   * Load all active campaigns
   */
  useEffect(() => {
    loadCampaigns();
  }, []);

  /**
   * Check eligibility for each campaign when wallet connects
   */
  useEffect(() => {
    if (isConnected && address && campaigns.length > 0) {
      checkAllEligibility();
    }
  }, [isConnected, address, campaigns]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await freeSpinService.getActiveCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load spin campaigns');
    } finally {
      setLoading(false);
    }
  };

  const checkAllEligibility = async () => {
    const eligibility = {};
    
    await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const result = await freeSpinService.checkSpinEligibility(
            campaign.id,
            address
          );
          eligibility[campaign.id] = result;
        } catch (error) {
          console.error(`Error checking eligibility for ${campaign.id}:`, error);
          eligibility[campaign.id] = {
            canSpin: false,
            spinsRemaining: 0,
            reason: 'Error checking eligibility'
          };
        }
      })
    );
    
    setEligibilityMap(eligibility);
  };

  /**
   * Filter campaigns based on selected filter
   */
  const getFilteredCampaigns = () => {
    if (!isConnected || filter === 'all') {
      return campaigns;
    }

    if (filter === 'available') {
      return campaigns.filter(c => eligibilityMap[c.id]?.canSpin);
    }

    if (filter === 'participated') {
      return campaigns.filter(c => 
        eligibilityMap[c.id] && 
        !eligibilityMap[c.id].canSpin &&
        eligibilityMap[c.id].spinsRemaining === 0
      );
    }

    return campaigns;
  };

  /**
   * Render campaign card
   */
  const renderCampaignCard = (campaign) => {
    const eligibility = eligibilityMap[campaign.id];
    const hasSpins = eligibility?.canSpin;
    const spinsRemaining = eligibility?.spinsRemaining || 0;

    return (
      <div 
        key={campaign.id}
        className="campaign-card"
        onClick={() => navigate(`/free-spins/${campaign.id}`)}
      >
        {/* Campaign Banner */}
        <div className="campaign-banner">
          {campaign.collections?.banner_image ? (
            <img 
              src={campaign.collections.banner_image} 
              alt={campaign.name}
              className="banner-image"
            />
          ) : (
            <div className="banner-placeholder">
              <span className="placeholder-icon">🎡</span>
            </div>
          )}
          
          {/* Badge overlays */}
          <div className="campaign-badges">
            {hasSpins && (
              <span className="badge badge-available">
                {spinsRemaining} Spin{spinsRemaining !== 1 ? 's' : ''} Available
              </span>
            )}
            {campaign.require_whitelist && (
              <span className="badge badge-whitelist">🔐 Whitelist Only</span>
            )}
          </div>
        </div>

        {/* Campaign Info */}
        <div className="campaign-info">
          <h3 className="campaign-name">{campaign.name}</h3>
          
          {campaign.collections && (
            <p className="campaign-collection">
              <span className="collection-icon">📦</span>
              {campaign.collections.name}
            </p>
          )}
          
          {campaign.description && (
            <p className="campaign-description">
              {campaign.description.length > 100
                ? `${campaign.description.substring(0, 100)}...`
                : campaign.description}
            </p>
          )}

          {/* Campaign Stats */}
          <div className="campaign-stats">
            <div className="stat">
              <span className="stat-icon">🎯</span>
              <span className="stat-value">{campaign.total_spins_used || 0}</span>
              <span className="stat-label">Total Spins</span>
            </div>
            <div className="stat">
              <span className="stat-icon">🎁</span>
              <span className="stat-value">{campaign.total_prizes_claimed || 0}</span>
              <span className="stat-label">Prizes Won</span>
            </div>
            <div className="stat">
              <span className="stat-icon">👥</span>
              <span className="stat-value">{campaign.spins_per_wallet}</span>
              <span className="stat-label">Spins/Wallet</span>
            </div>
          </div>

          {/* Call to Action */}
          <button className="btn btn-primary campaign-cta">
            {hasSpins ? 'Spin Now' : 'View Campaign'}
          </button>
        </div>
      </div>
    );
  };

  const filteredCampaigns = getFilteredCampaigns();

  return (
    <div className="free-spins-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">🎡</span>
            Free Spin Campaigns
          </h1>
          <p className="hero-subtitle">
            Connect your wallet and spin to win exclusive NFTs and prizes!
          </p>
          
          {!isConnected && (
            <div className="hero-cta">
              <p className="cta-message">
                🔗 Connect your wallet to see your available spins
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      {isConnected && campaigns.length > 0 && (
        <div className="filters-section">
          <div className="filters-container">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Campaigns ({campaigns.length})
            </button>
            <button
              className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
              onClick={() => setFilter('available')}
            >
              Available ({campaigns.filter(c => eligibilityMap[c.id]?.canSpin).length})
            </button>
            <button
              className={`filter-btn ${filter === 'participated' ? 'active' : ''}`}
              onClick={() => setFilter('participated')}
            >
              Participated
            </button>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <section className="campaigns-section">
        <div className="campaigns-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading spin campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎡</span>
              <h2>No Campaigns Found</h2>
              <p>
                {filter !== 'all'
                  ? 'Try changing your filter selection'
                  : 'Check back later for new spin campaigns!'}
              </p>
            </div>
          ) : (
            <div className="campaigns-grid">
              {filteredCampaigns.map(renderCampaignCard)}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-container">
          <h2>How It Works</h2>
          <div className="info-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Connect Wallet</h3>
              <p>Connect your wallet to view available spin campaigns</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Select Campaign</h3>
              <p>Choose a campaign and check if you're eligible to spin</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Spin & Win</h3>
              <p>Spin the wheel to win NFTs and other exciting prizes!</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Claim Prize</h3>
              <p>If you win an NFT, claim it directly to your wallet</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FreeSpins;

