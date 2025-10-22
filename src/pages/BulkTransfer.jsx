// Bulk Transfer Component
// File: src/pages/BulkTransfer.jsx
// Premium service for transferring multiple NFTs at once

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import bulkTransferService from '../services/bulkTransferService';
import toast from 'react-hot-toast';
import './BulkTransfer.scss';

const BulkTransfer = () => {
  const { wallet, address } = useWallet();
  const [transfers, setTransfers] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  // Add single transfer manually
  const addTransfer = () => {
    setTransfers([
      ...transfers,
      {
        classId: '',
        tokenId: '',
        recipient: '',
      },
    ]);
  };

  // Update transfer field
  const updateTransfer = (index, field, value) => {
    const newTransfers = [...transfers];
    newTransfers[index][field] = value;
    setTransfers(newTransfers);
  };

  // Remove transfer
  const removeTransfer = (index) => {
    setTransfers(transfers.filter((_, i) => i !== index));
  };

  // Parse CSV file
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parseResult = bulkTransferService.parseCSV(event.target.result);

      if (parseResult.success) {
        setTransfers(parseResult.transfers);
        toast.success(`Loaded ${parseResult.transfers.length} transfers from CSV`);
      } else {
        toast.error(parseResult.error);
      }
    };
    reader.readAsText(file);
  };

  // Execute bulk transfer
  const handleBulkTransfer = async () => {
    if (!wallet) {
      toast.error('Please connect your wallet');
      return;
    }

    if (transfers.length === 0) {
      toast.error('Please add at least one transfer');
      return;
    }

    // Validate all transfers
    for (let i = 0; i < transfers.length; i++) {
      const t = transfers[i];
      if (!t.classId || !t.tokenId || !t.recipient) {
        toast.error(`Transfer #${i + 1} is incomplete`);
        return;
      }
      if (!t.recipient.startsWith('core1')) {
        toast.error(`Transfer #${i + 1}: Invalid Coreum address`);
        return;
      }
    }

    setProcessing(true);

    const transferResult = await bulkTransferService.bulkTransfer(wallet, {
      transfers,
    });

    if (transferResult.success) {
      setResult(transferResult);
    }

    setProcessing(false);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent =
      'classId,tokenId,recipient\n' +
      'my-collection-core1xxx,nft-001,core1recipientaddress...\n' +
      'my-collection-core1xxx,nft-002,core1recipientaddress...';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-transfer-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bulk-transfer-page">
      <div className="bulk-transfer-container">
        <div className="header">
          <h1>📦 Bulk Transfer</h1>
          <p className="subtitle">
            Transfer multiple NFTs at once. Service fee: <strong>0.3 CORE</strong> +
            gas
          </p>
        </div>

        {!result ? (
          <div className="setup-section">
            {/* CSV Upload */}
            <div className="upload-section">
              <h3>Upload CSV</h3>
              <div className="upload-actions">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  id="csv-upload"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => document.getElementById('csv-upload').click()}
                  className="btn-upload"
                >
                  📁 Choose CSV File
                </button>
                <button onClick={downloadTemplate} className="btn-template">
                  ⬇️ Download Template
                </button>
              </div>
              <small>
                Format: classId, tokenId, recipient (one transfer per line)
              </small>
            </div>

            <div className="divider">OR</div>

            {/* Manual Transfers */}
            <div className="transfers-section">
              <div className="transfers-header">
                <h3>Transfers ({transfers.length})</h3>
                <button onClick={addTransfer} className="btn-add">
                  + Add Transfer
                </button>
              </div>

              {transfers.map((transfer, index) => (
                <div key={index} className="transfer-card">
                  <div className="transfer-header">
                    <span>Transfer #{index + 1}</span>
                    <button
                      onClick={() => removeTransfer(index)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="transfer-fields">
                    <div className="field">
                      <label>Collection ID</label>
                      <input
                        type="text"
                        placeholder="my-collection-core1xxx..."
                        value={transfer.classId}
                        onChange={(e) =>
                          updateTransfer(index, 'classId', e.target.value)
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Token ID</label>
                      <input
                        type="text"
                        placeholder="nft-001"
                        value={transfer.tokenId}
                        onChange={(e) =>
                          updateTransfer(index, 'tokenId', e.target.value)
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Recipient Address</label>
                      <input
                        type="text"
                        placeholder="core1..."
                        value={transfer.recipient}
                        onChange={(e) =>
                          updateTransfer(index, 'recipient', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fee Summary */}
            {transfers.length > 0 && (
              <div className="fee-summary">
                <h4>Fee Estimate</h4>
                <div className="fee-row">
                  <span>Service Fee:</span>
                  <span>0.3 CORE</span>
                </div>
                <div className="fee-row">
                  <span>Gas ({transfers.length} transfers):</span>
                  <span>~{(transfers.length * 0.03).toFixed(2)} CORE</span>
                </div>
                <div className="fee-row total">
                  <span>Total Estimate:</span>
                  <span>~{(0.3 + transfers.length * 0.03).toFixed(2)} CORE</span>
                </div>
              </div>
            )}

            {/* Transfer Button */}
            <button
              onClick={handleBulkTransfer}
              disabled={processing || transfers.length === 0}
              className="btn-primary"
            >
              {processing ? 'Processing...' : `Transfer ${transfers.length} NFTs`}
            </button>
          </div>
        ) : (
          <div className="result-section">
            <div className="result-header">
              <h3>✅ Transfer Complete</h3>
              <p>Job ID: <code>{result.jobId}</code></p>
            </div>

            <div className="stats">
              <div className="stat success">
                <span>✅ Success</span>
                <strong>{result.successCount}</strong>
              </div>
              <div className="stat failed">
                <span>❌ Failed</span>
                <strong>{result.failCount}</strong>
              </div>
              <div className="stat total">
                <span>📦 Total</span>
                <strong>{result.total}</strong>
              </div>
            </div>

            {/* Results List */}
            <div className="results-list">
              <h4>Transfer Results</h4>
              {result.results.map((r, i) => (
                <div key={i} className={`result-item ${r.success ? 'success' : 'failed'}`}>
                  <span className="status">{r.success ? '✅' : '❌'}</span>
                  <span className="token">{r.tokenId}</span>
                  {r.success ? (
                    <a
                      href={`https://explorer.coreum.com/coreum/transactions/${r.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View Tx →
                    </a>
                  ) : (
                    <span className="error">{r.error}</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setResult(null);
                setTransfers([]);
              }}
              className="btn-secondary"
            >
              New Bulk Transfer
            </button>
          </div>
        )}

        {/* Premium Notice */}
        <div className="premium-notice">
          <span className="icon">⚡</span>
          <div>
            <strong>Premium Service</strong>
            <p>
              Bulk transfer saves time and ensures all your NFTs reach their
              destination. Our service handles transaction batching, error handling,
              and provides detailed logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkTransfer;

