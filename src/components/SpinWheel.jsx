// SpinWheel Container Component - Manages spin logic and state
// Location: src/components/SpinWheel.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import Wheel3D from './Wheel3D';
import { freeSpinService } from '../services/freeSpinService';
import { toast } from 'react-toastify';
import './SpinWheel.scss';

const SpinWheel = ({ campaignId, embedded = false, onPrizeWon }) => {
  const { address, isConnected } = useWalletStore();
  
  // State
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [spinsRemaining, setSpinsRemaining] = useState(0);
  const [eligibilityReason, setEligibilityReason] = useState('');
  const [targetSegment, setTargetSegment] = useState(null);
  const [prizeResult, setPrizeResult] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [claimingPrize, setClaimingPrize] = useState(false);
  const [spinHistory, setSpinHistory] = useState([]);

  /**
   * Load campaign data
   */
  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  /**
   * Check eligibility when wallet connects
   */
  useEffect(() => {
    if (address && campaign) {
      checkEligibility();
      loadSpinHistory();
    }
  }, [address, campaign]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await freeSpinService.getCampaignById(campaignId);
      setCampaign(data);
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error(error.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const result = await freeSpinService.checkSpinEligibility(campaignId, address);
      setCanSpin(result.canSpin);
      setSpinsRemaining(result.spinsRemaining);
      setEligibilityReason(result.reason || '');
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setCanSpin(false);
      setEligibilityReason(error.message);
    }
  };

  const loadSpinHistory = async () => {
    try {
      const history = await freeSpinService.getSpinHistory(campaignId, address);
      setSpinHistory(history);
    } catch (error) {
      console.error('Error loading spin history:', error);
    }
  };

  /**
   * Handle spin button click
   */
  const handleSpin = async () => {
    if (!isConnected) {
      toast.warning('Please connect your wallet to spin');
      return;
    }

    if (!canSpin) {
      toast.warning(eligibilityReason || 'You cannot spin at this time');
      return;
    }

    if (spinning) return;

    try {
      setSpinning(true);
      setPrizeResult(null);

      // Execute spin (server determines prize)
      const result = await freeSpinService.executeSpin(campaignId, address);

      // Set target segment for animation
      setTargetSegment(result.segmentIndex);
      
      // Update spins remaining
      setSpinsRemaining(result.spinsRemaining);
      
      // Store result for display after animation
      setPrizeResult(result);
      
    } catch (error) {
      console.error('Error executing spin:', error);
      toast.error(error.message || 'Failed to spin');
      setSpinning(false);
      setTargetSegment(null);
    }
  };

  /**
   * Handle spin animation complete
   */
  const handleSpinComplete = useCallback((segmentIndex) => {
    setSpinning(false);
    setTargetSegment(null);
    
    // Show prize result
    if (prizeResult) {
      setShowPrizeModal(true);
      
      // Update spin history
      loadSpinHistory();
      
      // Callback to parent
      if (onPrizeWon) {
        onPrizeWon(prizeResult);
      }
    }
  }, [prizeResult, onPrizeWon]);

  /**
   * Handle claiming NFT prize
   */
  const handleClaimPrize = async () => {
    if (!prizeResult || prizeResult.prize.type !== 'nft') return;

    try {
      setClaimingPrize(true);
      
      const result = await freeSpinService.claimPrize(
        prizeResult.historyId,
        address
      );

      toast.success('Prize claimed successfully!');
      
      // Update prize result with claim info
      setPrizeResult({
        ...prizeResult,
        claimed: true,
        txHash: result.txHash
      });
      
      // Refresh history
      loadSpinHistory();
      
    } catch (error) {
      console.error('Error claiming prize:', error);
      toast.error(error.message || 'Failed to claim prize');
    } finally {
      setClaimingPrize(false);
    }
  };

  /**
   * Prepare segments for wheel display
   */
  const getWheelSegments = () => {
    if (!campaign || !campaign.prizes) return [];

    return campaign.prizes.map((prize, index) => ({
      label: prize.label || prize.name || `Prize ${index + 1}`,
      color: prize.color || undefined,
      probability: prize.probability,
      ...prize
    }));
  };

  /**
   * Render prize modal
   */
  const renderPrizeModal = () => {
    if (!showPrizeModal || !prizeResult) return null;

    const { prize, prizeResult: prizeData, claimed, txHash } = prizeResult;

    return (
      <div className="prize-modal-overlay" onClick={() => setShowPrizeModal(false)}>
        <div className="prize-modal" onClick={(e) => e.stopPropagation()}>
          <button 
            className="close-button"
            onClick={() => setShowPrizeModal(false)}
          >
            ×
          </button>
          
          <div className="prize-modal-content">
            {prize.type === 'nft' ? (
              <>
                <div className="prize-icon prize-nft">🎁</div>
                <h2>Congratulations!</h2>
                <p className="prize-message">You won an NFT!</p>
                
                {prizeData.nft && (
                  <div className="prize-nft-preview">
                    {prizeData.nft.image_url && (
                      <img 
                        src={prizeData.nft.image_url} 
                        alt={prizeData.nft.name}
                        className="nft-image"
                      />
                    )}
                    <h3>{prizeData.nft.name}</h3>
                    {prizeData.nft.description && (
                      <p className="nft-description">{prizeData.nft.description}</p>
                    )}
                  </div>
                )}
                
                {!claimed && prizeData.status === 'reserved' && (
                  <button 
                    className="btn btn-primary claim-button"
                    onClick={handleClaimPrize}
                    disabled={claimingPrize}
                  >
                    {claimingPrize ? 'Claiming...' : 'Claim NFT'}
                  </button>
                )}
                
                {claimed && txHash && (
                  <div className="claim-success">
                    <p className="success-text">✅ NFT Claimed!</p>
                    <a 
                      href={`https://explorer.coreum.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View Transaction
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="prize-icon prize-message">💬</div>
                <h2>{prize.label || 'Spin Result'}</h2>
                <p className="prize-message">
                  {prizeData.text || 'Better luck next time!'}
                </p>
              </>
            )}
            
            {spinsRemaining > 0 && (
              <p className="spins-remaining">
                You have {spinsRemaining} spin{spinsRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render spin history
   */
  const renderSpinHistory = () => {
    if (!spinHistory || spinHistory.length === 0) return null;

    return (
      <div className="spin-history">
        <h3>Your Spin History</h3>
        <div className="history-list">
          {spinHistory.slice(0, 5).map((spin) => (
            <div key={spin.id} className="history-item">
              <div className="history-icon">
                {spin.prize_type === 'nft' ? '🎁' : '💬'}
              </div>
              <div className="history-details">
                <p className="history-type">
                  {spin.prize_type === 'nft' ? 'NFT Prize' : 'Message'}
                </p>
                <p className="history-date">
                  {new Date(spin.spun_at).toLocaleDateString()}
                </p>
              </div>
              <div className={`history-status status-${spin.status}`}>
                {spin.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="spin-wheel-loading">
        <div className="loading-spinner"></div>
        <p>Loading spin wheel...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="spin-wheel-error">
        <p>Campaign not found</p>
      </div>
    );
  }

  if (!campaign.active) {
    return (
      <div className="spin-wheel-inactive">
        <p>This campaign is not currently active</p>
      </div>
    );
  }

  return (
    <div className={`spin-wheel-container ${embedded ? 'embedded' : 'standalone'}`}>
      {/* Campaign Info */}
      {!embedded && (
        <div className="campaign-info">
          <h2>{campaign.name}</h2>
          {campaign.description && (
            <p className="campaign-description">{campaign.description}</p>
          )}
          {campaign.collections && (
            <div className="campaign-collection">
              <span>Collection: </span>
              <strong>{campaign.collections.name}</strong>
            </div>
          )}
        </div>
      )}

      {/* Spin Status */}
      <div className="spin-status">
        {!isConnected ? (
          <div className="status-warning">
            <p>🔗 Connect your wallet to spin</p>
          </div>
        ) : !canSpin ? (
          <div className="status-error">
            <p>❌ {eligibilityReason}</p>
          </div>
        ) : (
          <div className="status-success">
            <p>✅ You have {spinsRemaining} spin{spinsRemaining !== 1 ? 's' : ''} available</p>
          </div>
        )}
      </div>

      {/* The Wheel */}
      <div className="wheel-section">
        <Wheel3D
          segments={getWheelSegments()}
          isSpinning={spinning}
          targetSegmentIndex={targetSegment}
          onSpinComplete={handleSpinComplete}
          disabled={!canSpin || !isConnected}
          size={embedded ? 300 : 400}
        />
      </div>

      {/* Spin Button */}
      <div className="spin-actions">
        <button
          className="btn btn-primary btn-spin"
          onClick={handleSpin}
          disabled={!canSpin || !isConnected || spinning}
        >
          {spinning ? (
            <>
              <span className="spinner"></span>
              Spinning...
            </>
          ) : (
            'SPIN THE WHEEL'
          )}
        </button>
      </div>

      {/* Campaign Stats */}
      {campaign.total_spins_used > 0 && (
        <div className="campaign-stats">
          <div className="stat-item">
            <span className="stat-value">{campaign.total_spins_used}</span>
            <span className="stat-label">Total Spins</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{campaign.total_prizes_claimed || 0}</span>
            <span className="stat-label">Prizes Claimed</span>
          </div>
        </div>
      )}

      {/* Spin History */}
      {isConnected && renderSpinHistory()}

      {/* Prize Modal */}
      {renderPrizeModal()}
    </div>
  );
};

export default SpinWheel;

