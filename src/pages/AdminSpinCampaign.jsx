// Admin Spin Campaign Management Page
// Location: src/pages/AdminSpinCampaign.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useWalletStore from '../store/walletStore';
import { freeSpinService } from '../services/freeSpinService';
import { collectionsAPI, nftsAPI } from '../services/api';
import toast from 'react-hot-toast';
import './AdminSpinCampaign.scss';

const AdminSpinCampaign = () => {
  const navigate = useNavigate();
  const { walletAddress: address, isConnected } = useWalletStore();
  
  const [campaigns, setCampaigns] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    collectionId: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    spinsPerWallet: 1,
    requireWhitelist: false,
    prizes: []
  });
  const [whitelistAddresses, setWhitelistAddresses] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    if (!isConnected) {
      toast.warning('Please connect your wallet');
      navigate('/');
      return;
    }
    
    loadData();
  }, [isConnected]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsData, collectionsData] = await Promise.all([
        freeSpinService.getActiveCampaigns(),
        collectionsAPI.getAll()
      ]);
      
      // Filter to only show campaigns for user's collections
      const userCampaigns = campaignsData.filter(
        c => c.collections?.creator_address === address
      );
      
      setCampaigns(userCampaigns);
      
      // Filter to only show user's collections
      if (collectionsData.success) {
        const userCollections = collectionsData.data.filter(
          c => c.creator_address === address
        );
        setCollections(userCollections);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddPrize = () => {
    setFormData(prev => ({
      ...prev,
      prizes: [
        ...prev.prizes,
        { type: 'nft', label: '', nft_id: '', probability: 0.25, color: '#667eea' }
      ]
    }));
  };

  const handleRemovePrize = (index) => {
    setFormData(prev => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index)
    }));
  };

  const handlePrizeChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      prizes: prev.prizes.map((prize, i) =>
        i === index ? { ...prize, [field]: value } : prize
      )
    }));
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    if (!formData.collectionId) {
      toast.error('Please select a collection');
      return;
    }
    
    if (!formData.name) {
      toast.error('Please enter a campaign name');
      return;
    }
    
    if (formData.prizes.length === 0) {
      toast.error('Please add at least one prize');
      return;
    }
    
    // Validate probabilities sum to 1
    const totalProb = formData.prizes.reduce((sum, p) => sum + parseFloat(p.probability || 0), 0);
    if (Math.abs(totalProb - 1) > 0.01) {
      toast.error(`Prize probabilities must sum to 1.0 (currently ${totalProb.toFixed(2)})`);
      return;
    }
    
    try {
      const campaign = await freeSpinService.createCampaign({
        collectionId: formData.collectionId,
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        spinsPerWallet: parseInt(formData.spinsPerWallet),
        requireWhitelist: formData.requireWhitelist,
        prizes: formData.prizes
      });
      
      toast.success('Campaign created successfully!');
      setShowCreateModal(false);
      loadData();
      
      // Reset form
      setFormData({
        collectionId: '',
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        spinsPerWallet: 1,
        requireWhitelist: false,
        prizes: []
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    }
  };

  const handleAddWhitelist = async (campaignId) => {
    if (!whitelistAddresses.trim()) {
      toast.error('Please enter wallet addresses');
      return;
    }
    
    try {
      const addresses = whitelistAddresses
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      await freeSpinService.addToWhitelist(campaignId, addresses);
      
      toast.success(`Added ${addresses.length} addresses to whitelist`);
      setWhitelistAddresses('');
      setSelectedCampaign(null);
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      toast.error(error.message || 'Failed to add to whitelist');
    }
  };

  const renderCampaignCard = (campaign) => {
    return (
      <div key={campaign.id} className="campaign-card">
        <div className="campaign-header">
          <h3>{campaign.name}</h3>
          <span className={`status-badge ${campaign.active ? 'active' : 'inactive'}`}>
            {campaign.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <p className="campaign-description">{campaign.description}</p>
        
        <div className="campaign-stats">
          <div className="stat">
            <span className="stat-label">Total Spins</span>
            <span className="stat-value">{campaign.total_spins_used || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Prizes Claimed</span>
            <span className="stat-value">{campaign.total_prizes_claimed || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Spins/Wallet</span>
            <span className="stat-value">{campaign.spins_per_wallet}</span>
          </div>
        </div>
        
        <div className="campaign-actions">
          <Link 
            to={`/free-spins/${campaign.id}`}
            className="btn btn-secondary btn-sm"
          >
            View Campaign
          </Link>
          
          {campaign.require_whitelist && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setSelectedCampaign(campaign)}
            >
              Manage Whitelist
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-spin-campaign">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-spin-campaign">
      <div className="page-header">
        <h1>Spin Campaign Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎡</span>
          <h2>No Campaigns Yet</h2>
          <p>Create your first spin campaign to engage your community!</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map(renderCampaignCard)}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Spin Campaign</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="modal-content">
              <div className="form-group">
                <label>Collection *</label>
                <select
                  name="collectionId"
                  value={formData.collectionId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Collection</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Campaign Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Holiday Giveaway"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your campaign..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Spins Per Wallet</label>
                <input
                  type="number"
                  name="spinsPerWallet"
                  value={formData.spinsPerWallet}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="requireWhitelist"
                    checked={formData.requireWhitelist}
                    onChange={handleInputChange}
                  />
                  <span>Require Whitelist</span>
                </label>
              </div>

              <div className="form-group">
                <label>Prizes *</label>
                <div className="prizes-list">
                  {formData.prizes.map((prize, index) => (
                    <div key={index} className="prize-item">
                      <input
                        type="text"
                        placeholder="Prize Label"
                        value={prize.label}
                        onChange={(e) => handlePrizeChange(index, 'label', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Probability (0-1)"
                        value={prize.probability}
                        onChange={(e) => handlePrizeChange(index, 'probability', parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                        max="1"
                      />
                      <input
                        type="color"
                        value={prize.color}
                        onChange={(e) => handlePrizeChange(index, 'color', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemovePrize(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddPrize}
                  >
                    + Add Prize
                  </button>
                </div>
                <small>Note: Probabilities must sum to 1.0</small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Whitelist Management Modal */}
      {selectedCampaign && (
        <div className="modal-overlay" onClick={() => setSelectedCampaign(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Whitelist - {selectedCampaign.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedCampaign(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Wallet Addresses (one per line)</label>
                <textarea
                  value={whitelistAddresses}
                  onChange={(e) => setWhitelistAddresses(e.target.value)}
                  placeholder="core1abc...&#10;core1def...&#10;core1ghi..."
                  rows="10"
                />
              </div>
              
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedCampaign(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddWhitelist(selectedCampaign.id)}
                >
                  Add to Whitelist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpinCampaign;

