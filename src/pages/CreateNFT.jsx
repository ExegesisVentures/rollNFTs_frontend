// Create NFT Page - 2-STEP WIZARD (Collection → NFT Details)
// File: src/pages/CreateNFT.jsx
// Smart UX: Collection selection FIRST, then NFT form

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const { isConnected, address, getSigningClient } = useWalletStore();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Step management: 'select-collection' or 'create-nft'
  const [step, setStep] = useState('select-collection');
  const [selectedCollection, setSelectedCollection] = useState(null);
  
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [formData, setFormData] = useState({
    collectionId: '',
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

  // Check if collection was passed via URL parameter
  useEffect(() => {
    const collectionId = searchParams.get('collection');
    if (collectionId && collections.length > 0) {
      const collection = collections.find(c => c.class_id === collectionId);
      if (collection) {
        handleCollectionSelect(collection);
      }
    }
  }, [searchParams, collections]);

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

  const handleCollectionSelect = (collection) => {
    setSelectedCollection(collection);
    setFormData({ ...formData, collectionId: collection.class_id });
    setStep('create-nft');
  };

  const handleBackToCollections = () => {
    setStep('select-collection');
    setSelectedCollection(null);
    setFormData({ ...formData, collectionId: '' });
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

      // Step 4: Get signing client
      const signingClient = await getSigningClient();
      if (!signingClient) {
        throw new Error('Failed to get signing client. Please reconnect your wallet.');
      }

      // Step 5: Mint NFT on Coreum blockchain
      const tokenId = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const mintResult = await coreumService.mintNFT(signingClient, {
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
        const listResult = await marketplaceService.listNFT(signingClient, address, {
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

  // STEP 1: COLLECTION SELECTION SCREEN
  if (step === 'select-collection') {
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
          <div className="create-nft__step-indicator">
            <span className="create-nft__step active">1. Select Collection</span>
            <span className="create-nft__step-divider">→</span>
            <span className="create-nft__step">2. NFT Details</span>
          </div>

          <h1 className="create-nft__title">Select a Collection</h1>
          <p className="create-nft__subtitle">
            Choose which collection to mint your NFT into
          </p>

          {loadingCollections ? (
            <div className="create-nft__loading-collections">
              <div className="spinner"></div>
              <p>Loading your collections...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="create-nft__no-collections-screen">
              <div className="create-nft__no-collections-icon">📦</div>
              <h2>No Collections Found</h2>
              <p>You need to create a collection before minting NFTs.</p>
              <p className="create-nft__no-collections-hint">
                Collections define permanent features like burning, freezing, and royalty rates for all NFTs within them.
              </p>
              <div className="create-nft__no-collections-actions">
                <Button
                  onClick={() => navigate('/create-collection')}
                  variant="primary"
                >
                  ✨ Create Your First Collection
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="secondary"
                >
                  ← Back to Home
                </Button>
              </div>
            </div>
          ) : (
            <div className="create-nft__collections-grid">
              {collections.map((collection) => (
                <div
                  key={collection.id || collection.class_id}
                  className="create-nft__collection-card"
                  onClick={() => handleCollectionSelect(collection)}
                >
                  <div className="create-nft__collection-image">
                    {collection.image || collection.cover_image ? (
                      <img 
                        src={collection.image || collection.cover_image} 
                        alt={collection.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300?text=Collection';
                        }}
                      />
                    ) : (
                      <div className="create-nft__collection-placeholder">
                        {collection.symbol?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="create-nft__collection-info">
                    <h3>{collection.name}</h3>
                    <p className="create-nft__collection-symbol">{collection.symbol}</p>
                    <p className="create-nft__collection-items">
                      {collection.total_items || 0} items
                    </p>
                  </div>
                  <div className="create-nft__collection-select-btn">
                    Select →
                  </div>
                </div>
              ))}
              
              <div
                className="create-nft__collection-card create-nft__collection-card--create"
                onClick={() => navigate('/create-collection')}
              >
                <div className="create-nft__collection-create-icon">+</div>
                <div className="create-nft__collection-info">
                  <h3>Create New Collection</h3>
                  <p>Start a new collection</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 2: NFT CREATION FORM
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
        <div className="create-nft__step-indicator">
          <span className="create-nft__step completed" onClick={handleBackToCollections}>
            ✓ 1. Collection
          </span>
          <span className="create-nft__step-divider">→</span>
          <span className="create-nft__step active">2. NFT Details</span>
        </div>

        <div className="create-nft__selected-collection">
          <button 
            type="button" 
            className="create-nft__change-collection"
            onClick={handleBackToCollections}
          >
            ← Change Collection
          </button>
          <div className="create-nft__selected-collection-info">
            <span className="create-nft__selected-collection-label">Minting into:</span>
            <span className="create-nft__selected-collection-name">
              {selectedCollection?.name} ({selectedCollection?.symbol})
            </span>
          </div>
        </div>

        <h1 className="create-nft__title">Create New NFT</h1>
        <p className="create-nft__subtitle">
          Upload your artwork and mint on Coreum blockchain
        </p>

        <form className="create-nft__form" onSubmit={handleSubmit}>
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

