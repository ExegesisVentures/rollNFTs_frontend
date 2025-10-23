// Create NFT Page - UPDATED WITH COLLECTION SELECTION
// File: src/pages/CreateNFT.jsx
// Users must select a collection before minting

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWalletStore from '../store/walletStore';
import WalletModal from '../components/WalletModal';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';
import { validateNFTMetadata, validateImageFile } from '../utils/validation';
import toast, { Toaster } from 'react-hot-toast';
import imageService from '../services/imageService';
import coreumService from '../services/coreumService';
import marketplaceService from '../services/marketplaceService';
import { nftsAPI, collectionsAPI } from '../services/api';
import './CreateNFT.scss';

const CreateNFT = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useWalletStore();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [formData, setFormData] = useState({
    collectionId: '', // NEW: Collection selection required
    name: '',
    description: '',
    price: '',
    listForSale: false,
    payWithRoll: false,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [minting, setMinting] = useState(false);
  const [errors, setErrors] = useState({});

  // Load user's collections on mount
  useEffect(() => {
    if (isConnected && address) {
      loadUserCollections();
    }
  }, [isConnected, address]);

  const loadUserCollections = async () => {
    try {
      setLoadingCollections(true);
      const result = await collectionsAPI.getByOwner(address);
      if (result.success && result.data) {
        setCollections(result.data);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

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
    
    // Validate collection selection first
    if (!formData.collectionId) {
      toast.error('Please select a collection');
      return;
    }
    
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
      const toastId = toast.loading('Uploading to IPFS...');

      // Step 1: Upload image to IPFS via Pinata
      const imageUpload = await imageService.uploadToIPFS(formData.image, {
        name: formData.name,
        keyvalues: {
          collection: 'default', // Or selected collection
          creator: address,
        },
      });

      if (!imageUpload.success) {
        throw new Error('Failed to upload image to IPFS');
      }

      toast.loading('Creating metadata...', { id: toastId });

      // Step 2: Create metadata JSON
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: `ipfs://${imageUpload.ipfsHash}`,
        external_url: window.location.origin,
        attributes: [], // Add attributes if any
        properties: {
          category: 'image',
          files: [
            {
              uri: `ipfs://${imageUpload.ipfsHash}`,
              type: formData.image.type,
            },
          ],
        },
      };

      // Step 3: Upload metadata to IPFS
      const metadataUpload = await imageService.uploadMetadataToIPFS(metadata);

      if (!metadataUpload.success) {
        throw new Error('Failed to upload metadata to IPFS');
      }

      toast.loading('Minting NFT on Coreum...', { id: toastId });

      // Step 4: Get wallet (Keplr, Leap, or Cosmostation)
      const wallet = window.keplr || window.leap || window.cosmostation?.providers?.keplr;
      if (!wallet) {
        throw new Error('Wallet not found. Please install Keplr, Leap, or Cosmostation');
      }

      // Step 5: Mint NFT on Coreum blockchain
      const tokenId = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const mintResult = await coreumService.mintNFT(wallet, {
        classId: formData.collectionId, // Use selected collection
        tokenId: tokenId,
        uri: metadataUpload.url,
        recipient: address,
      });

      if (!mintResult.success) {
        throw new Error(mintResult.error || 'Failed to mint NFT on blockchain');
      }

      toast.loading('Optimizing images...', { id: toastId });

      // Step 6: Trigger image optimization (background process)
      imageService.optimizeAndCache(imageUpload.ipfsHash, imageUpload.url);

      // Step 7: Save to database via backend API
      try {
        await nftsAPI.create({
          token_id: mintResult.tokenId,
          name: formData.name,
          description: formData.description,
          image_ipfs: imageUpload.ipfsHash,
          image_url: imageUpload.url,
          metadata_uri: metadataUpload.url,
          owner: address,
          creator: address,
          chain: 'CORE',
          collection: 'rollnfts',
          tx_hash: mintResult.txHash,
        });
      } catch (dbError) {
        console.warn('Database save failed (non-critical):', dbError);
        // Continue even if DB save fails - NFT is minted on chain
      }

      toast.success('NFT minted successfully!', { id: toastId });

      // Step 8: List for sale if price provided
      if (formData.listForSale && formData.price && parseFloat(formData.price) > 0) {
        const listResult = await marketplaceService.listNFT(wallet, {
          classId: 'rollnfts',
          tokenId: mintResult.tokenId,
          price: parseFloat(formData.price),
          payWithRoll: formData.payWithRoll,
          royaltyBps: 1000, // 10% royalty
        });

        if (listResult.success) {
          toast.success('NFT listed for sale!');
          navigate('/explore'); // Go to marketplace
        } else {
          navigate('/my-nfts'); // Go to My NFTs page
        }
      } else {
        navigate('/my-nfts');
      }

    } catch (error) {
      console.error('Minting error:', error);
      toast.error(error.message || 'Failed to mint NFT. Please try again.');
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
          Upload your artwork and mint on Coreum blockchain
        </p>

        <form className="create-nft__form" onSubmit={handleSubmit}>
          {/* Collection Selection */}
          <div className="create-nft__field">
            <label className="create-nft__label">Collection *</label>
            {loadingCollections ? (
              <div className="create-nft__loading">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="create-nft__no-collections">
                <p>You don't have any collections yet.</p>
                <Button
                  type="button"
                  onClick={() => navigate('/create-collection')}
                >
                  Create Your First Collection
                </Button>
              </div>
            ) : (
              <select
                className="create-nft__select"
                value={formData.collectionId}
                onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                required
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id || collection.class_id} value={collection.class_id}>
                    {collection.name} ({collection.symbol})
                  </option>
                ))}
              </select>
            )}
            <p className="create-nft__hint">
              NFTs must be minted into a collection. Collection features (burning, freezing, etc.) are set when creating the collection.
            </p>
          </div>

          {/* Image Upload */}
          <div className="create-nft__field">
            <label className="create-nft__label">Image *</label>
            <div className="create-nft__image-upload">
              {imagePreview ? (
                <div className="create-nft__image-preview">
                  <img 
                    src={imagePreview} 
                    alt="Preview"
                    loading="eager"
                    decoding="async"
                  />
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

          {/* List for Sale Toggle */}
          <div className="create-nft__field">
            <label className="create-nft__checkbox-label">
              <input
                type="checkbox"
                checked={formData.listForSale}
                onChange={(e) => setFormData({ ...formData, listForSale: e.target.checked })}
              />
              <span>List for sale immediately</span>
            </label>
          </div>

          {/* Price (conditional) */}
          {formData.listForSale && (
            <>
              <div className="create-nft__field">
                <label className="create-nft__label">Price (CORE)</label>
                <div className="create-nft__price-input">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`create-nft__input ${errors.price ? 'create-nft__input--error' : ''}`}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                  <span className="create-nft__price-currency">CORE</span>
                </div>
                {errors.price && <span className="create-nft__error">{errors.price}</span>}
              </div>

              {/* Roll Token Burn Option */}
              <div className="create-nft__field">
                <label className="create-nft__checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.payWithRoll}
                    onChange={(e) => setFormData({ ...formData, payWithRoll: e.target.checked })}
                  />
                  <span>Burn Roll tokens for 50% fee discount (0.5% instead of 1%)</span>
                </label>
                {formData.payWithRoll && formData.price && (
                  <p className="create-nft__hint">
                    You'll burn {(parseFloat(formData.price) * 0.005).toFixed(2)} ROLL tokens worth to save 0.5% on sale
                  </p>
                )}
              </div>
            </>
          )}

          {/* Submit */}
          <div className="create-nft__actions">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={minting} disabled={minting}>
              {minting ? 'Minting...' : 'Create NFT'}
            </Button>
          </div>

          {/* Info */}
          <div className="create-nft__info">
            <p>
              <strong>Gas Fee:</strong> ~0.05 CORE (paid to blockchain validators)
            </p>
            <p>
              <strong>Storage:</strong> Free (IPFS via Pinata)
            </p>
            {formData.listForSale && (
              <p>
                <strong>Platform Fee:</strong> {formData.payWithRoll ? '0.5%' : '1%'} when NFT sells
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNFT;

