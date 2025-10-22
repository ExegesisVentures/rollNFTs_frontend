// Create NFT Page
// File: src/pages/CreateNFT.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useWalletStore from '../store/walletStore';
import WalletModal from '../components/WalletModal';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';
import { validateNFTMetadata, validateImageFile } from '../utils/validation';
import toast, { Toaster } from 'react-hot-toast';
import './CreateNFT.scss';

const CreateNFT = () => {
  const navigate = useNavigate();
  const { isConnected } = useWalletStore();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [minting, setMinting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateNFTMetadata(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    if (!formData.image) {
      toast.error('Please upload an image');
      return;
    }

    try {
      setMinting(true);
      
      // TODO: Implement actual minting logic
      // 1. Upload image to IPFS
      // 2. Create metadata JSON
      // 3. Upload metadata to IPFS
      // 4. Mint NFT on blockchain
      
      // Simulate minting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('NFT minted successfully!');
      navigate('/my-nfts');
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Failed to mint NFT');
    } finally {
      setMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <>
        <div className="create-nft">
          <div className="create-nft__container">
            <EmptyState
              icon="🔐"
              title="Wallet Not Connected"
              description="Please connect your wallet to create NFTs."
              actionText="Connect Wallet"
              onAction={() => setShowWalletModal(true)}
            />
          </div>
        </div>
        <WalletModal 
          isOpen={showWalletModal} 
          onClose={() => setShowWalletModal(false)} 
        />
      </>
    );
  }

  return (
    <div className="create-nft">
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

      <div className="create-nft__container">
        <h1 className="create-nft__title">Create New NFT</h1>
        <p className="create-nft__subtitle">
          Upload your artwork and set your price
        </p>

        <form className="create-nft__form" onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="create-nft__field">
            <label className="create-nft__label">Image *</label>
            <div className="create-nft__image-upload">
              {imagePreview ? (
                <div className="create-nft__image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="create-nft__image-remove"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({ ...formData, image: null });
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="create-nft__upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <span className="create-nft__upload-icon">📤</span>
                  <span className="create-nft__upload-text">
                    Click to upload or drag and drop
                  </span>
                  <span className="create-nft__upload-hint">
                    PNG, JPG, GIF, WEBP. Max 10MB.
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="create-nft__field">
            <label className="create-nft__label">Name *</label>
            <input
              type="text"
              className={`create-nft__input ${errors.name ? 'create-nft__input--error' : ''}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter NFT name"
            />
            {errors.name && <span className="create-nft__error">{errors.name}</span>}
          </div>

          {/* Description */}
          <div className="create-nft__field">
            <label className="create-nft__label">Description *</label>
            <textarea
              className={`create-nft__textarea ${errors.description ? 'create-nft__input--error' : ''}`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your NFT"
              rows={4}
            />
            {errors.description && <span className="create-nft__error">{errors.description}</span>}
          </div>

          {/* Price */}
          <div className="create-nft__field">
            <label className="create-nft__label">Price (Optional)</label>
            <div className="create-nft__price-input">
              <input
                type="number"
                step="0.01"
                className={`create-nft__input ${errors.price ? 'create-nft__input--error' : ''}`}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
              <span className="create-nft__price-currency">XRP</span>
            </div>
            {errors.price && <span className="create-nft__error">{errors.price}</span>}
            <span className="create-nft__hint">Leave empty to not list for sale immediately</span>
          </div>

          {/* Submit */}
          <div className="create-nft__actions">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={minting}>
              {minting ? 'Minting...' : 'Create NFT'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNFT;

