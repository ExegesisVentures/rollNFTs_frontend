/**
 * Create Launchpad Page
 * File: src/pages/CreateLaunchpad.jsx
 * 
 * Allows NFT collection creators to set up a launchpad for their collection.
 * Launchpads enable on-demand minting of NFTs with configurable parameters.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWalletStore from '../store/walletStore';
import { launchpadService } from '../services/launchpadService';
import supabase from '../lib/supabase';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import './CreateLaunchpad.scss';

const CreateLaunchpad = () => {
  const navigate = useNavigate();
  const walletAddress = useWalletStore(state => state.walletAddress);

  // Collections owned by user
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    collectionId: '',
    classId: '',
    name: '',
    description: '',
    bannerImage: null,
    mintPrice: '',
    mintPriceDenom: 'ucore',
    maxSupply: '',
    maxPerWallet: '',
    startTime: '',
    endTime: '',
    isWhitelistOnly: false,
    whitelistMintLimit: '',
    whitelistEndTime: '',
    baseUri: '',
    placeholderUri: '',
    isRevealed: false
  });

  const [bannerPreview, setBannerPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Load user's collections
  useEffect(() => {
    const loadCollections = async () => {
      if (!walletAddress) return;

      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('creator_address', walletAddress)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setCollections(data || []);
      } catch (err) {
        console.error('Error loading collections:', err);
        setError('Failed to load your collections');
      } finally {
        setLoadingCollections(false);
      }
    };

    loadCollections();
  }, [walletAddress]);

  // Handle collection selection
  const handleCollectionChange = (e) => {
    const collectionId = e.target.value;
    const collection = collections.find(c => c.id === collectionId);

    setFormData({
      ...formData,
      collectionId,
      classId: collection?.class_id || '',
      name: formData.name || collection?.name || ''
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle banner image upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Banner image must be less than 10MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setFormData({
      ...formData,
      bannerImage: file
    });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.collectionId) {
      setError('Please select a collection');
      return false;
    }

    if (!formData.name.trim()) {
      setError('Please enter a launchpad name');
      return false;
    }

    if (!formData.mintPrice || parseFloat(formData.mintPrice) < 0) {
      setError('Please enter a valid mint price');
      return false;
    }

    if (!formData.maxSupply || parseInt(formData.maxSupply) <= 0) {
      setError('Please enter a valid maximum supply');
      return false;
    }

    if (formData.maxPerWallet && parseInt(formData.maxPerWallet) <= 0) {
      setError('Max per wallet must be greater than 0');
      return false;
    }

    if (!formData.startTime) {
      setError('Please select a start time');
      return false;
    }

    if (new Date(formData.startTime) < new Date()) {
      setError('Start time must be in the future');
      return false;
    }

    if (formData.endTime && new Date(formData.endTime) <= new Date(formData.startTime)) {
      setError('End time must be after start time');
      return false;
    }

    if (formData.isWhitelistOnly && !formData.whitelistMintLimit) {
      setError('Please enter whitelist mint limit');
      return false;
    }

    if (formData.whitelistEndTime && new Date(formData.whitelistEndTime) <= new Date(formData.startTime)) {
      setError('Whitelist end time must be after start time');
      return false;
    }

    if (!formData.baseUri.trim()) {
      setError('Please enter a base URI for NFT metadata');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setCreating(true);

    try {
      // Upload banner image if provided
      let bannerImageUrl = null;
      if (formData.bannerImage) {
        const fileName = `launchpad-banners/${Date.now()}-${formData.bannerImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('nft-images')
          .upload(fileName, formData.bannerImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('nft-images')
          .getPublicUrl(fileName);

        bannerImageUrl = publicUrl;
      }

      // Create launchpad
      const launchpadData = {
        collectionId: formData.collectionId,
        classId: formData.classId,
        creatorAddress: address,
        name: formData.name.trim(),
        description: formData.description.trim(),
        bannerImage: bannerImageUrl,
        mintPrice: parseFloat(formData.mintPrice),
        mintPriceDenom: formData.mintPriceDenom,
        maxSupply: parseInt(formData.maxSupply),
        maxPerWallet: formData.maxPerWallet ? parseInt(formData.maxPerWallet) : null,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        isWhitelistOnly: formData.isWhitelistOnly,
        whitelistMintLimit: formData.whitelistMintLimit ? parseInt(formData.whitelistMintLimit) : null,
        whitelistEndTime: formData.whitelistEndTime ? new Date(formData.whitelistEndTime).toISOString() : null,
        baseUri: formData.baseUri.trim(),
        placeholderUri: formData.placeholderUri.trim() || null,
        isRevealed: formData.isRevealed
      };

      const result = await launchpadService.createLaunchpad(launchpadData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Navigate to launchpad page
      navigate(`/launchpads/${result.launchpad.id}`);
    } catch (err) {
      console.error('Error creating launchpad:', err);
      setError(err.message || 'Failed to create launchpad');
    } finally {
      setCreating(false);
    }
  };

  if (!address) {
    return (
      <div className="create-launchpad-container">
        <div className="not-connected">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to create a launchpad.</p>
        </div>
      </div>
    );
  }

  if (loadingCollections) {
    return (
      <div className="create-launchpad-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="create-launchpad-container">
        <div className="no-collections">
          <h2>No Collections Found</h2>
          <p>You need to create a collection before you can set up a launchpad.</p>
          <Button onClick={() => navigate('/collections/create')}>
            Create Collection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-launchpad-container">
      <div className="create-launchpad-header">
        <h1>Create NFT Launchpad</h1>
        <p>Set up a launchpad for your NFT collection. NFTs will be minted on-demand through the launchpad.</p>
      </div>

      <form onSubmit={handleSubmit} className="create-launchpad-form">
        {/* Collection Selection */}
        <section className="form-section">
          <h2>Collection</h2>
          <div className="form-group">
            <label htmlFor="collectionId">Select Collection *</label>
            <select
              id="collectionId"
              name="collectionId"
              value={formData.collectionId}
              onChange={handleCollectionChange}
              required
            >
              <option value="">Choose a collection...</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name} ({collection.symbol})
                </option>
              ))}
            </select>
            <small>The collection must be created before setting up a launchpad</small>
          </div>
        </section>

        {/* Basic Info */}
        <section className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">Launchpad Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Genesis Launch"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your launchpad..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bannerImage">Banner Image</label>
            <input
              type="file"
              id="bannerImage"
              accept="image/*"
              onChange={handleBannerUpload}
            />
            {bannerPreview && (
              <div className="banner-preview">
                <img src={bannerPreview} alt="Banner preview" />
              </div>
            )}
            <small>Recommended: 1200x400px, max 10MB</small>
          </div>
        </section>

        {/* Minting Parameters */}
        <section className="form-section">
          <h2>Minting Parameters</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mintPrice">Mint Price *</label>
              <input
                type="number"
                id="mintPrice"
                name="mintPrice"
                value={formData.mintPrice}
                onChange={handleChange}
                placeholder="0.00"
                step="0.000001"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mintPriceDenom">Currency</label>
              <select
                id="mintPriceDenom"
                name="mintPriceDenom"
                value={formData.mintPriceDenom}
                onChange={handleChange}
              >
                <option value="ucore">CORE</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxSupply">Maximum Supply *</label>
              <input
                type="number"
                id="maxSupply"
                name="maxSupply"
                value={formData.maxSupply}
                onChange={handleChange}
                placeholder="10000"
                min="1"
                required
              />
              <small>Total NFTs available through this launchpad</small>
            </div>

            <div className="form-group">
              <label htmlFor="maxPerWallet">Max Per Wallet</label>
              <input
                type="number"
                id="maxPerWallet"
                name="maxPerWallet"
                value={formData.maxPerWallet}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                min="1"
              />
              <small>Leave empty for no limit</small>
            </div>
          </div>
        </section>

        {/* Timing */}
        <section className="form-section">
          <h2>Launch Schedule</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
              <small>Leave empty for no end time</small>
            </div>
          </div>
        </section>

        {/* Whitelist Settings */}
        <section className="form-section">
          <h2>Whitelist Settings</h2>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isWhitelistOnly"
                checked={formData.isWhitelistOnly}
                onChange={handleChange}
              />
              <span>Whitelist Only (no public minting)</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="whitelistMintLimit">Whitelist Mint Limit</label>
              <input
                type="number"
                id="whitelistMintLimit"
                name="whitelistMintLimit"
                value={formData.whitelistMintLimit}
                onChange={handleChange}
                placeholder="e.g., 5"
                min="1"
              />
              <small>Max mints per whitelisted wallet</small>
            </div>

            <div className="form-group">
              <label htmlFor="whitelistEndTime">Whitelist Phase End</label>
              <input
                type="datetime-local"
                id="whitelistEndTime"
                name="whitelistEndTime"
                value={formData.whitelistEndTime}
                onChange={handleChange}
              />
              <small>When public minting begins</small>
            </div>
          </div>
        </section>

        {/* Metadata Configuration */}
        <section className="form-section">
          <h2>NFT Metadata</h2>
          
          <div className="form-group">
            <label htmlFor="baseUri">Base URI *</label>
            <input
              type="text"
              id="baseUri"
              name="baseUri"
              value={formData.baseUri}
              onChange={handleChange}
              placeholder="https://ipfs.io/ipfs/QmXXX"
              required
            />
            <small>Base URL for token metadata. Token ID will be appended (e.g., /1.json)</small>
          </div>

          <div className="form-group">
            <label htmlFor="placeholderUri">Placeholder URI (Pre-reveal)</label>
            <input
              type="text"
              id="placeholderUri"
              name="placeholderUri"
              value={formData.placeholderUri}
              onChange={handleChange}
              placeholder="https://ipfs.io/ipfs/QmXXX/placeholder.json"
            />
            <small>Metadata shown before reveal (optional)</small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isRevealed"
                checked={formData.isRevealed}
                onChange={handleChange}
              />
              <span>Reveal immediately (show real metadata from start)</span>
            </label>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={creating}
          >
            {creating ? 'Creating Launchpad...' : 'Create Launchpad'}
          </Button>
        </div>

        <div className="form-note">
          <p>
            <strong>Note:</strong> After creating your launchpad, you'll be able to:
          </p>
          <ul>
            <li>Manage your whitelist</li>
            <li>Apply for the "Vetted" badge</li>
            <li>View real-time analytics</li>
            <li>Cancel the launchpad at any time</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default CreateLaunchpad;

