/**
 * Launchpad Detail Page
 * File: src/pages/LaunchpadDetail.jsx
 * 
 * Individual launchpad page with mint functionality, stats, and information.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { launchpadService } from '../services/launchpadService';
import { coreumService } from '../services/coreumService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import VerifiedBadge from '../components/VerifiedBadge';
import Modal from '../components/shared/Modal';
import './LaunchpadDetail.scss';

const LaunchpadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, signAndBroadcast } = useWalletStore();

  const [launchpad, setLaunchpad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [eligibility, setEligibility] = useState(null);
  const [userMints, setUserMints] = useState([]);
  const [stats, setStats] = useState(null);

  const [minting, setMinting] = useState(false);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  // Load launchpad data
  useEffect(() => {
    loadLaunchpad();
  }, [id]);

  // Load user-specific data
  useEffect(() => {
    if (address && launchpad) {
      loadUserData();
    }
  }, [address, launchpad]);

  const loadLaunchpad = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await launchpadService.getLaunchpadById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      setLaunchpad(result.launchpad);

      // Load stats
      const statsResult = await launchpadService.getLaunchpadStats(id);
      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (err) {
      console.error('Error loading launchpad:', err);
      setError('Failed to load launchpad');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Check eligibility
      const eligResult = await launchpadService.checkMintEligibility(id, address);
      setEligibility(eligResult);

      // Load user's mints
      const mintsResult = await launchpadService.getUserMints(id, address);
      if (mintsResult.success) {
        setUserMints(mintsResult.mints);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  // Format price
  const formatPrice = (price, denom) => {
    const amount = parseFloat(price);
    if (denom === 'ucore') {
      return (amount / 1_000_000).toFixed(2);
    }
    return amount.toString();
  };

  // Calculate total mint cost
  const getTotalCost = () => {
    const price = parseFloat(launchpad.mint_price);
    const total = price * mintQuantity;
    
    if (launchpad.mint_price_denom === 'ucore') {
      return (total / 1_000_000).toFixed(6);
    }
    return total.toString();
  };

  // Handle mint
  const handleMint = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!eligibility?.canMint) {
      setError(eligibility?.reason || 'Unable to mint');
      return;
    }

    setShowMintModal(true);
  };

  const confirmMint = async () => {
    setMinting(true);
    setError('');

    try {
      // Generate token IDs
      const startTokenId = launchpad.total_minted + 1;
      const tokenIds = Array.from(
        { length: mintQuantity },
        (_, i) => `${startTokenId + i}`
      );

      // Calculate payment
      const mintPrice = parseFloat(launchpad.mint_price);
      const totalAmount = mintPrice * mintQuantity;

      // Build mint transaction
      const msgs = tokenIds.map(tokenId => ({
        typeUrl: '/coreum.asset.nft.v1.MsgMint',
        value: {
          sender: address,
          classId: launchpad.class_id,
          id: tokenId,
          uri: launchpad.is_revealed && launchpad.base_uri
            ? `${launchpad.base_uri}/${tokenId}.json`
            : launchpad.placeholder_uri || '',
          data: null
        }
      }));

      // Add payment message to creator
      msgs.push({
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: address,
          toAddress: launchpad.creator_address,
          amount: [{
            denom: launchpad.mint_price_denom,
            amount: totalAmount.toString()
          }]
        }
      });

      // Sign and broadcast
      const result = await signAndBroadcast(msgs);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Record mints in database
      for (const tokenId of tokenIds) {
        await launchpadService.mintFromLaunchpad({
          launchpadId: id,
          minterAddress: address,
          tokenId,
          tokenName: `${launchpad.name} #${tokenId}`,
          tokenAttributes: {},
          txHash: result.txHash
        });
      }

      setMintSuccess(true);
      
      // Reload data
      setTimeout(() => {
        setShowMintModal(false);
        setMintSuccess(false);
        loadLaunchpad();
        loadUserData();
      }, 2000);

    } catch (err) {
      console.error('Error minting:', err);
      setError(err.message || 'Minting failed');
    } finally {
      setMinting(false);
    }
  };

  // Get time status
  const getTimeStatus = () => {
    if (!launchpad) return 'unknown';

    const now = new Date();
    const start = new Date(launchpad.start_time);
    const end = launchpad.end_time ? new Date(launchpad.end_time) : null;

    if (start > now) return 'upcoming';
    if (!end || end > now) return 'live';
    return 'ended';
  };

  // Format time
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
      <div className="launchpad-detail-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !launchpad) {
    return (
      <div className="launchpad-detail-container">
        <div className="error-state">
          <h2>Error Loading Launchpad</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/launchpads')}>
            Back to Launchpads
          </Button>
        </div>
      </div>
    );
  }

  if (!launchpad) {
    return (
      <div className="launchpad-detail-container">
        <div className="error-state">
          <h2>Launchpad Not Found</h2>
          <Button onClick={() => navigate('/launchpads')}>
            Back to Launchpads
          </Button>
        </div>
      </div>
    );
  }

  const timeStatus = getTimeStatus();
  const progress = (launchpad.total_minted / launchpad.max_supply) * 100;
  const isSoldOut = launchpad.total_minted >= launchpad.max_supply;
  const isLive = timeStatus === 'live' && !isSoldOut;
  const isCreator = address === launchpad.creator_address;

  return (
    <div className="launchpad-detail-container">
      {/* Banner */}
      <div className="launchpad-banner">
        {launchpad.banner_image ? (
          <img src={launchpad.banner_image} alt={launchpad.name} />
        ) : (
          <div className="banner-gradient" />
        )}

        {/* Status Overlay */}
        <div className="banner-overlay">
          <div className={`status-badge status-${timeStatus}`}>
            {timeStatus === 'live' && '🔴 LIVE NOW'}
            {timeStatus === 'upcoming' && '⏰ UPCOMING'}
            {timeStatus === 'ended' && '✓ ENDED'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="launchpad-content">
        {/* Left Column - Info */}
        <div className="content-left">
          {/* Header */}
          <div className="launchpad-header">
            <div className="header-top">
              <h1>{launchpad.name}</h1>
              {launchpad.is_vetted && <VerifiedBadge size="medium" />}
            </div>

            {isSoldOut && (
              <div className="soldout-tag">SOLD OUT</div>
            )}
          </div>

          {/* Collection Info */}
          {launchpad.collections && (
            <Link
              to={`/collections/${launchpad.class_id}`}
              className="collection-link"
            >
              <img
                src={launchpad.collections.cover_image}
                alt={launchpad.collections.name}
              />
              <div>
                <span className="collection-label">Collection</span>
                <span className="collection-name">{launchpad.collections.name}</span>
              </div>
            </Link>
          )}

          {/* Description */}
          {launchpad.description && (
            <div className="launchpad-description">
              <h2>About</h2>
              <p>{launchpad.description}</p>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="launchpad-stats-section">
              <h2>Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Total Minted</span>
                  <span className="stat-value">{stats.totalMinted}</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Unique Minters</span>
                  <span className="stat-value">{stats.uniqueMinters}</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Total Raised</span>
                  <span className="stat-value">
                    {(stats.totalRaised / 1_000_000).toFixed(2)} CORE
                  </span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Last 24h Mints</span>
                  <span className="stat-value">{stats.recent24h}</span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="launchpad-timeline">
            <h2>Timeline</h2>
            <div className="timeline-item">
              <span className="timeline-label">Start Time</span>
              <span className="timeline-value">{formatDate(launchpad.start_time)}</span>
            </div>
            {launchpad.end_time && (
              <div className="timeline-item">
                <span className="timeline-label">End Time</span>
                <span className="timeline-value">{formatDate(launchpad.end_time)}</span>
              </div>
            )}
            {launchpad.whitelist_end_time && (
              <div className="timeline-item">
                <span className="timeline-label">Whitelist Phase Ends</span>
                <span className="timeline-value">{formatDate(launchpad.whitelist_end_time)}</span>
              </div>
            )}
          </div>

          {/* User's Mints */}
          {userMints.length > 0 && (
            <div className="user-mints-section">
              <h2>Your Mints</h2>
              <div className="mints-list">
                {userMints.map(mint => (
                  <div key={mint.id} className="mint-item">
                    <span className="mint-token">#{mint.token_id}</span>
                    <span className="mint-date">
                      {new Date(mint.minted_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Mint Box */}
        <div className="content-right">
          <div className="mint-box">
            {/* Progress */}
            <div className="mint-progress">
              <div className="progress-header">
                <span className="progress-label">Minted</span>
                <span className="progress-count">
                  {launchpad.total_minted} / {launchpad.max_supply}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="progress-percentage">
                {progress.toFixed(1)}% Complete
              </div>
            </div>

            {/* Price */}
            <div className="mint-price">
              <span className="price-label">Mint Price</span>
              <span className="price-value">
                {formatPrice(launchpad.mint_price, launchpad.mint_price_denom)} CORE
              </span>
            </div>

            {/* Quantity Selector (if live) */}
            {isLive && eligibility?.canMint && (
              <div className="mint-quantity">
                <label htmlFor="quantity">Quantity</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                    disabled={mintQuantity <= 1}
                  >
                    -
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    value={mintQuantity}
                    onChange={(e) => setMintQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={eligibility?.remaining || launchpad.max_per_wallet || 10}
                  />
                  <button
                    onClick={() => setMintQuantity(mintQuantity + 1)}
                    disabled={mintQuantity >= (eligibility?.remaining || launchpad.max_per_wallet || 10)}
                  >
                    +
                  </button>
                </div>
                <small>
                  {eligibility.remaining !== undefined &&
                    `${eligibility.remaining} remaining for you`}
                </small>
              </div>
            )}

            {/* Total Cost */}
            {isLive && eligibility?.canMint && (
              <div className="mint-total">
                <span className="total-label">Total Cost</span>
                <span className="total-value">
                  {getTotalCost()} CORE
                </span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mint-error">
                {error}
              </div>
            )}

            {/* Mint Button */}
            {!address ? (
              <Button variant="primary" fullWidth onClick={() => {}}>
                Connect Wallet to Mint
              </Button>
            ) : isCreator ? (
              <Link to={`/launchpads/${id}/manage`}>
                <Button variant="secondary" fullWidth>
                  Manage Launchpad
                </Button>
              </Link>
            ) : isSoldOut ? (
              <Button variant="disabled" fullWidth disabled>
                Sold Out
              </Button>
            ) : timeStatus === 'upcoming' ? (
              <Button variant="disabled" fullWidth disabled>
                Not Started Yet
              </Button>
            ) : timeStatus === 'ended' ? (
              <Button variant="disabled" fullWidth disabled>
                Launchpad Ended
              </Button>
            ) : !eligibility?.canMint ? (
              <Button variant="disabled" fullWidth disabled>
                {eligibility?.reason || 'Cannot Mint'}
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                onClick={handleMint}
                disabled={minting}
              >
                {minting ? 'Minting...' : 'Mint Now'}
              </Button>
            )}

            {/* Additional Info */}
            <div className="mint-info">
              {launchpad.max_per_wallet && (
                <div className="info-item">
                  Max per wallet: {launchpad.max_per_wallet}
                </div>
              )}
              {launchpad.is_whitelist_only && (
                <div className="info-item">
                  ⭐ Whitelist Only
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mint Confirmation Modal */}
      {showMintModal && (
        <Modal
          isOpen={showMintModal}
          onClose={() => !minting && setShowMintModal(false)}
          title="Confirm Mint"
        >
          {mintSuccess ? (
            <div className="mint-success">
              <div className="success-icon">✓</div>
              <h3>Minting Successful!</h3>
              <p>Your NFTs have been minted successfully.</p>
            </div>
          ) : (
            <div className="mint-confirmation">
              <div className="confirmation-details">
                <div className="detail-row">
                  <span>Quantity:</span>
                  <span>{mintQuantity} NFT{mintQuantity > 1 ? 's' : ''}</span>
                </div>
                <div className="detail-row">
                  <span>Price Each:</span>
                  <span>{formatPrice(launchpad.mint_price, launchpad.mint_price_denom)} CORE</span>
                </div>
                <div className="detail-row total">
                  <span>Total Cost:</span>
                  <span>{getTotalCost()} CORE</span>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => setShowMintModal(false)}
                  disabled={minting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmMint}
                  disabled={minting}
                >
                  {minting ? 'Processing...' : 'Confirm Mint'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default LaunchpadDetail;

