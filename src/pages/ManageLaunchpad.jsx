/**
 * Manage Launchpad Page
 * File: src/pages/ManageLaunchpad.jsx
 * 
 * Creator dashboard for managing their launchpad:
 * - View analytics and stats
 * - Manage whitelist
 * - Cancel launchpad
 * - Apply for vetting
 * - Reveal NFTs
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { launchpadService } from '../services/launchpadService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import './ManageLaunchpad.scss';

const ManageLaunchpad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useWalletStore();

  const [launchpad, setLaunchpad] = useState(null);
  const [stats, setStats] = useState(null);
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Whitelist management
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [whitelistAddresses, setWhitelistAddresses] = useState('');
  const [whitelistMaxMints, setWhitelistMaxMints] = useState('1');
  const [whitelistProcessing, setWhitelistProcessing] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [postCancelAction, setPostCancelAction] = useState('none');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!address) {
      navigate('/launchpads');
      return;
    }

    loadData();
  }, [address, id]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await launchpadService.getLaunchpadById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      const lp = result.launchpad;
      
      // Verify creator
      if (lp.creator_address !== address) {
        throw new Error('You are not the creator of this launchpad');
      }

      setLaunchpad(lp);

      // Load stats
      const statsResult = await launchpadService.getLaunchpadStats(id);
      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      // Load whitelist if applicable
      if (lp.is_whitelist_only || lp.whitelist_end_time) {
        const wlResult = await launchpadService.getWhitelist(id);
        if (wlResult.success) {
          setWhitelist(wlResult.whitelist);
        }
      }
    } catch (err) {
      console.error('Error loading launchpad:', err);
      setError(err.message || 'Failed to load launchpad');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWhitelist = async () => {
    setWhitelistProcessing(true);
    setError('');

    try {
      const addresses = whitelistAddresses
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (addresses.length === 0) {
        throw new Error('Please enter at least one address');
      }

      const maxMints = parseInt(whitelistMaxMints);
      if (isNaN(maxMints) || maxMints < 1) {
        throw new Error('Max mints must be at least 1');
      }

      const whitelistData = addresses.map(addr => ({
        address: addr,
        maxMints: maxMints
      }));

      const result = await launchpadService.addToWhitelist(id, whitelistData, address);
      if (!result.success) {
        throw new Error(result.error);
      }

      setShowWhitelistModal(false);
      setWhitelistAddresses('');
      setWhitelistMaxMints('1');
      loadData();
    } catch (err) {
      console.error('Error adding to whitelist:', err);
      setError(err.message || 'Failed to add addresses');
    } finally {
      setWhitelistProcessing(false);
    }
  };

  const handleRemoveFromWhitelist = async (walletAddress) => {
    if (!confirm(`Remove ${walletAddress} from whitelist?`)) return;

    try {
      const result = await launchpadService.removeFromWhitelist(id, walletAddress, address);
      if (!result.success) {
        throw new Error(result.error);
      }

      loadData();
    } catch (err) {
      console.error('Error removing from whitelist:', err);
      setError(err.message || 'Failed to remove address');
    }
  };

  const handleCancelLaunchpad = async () => {
    if (!cancelReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    setError('');

    try {
      const result = await launchpadService.cancelLaunchpad(
        id,
        address,
        cancelReason,
        postCancelAction
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setShowCancelModal(false);
      loadData();
    } catch (err) {
      console.error('Error cancelling launchpad:', err);
      setError(err.message || 'Failed to cancel launchpad');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="manage-launchpad-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !launchpad) {
    return (
      <div className="manage-launchpad-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/launchpads')}>
            Back to Launchpads
          </Button>
        </div>
      </div>
    );
  }

  const canCancel = launchpad.status === 'active' || launchpad.status === 'pending';

  return (
    <div className="manage-launchpad-container">
      {/* Header */}
      <div className="manage-header">
        <div className="header-content">
          <h1>Manage Launchpad</h1>
          <h2>{launchpad.name}</h2>
          <div className={`status-badge status-${launchpad.status}`}>
            {launchpad.status.toUpperCase()}
          </div>
        </div>
        <div className="header-actions">
          <Link to={`/launchpads/${id}`}>
            <Button variant="secondary">View Launchpad</Button>
          </Link>
          {!launchpad.is_vetted && (
            <Link to={`/launchpads/${id}/apply-vetting`}>
              <Button variant="primary">Apply for Vetted Badge</Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="stats-section">
          <h3>Performance Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Minted</span>
              <span className="stat-value">{stats.totalMinted} / {launchpad.max_supply}</span>
              <div className="stat-progress">
                <div
                  className="progress-fill"
                  style={{ width: `${stats.completionPercentage}%` }}
                />
              </div>
              <span className="stat-note">{stats.completionPercentage}% Complete</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">
                {(stats.totalRaised / 1_000_000).toFixed(2)} CORE
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Unique Minters</span>
              <span className="stat-value">{stats.uniqueMinters}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Last 24h Mints</span>
              <span className="stat-value">{stats.recent24h}</span>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="config-section">
        <h3>Configuration</h3>
        <div className="config-grid">
          <div className="config-item">
            <span className="config-label">Mint Price</span>
            <span className="config-value">
              {(launchpad.mint_price / 1_000_000).toFixed(2)} CORE
            </span>
          </div>

          <div className="config-item">
            <span className="config-label">Max Supply</span>
            <span className="config-value">{launchpad.max_supply}</span>
          </div>

          <div className="config-item">
            <span className="config-label">Max Per Wallet</span>
            <span className="config-value">
              {launchpad.max_per_wallet || 'Unlimited'}
            </span>
          </div>

          <div className="config-item">
            <span className="config-label">Start Time</span>
            <span className="config-value">{formatDate(launchpad.start_time)}</span>
          </div>

          {launchpad.end_time && (
            <div className="config-item">
              <span className="config-label">End Time</span>
              <span className="config-value">{formatDate(launchpad.end_time)}</span>
            </div>
          )}

          <div className="config-item">
            <span className="config-label">Whitelist Only</span>
            <span className="config-value">{launchpad.is_whitelist_only ? 'Yes' : 'No'}</span>
          </div>

          <div className="config-item">
            <span className="config-label">Revealed</span>
            <span className="config-value">{launchpad.is_revealed ? 'Yes' : 'No'}</span>
          </div>

          <div className="config-item">
            <span className="config-label">Vetted</span>
            <span className="config-value">{launchpad.is_vetted ? '✓ Yes' : 'Not yet'}</span>
          </div>
        </div>
      </div>

      {/* Whitelist Management */}
      {(launchpad.is_whitelist_only || launchpad.whitelist_end_time) && (
        <div className="whitelist-section">
          <div className="section-header">
            <h3>Whitelist ({whitelist.length})</h3>
            <Button
              variant="primary"
              onClick={() => setShowWhitelistModal(true)}
              disabled={launchpad.status === 'cancelled'}
            >
              Add Addresses
            </Button>
          </div>

          {whitelist.length === 0 ? (
            <div className="empty-whitelist">
              <p>No addresses whitelisted yet</p>
            </div>
          ) : (
            <div className="whitelist-table">
              <table>
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Max Mints</th>
                    <th>Used</th>
                    <th>Remaining</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {whitelist.map(entry => (
                    <tr key={entry.id}>
                      <td className="address-cell">{entry.wallet_address}</td>
                      <td>{entry.max_mints}</td>
                      <td>{entry.mints_used}</td>
                      <td>{entry.max_mints - entry.mints_used}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleRemoveFromWhitelist(entry.wallet_address)}
                          disabled={launchpad.status === 'cancelled'}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="actions-section">
        <h3>Actions</h3>
        <div className="actions-grid">
          {canCancel && (
            <div className="action-card danger">
              <h4>Cancel Launchpad</h4>
              <p>Stop the launchpad and optionally handle remaining NFTs</p>
              <Button
                variant="danger"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Launchpad
              </Button>
            </div>
          )}

          {launchpad.status === 'cancelled' && (
            <div className="action-card info">
              <h4>Launchpad Cancelled</h4>
              <p>This launchpad was cancelled on {formatDate(launchpad.cancelled_at)}</p>
              <p className="cancel-reason">
                <strong>Reason:</strong> {launchpad.cancellation_reason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Whitelist Modal */}
      {showWhitelistModal && (
        <Modal
          isOpen={showWhitelistModal}
          onClose={() => !whitelistProcessing && setShowWhitelistModal(false)}
          title="Add Addresses to Whitelist"
        >
          <div className="whitelist-modal">
            <div className="form-group">
              <label htmlFor="addresses">Wallet Addresses</label>
              <textarea
                id="addresses"
                value={whitelistAddresses}
                onChange={(e) => setWhitelistAddresses(e.target.value)}
                rows={8}
                placeholder="Enter wallet addresses (one per line)"
              />
              <small>One address per line</small>
            </div>

            <div className="form-group">
              <label htmlFor="maxMints">Max Mints Per Address</label>
              <input
                type="number"
                id="maxMints"
                value={whitelistMaxMints}
                onChange={(e) => setWhitelistMaxMints(e.target.value)}
                min="1"
              />
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowWhitelistModal(false)}
                disabled={whitelistProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddWhitelist}
                disabled={whitelistProcessing}
              >
                {whitelistProcessing ? 'Adding...' : 'Add to Whitelist'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Launchpad Modal */}
      {showCancelModal && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => !cancelling && setShowCancelModal(false)}
          title="Cancel Launchpad"
        >
          <div className="cancel-modal">
            <p className="warning-text">
              ⚠️ This action will stop the launchpad. Users will no longer be able to mint.
            </p>

            <div className="form-group">
              <label htmlFor="cancelReason">Cancellation Reason *</label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                placeholder="Why are you cancelling this launchpad?"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="postAction">What would you like to do with remaining NFTs?</label>
              <select
                id="postAction"
                value={postCancelAction}
                onChange={(e) => setPostCancelAction(e.target.value)}
              >
                <option value="none">Nothing - Leave unminted</option>
                <option value="mint_remaining">Mint remaining to my wallet</option>
                <option value="burn_remaining">Burn remaining slots</option>
              </select>
              <small>You can execute this action later from your dashboard</small>
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelLaunchpad}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageLaunchpad;

