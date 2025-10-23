// Bulk Mint Component
// File: src/pages/BulkMint.jsx
// Premium service for minting multiple NFTs at once

import React, { useState } from 'react';
import useWalletStore from '../store/walletStore';
import bulkMintService from '../services/bulkMintService';
import toast from 'react-hot-toast';
import './BulkMint.scss';

const BulkMint = () => {
  const walletAddress = useWalletStore(state => state.walletAddress);
  const getSigningClient = useWalletStore(state => state.getSigningClient);
  const [collectionId, setCollectionId] = useState('');
  const [items, setItems] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(null);

  // Add single item manually
  const addItem = () => {
    setItems([
      ...items,
      {
        tokenId: '',
        name: '',
        description: '',
        imageUrl: '',
        metadata: {},
      },
    ]);
  };

  // Update item field
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Remove item
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Parse CSV file
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target.result;
        const lines = csvContent.split('\n');
        const parsedItems = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [tokenId, name, description, imageUrl] = line
            .split(',')
            .map((s) => s.trim());

          if (tokenId && name) {
            parsedItems.push({
              tokenId,
              name,
              description: description || '',
              imageUrl: imageUrl || '',
              metadata: {},
            });
          }
        }

        setItems(parsedItems);
        toast.success(`Loaded ${parsedItems.length} items from CSV`);
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  // Create bulk mint job
  const handleCreateJob = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!collectionId) {
      toast.error('Please enter a collection ID');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setProcessing(true);

    const signingClient = await getSigningClient();
    const result = await bulkMintService.createBulkMintJob(signingClient, {
      collectionId,
      items,
      totalCount: items.length,
    });

    if (result.success) {
      setJobId(result.jobId);
      toast.success(`Job created! ID: ${result.jobId}`);
    }

    setProcessing(false);
  };

  // Process bulk mint job
  const handleProcessJob = async () => {
    if (!walletAddress || !jobId) return;

    setProcessing(true);

    const signingClient = await getSigningClient();
    const result = await bulkMintService.processBulkMintJob(signingClient, jobId);

    if (result.success) {
      setProgress(result);
    }

    setProcessing(false);
  };

  return (
    <div className="bulk-mint-page">
      <div className="bulk-mint-container">
        <div className="header">
          <h1>🚀 Bulk Mint</h1>
          <p className="subtitle">
            Mint multiple NFTs at once. Service fee: <strong>0.5 CORE</strong> + gas
          </p>
        </div>

        {!jobId ? (
          <div className="setup-section">
            {/* Collection ID */}
            <div className="form-group">
              <label>Collection ID (Class ID)</label>
              <input
                type="text"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                placeholder="my-collection-core1xxx..."
                className="form-input"
              />
            </div>

            {/* CSV Upload */}
            <div className="form-group">
              <label>Upload CSV (Optional)</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="form-input"
              />
              <small>
                Format: tokenId, name, description, imageUrl (one per line)
              </small>
            </div>

            {/* Manual Items */}
            <div className="items-section">
              <div className="items-header">
                <h3>NFT Items ({items.length})</h3>
                <button onClick={addItem} className="btn-add">
                  + Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="item-card">
                  <div className="item-header">
                    <span>Item #{index + 1}</span>
                    <button
                      onClick={() => removeItem(index)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="item-fields">
                    <input
                      type="text"
                      placeholder="Token ID"
                      value={item.tokenId}
                      onChange={(e) =>
                        updateItem(index, 'tokenId', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Name"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, 'description', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Image URL (IPFS or https://)"
                      value={item.imageUrl}
                      onChange={(e) =>
                        updateItem(index, 'imageUrl', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Fee Summary */}
            {items.length > 0 && (
              <div className="fee-summary">
                <h4>Fee Estimate</h4>
                <div className="fee-row">
                  <span>Service Fee:</span>
                  <span>0.5 CORE</span>
                </div>
                <div className="fee-row">
                  <span>Gas ({items.length} NFTs):</span>
                  <span>~{(items.length * 0.05).toFixed(2)} CORE</span>
                </div>
                <div className="fee-row total">
                  <span>Total Estimate:</span>
                  <span>~{(0.5 + items.length * 0.05).toFixed(2)} CORE</span>
                </div>
              </div>
            )}

            {/* Create Job Button */}
            <button
              onClick={handleCreateJob}
              disabled={processing || !collectionId || items.length === 0}
              className="btn-primary"
            >
              {processing ? 'Creating Job...' : 'Create Bulk Mint Job'}
            </button>
          </div>
        ) : (
          <div className="job-section">
            <div className="job-info">
              <h3>✅ Job Created</h3>
              <p>Job ID: <code>{jobId}</code></p>
              <p>Status: {progress ? 'Completed' : 'Ready to Process'}</p>
            </div>

            {!progress ? (
              <button
                onClick={handleProcessJob}
                disabled={processing}
                className="btn-primary"
              >
                {processing ? 'Processing...' : 'Start Minting'}
              </button>
            ) : (
              <div className="progress-info">
                <h4>Minting Complete!</h4>
                <div className="stats">
                  <div className="stat success">
                    <span>✅ Success</span>
                    <strong>{progress.successCount}</strong>
                  </div>
                  <div className="stat failed">
                    <span>❌ Failed</span>
                    <strong>{progress.failCount}</strong>
                  </div>
                  <div className="stat total">
                    <span>📦 Total</span>
                    <strong>{progress.total}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setJobId(null);
                    setProgress(null);
                    setItems([]);
                  }}
                  className="btn-secondary"
                >
                  Create Another Job
                </button>
              </div>
            )}
          </div>
        )}

        {/* Premium Notice */}
        <div className="premium-notice">
          <span className="icon">⚡</span>
          <div>
            <strong>Premium Service</strong>
            <p>
              Bulk minting saves time and ensures all your NFTs are minted
              correctly. Our service handles IPFS uploads, transaction management,
              and error recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkMint;

