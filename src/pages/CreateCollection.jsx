// Create Collection Page
// File: src/pages/CreateCollection.jsx
// Proper NFT collection creation with feature selection

import React, { useState } from 'react';
import useWalletStore from '../store/walletStore';
import { useNavigate } from 'react-router-dom';
import coreumService from '../services/coreumService';
import imageService from '../services/imageService';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';
import CollectionPreviewModal from '../components/CollectionPreviewModal';
import './CreateCollection.scss';

const CreateCollection = () => {
  const walletAddress = useWalletStore(state => state.walletAddress);
  const getSigningClient = useWalletStore(state => state.getSigningClient);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    coverImage: null,
    website: '',
    twitter: '',
    discord: '',
  });

  const [features, setFeatures] = useState({
    burning: true, // Allow holders to burn their NFTs
    freezing: false, // Allow issuer to freeze NFTs
    whitelisting: false, // Restrict who can hold NFTs
    disableSending: false, // Lock NFTs (can't transfer)
  });

  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle feature toggles
  const toggleFeature = (feature) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  // Handle cover image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setFormData(prev => ({ ...prev, coverImage: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle preview button click
  const handlePreview = (e) => {
    e.preventDefault();

    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.symbol) {
      toast.error('Name and symbol are required');
      return;
    }

    // Validate symbol (alphanumeric, 3-10 chars)
    if (!/^[a-zA-Z0-9]{3,10}$/.test(formData.symbol)) {
      toast.error('Symbol must be 3-10 alphanumeric characters');
      return;
    }

    // Show preview modal
    setShowPreview(true);
  };

  // Create collection (after preview confirmation)
  const handleCreateCollection = async () => {
    // Don't close the modal yet - keep it open to show loading state
    setCreating(true);

    try {
      console.log('🎨 Starting collection creation...');
      
      // Step 1: Upload cover image to IPFS (if provided)
      let coverImageUrl = '';
      if (formData.coverImage) {
        console.log('📸 Uploading cover image to IPFS...');
        setUploading(true);
        const uploadResult = await imageService.uploadToIPFS(formData.coverImage, {
          name: `${formData.symbol}-cover`,
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload cover image');
        }

        coverImageUrl = uploadResult.url;
        console.log('✅ Cover image uploaded:', coverImageUrl);
        setUploading(false);
      }

      // Step 2: Create collection metadata
      console.log('📝 Creating metadata...');
      const metadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: coverImageUrl,
        external_url: formData.website || '',
        social: {
          twitter: formData.twitter || '',
          discord: formData.discord || '',
        },
      };

      // Upload metadata to IPFS
      const metadataResult = await imageService.uploadMetadataToIPFS(metadata);
      if (!metadataResult.success) {
        throw new Error(metadataResult.error || 'Failed to upload metadata');
      }
      console.log('✅ Metadata uploaded:', metadataResult.url);

      // Step 3: Convert features to Coreum format
      const coreumFeatures = [];
      if (features.burning) coreumFeatures.push(1); // ClassFeature_burning
      if (features.freezing) coreumFeatures.push(2); // ClassFeature_freezing
      if (features.whitelisting) coreumFeatures.push(3); // ClassFeature_whitelisting
      if (features.disableSending) coreumFeatures.push(4); // ClassFeature_disable_sending

      // Step 4: Create collection on Coreum
      console.log('⛓️ Creating collection on Coreum blockchain...');
      const signingClient = await getSigningClient();
      const createResult = await coreumService.createCollection(signingClient, {
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        description: formData.description,
        uri: metadataResult.url,
        features: coreumFeatures,
      });

      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create collection on blockchain');
      }
      console.log('✅ Collection created on blockchain:', createResult.classId);

      // Step 5: Save to database
      console.log('💾 Saving collection to database...');
      const { error: dbError } = await supabase
        .from('collections')
        .insert({
          collection_id: createResult.classId,
          name: formData.name,
          symbol: formData.symbol.toUpperCase(),
          description: formData.description,
          cover_image: coverImageUrl,
          metadata_uri: metadataResult.url,
          creator_address: walletAddress,
          features_burning: features.burning,
          features_freezing: features.freezing,
          features_whitelisting: features.whitelisting,
          features_disable_sending: features.disableSending,
          tx_hash: createResult.txHash,
        });

      if (dbError) {
        console.error('⚠️ Database error:', dbError);
        toast.error('Collection created but failed to save to database. You may need to refresh.');
        // Don't fail - collection was created on-chain
      } else {
        console.log('✅ Collection saved to database');
      }

      // Success!
      toast.success(`🎉 Collection "${formData.name}" created successfully!`);
      
      // Close modal and navigate after a short delay
      setShowPreview(false);
      setTimeout(() => {
        navigate(`/collection/${createResult.classId}`);
      }, 1500);

    } catch (error) {
      console.error('❌ Collection creation error:', error);
      
      // Provide detailed error messages
      let errorMessage = 'Failed to create collection';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
      
      // Don't close the modal on error - let user try again or edit
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

  return (
    <div className="create-collection-page">
      <div className="create-collection-container">
        <div className="header">
          <h1>🎨 Create NFT Collection</h1>
          <p className="subtitle">
            Set up your collection with name, symbol, and features. This cannot be changed later!
          </p>
        </div>

        <form onSubmit={handlePreview} className="collection-form">
          {/* Cover Image */}
          <div className="form-section">
            <h3>Collection Image</h3>
            <div className="image-upload">
              {coverImagePreview ? (
                <div className="image-preview">
                  <img src={coverImagePreview} alt="Cover preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, coverImage: null }));
                      setCoverImagePreview(null);
                    }}
                    className="btn-remove-image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="image-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                  />
                  <div className="upload-placeholder">
                    <span className="icon">🖼️</span>
                    <span>Click to upload cover image</span>
                    <small>Recommended: 1200x400px</small>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Collection Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Awesome Collection"
                required
                maxLength={50}
              />
              <small>The name of your NFT collection</small>
            </div>

            <div className="form-group">
              <label>Symbol * (Cannot be changed)</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="AWESOME"
                required
                maxLength={10}
                pattern="[a-zA-Z0-9]{3,10}"
                style={{ textTransform: 'uppercase' }}
              />
              <small>3-10 alphanumeric characters (e.g., PUNKS, APES)</small>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your collection..."
                rows={4}
                maxLength={500}
              />
              <small>{formData.description.length}/500 characters</small>
            </div>
          </div>

          {/* Features (CRITICAL!) */}
          <div className="form-section features-section">
            <h3>⚠️ Collection Features (Cannot be changed later!)</h3>
            <p className="warning-text">
              These settings are PERMANENT once the collection is created.
            </p>

            <div className="features-grid">
              <div className={`feature-card ${features.burning ? 'enabled' : ''}`}>
                <div className="feature-header">
                  <input
                    type="checkbox"
                    id="burning"
                    checked={features.burning}
                    onChange={() => toggleFeature('burning')}
                  />
                  <label htmlFor="burning">
                    <strong>🔥 Burning</strong>
                  </label>
                </div>
                <p>Allow NFT holders to burn (destroy) their tokens</p>
                <small>Recommended: Enable for most collections</small>
              </div>

              <div className={`feature-card ${features.freezing ? 'enabled' : ''}`}>
                <div className="feature-header">
                  <input
                    type="checkbox"
                    id="freezing"
                    checked={features.freezing}
                    onChange={() => toggleFeature('freezing')}
                  />
                  <label htmlFor="freezing">
                    <strong>❄️ Freezing</strong>
                  </label>
                </div>
                <p>Allow issuer to freeze/unfreeze individual NFTs</p>
                <small>Use case: Moderation, compliance</small>
              </div>

              <div className={`feature-card ${features.whitelisting ? 'enabled' : ''}`}>
                <div className="feature-header">
                  <input
                    type="checkbox"
                    id="whitelisting"
                    checked={features.whitelisting}
                    onChange={() => toggleFeature('whitelisting')}
                  />
                  <label htmlFor="whitelisting">
                    <strong>✅ Whitelisting</strong>
                  </label>
                </div>
                <p>Restrict who can hold NFTs from this collection</p>
                <small>Use case: Exclusive membership</small>
              </div>

              <div className={`feature-card ${features.disableSending ? 'enabled' : ''}`}>
                <div className="feature-header">
                  <input
                    type="checkbox"
                    id="disableSending"
                    checked={features.disableSending}
                    onChange={() => toggleFeature('disableSending')}
                  />
                  <label htmlFor="disableSending">
                    <strong>🔒 Disable Sending</strong>
                  </label>
                </div>
                <p>Make NFTs non-transferable (soulbound)</p>
                <small>Use case: Achievements, identity</small>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="form-section">
            <h3>Social Links (Optional)</h3>
            
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://myproject.com"
              />
            </div>

            <div className="form-group">
              <label>Twitter</label>
              <input
                type="text"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                placeholder="@myproject"
              />
            </div>

            <div className="form-group">
              <label>Discord</label>
              <input
                type="url"
                name="discord"
                value={formData.discord}
                onChange={handleChange}
                placeholder="https://discord.gg/..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={creating || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={creating || uploading || !formData.name || !formData.symbol}
            >
              {uploading ? 'Uploading Image...' : creating ? 'Creating Collection...' : '🎨 Preview Creation'}
            </button>
          </div>

          {/* Info Box */}
          <div className="info-box">
            <strong>💡 Important:</strong>
            <ul>
              <li>Collection symbol and features CANNOT be changed after creation</li>
              <li>Estimated cost: ~0.1 CORE + gas</li>
              <li>You'll be able to mint NFTs into this collection after creation</li>
            </ul>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      <CollectionPreviewModal
        isOpen={showPreview}
        onClose={() => !creating && setShowPreview(false)} // Prevent closing during creation
        formData={formData}
        coverImagePreview={coverImagePreview}
        onConfirm={handleCreateCollection}
        onEdit={() => setShowPreview(false)}
        isCreating={creating}
      />
    </div>
  );
};

export default CreateCollection;

