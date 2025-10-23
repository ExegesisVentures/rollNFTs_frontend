/**
 * Admin Launchpad Dashboard
 * File: src/pages/AdminLaunchpadDashboard.jsx
 * 
 * Admin interface for reviewing and approving launchpad vetting applications.
 * Only accessible to admin wallets.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { adminLaunchpadService } from '../services/adminLaunchpadService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import './AdminLaunchpadDashboard.scss';

const AdminLaunchpadDashboard = () => {
  const navigate = useNavigate();
  const { address } = useWalletStore();

  const [applications, setApplications] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [appStats, setAppStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedApp, setSelectedApp] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const [filterStatus, setFilterStatus] = useState(['pending', 'under_review']);

  // Check admin access
  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }

    if (!adminLaunchpadService.isAdmin(address)) {
      navigate('/');
      return;
    }

    loadData();
  }, [address, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load applications
      const appsResult = await adminLaunchpadService.getPendingApplications({
        status: filterStatus,
        sortBy: 'submitted_at'
      });

      if (!appsResult.success) {
        throw new Error(appsResult.error);
      }

      setApplications(appsResult.applications);

      // Load stats
      const [statsResult, appStatsResult] = await Promise.all([
        adminLaunchpadService.getPlatformStats(),
        adminLaunchpadService.getApplicationStats()
      ]);

      if (statsResult.success) {
        setPlatformStats(statsResult.stats);
      }

      if (appStatsResult.success) {
        setAppStats(appStatsResult.stats);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (application, action) => {
    setSelectedApp(application);
    setReviewAction(action);
    setReviewNotes('');
    setRejectionReason('');
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (!selectedApp) return;

    setProcessing(true);
    setError('');

    try {
      let result;

      if (reviewAction === 'approve') {
        result = await adminLaunchpadService.approveApplication(
          selectedApp.id,
          address,
          reviewNotes
        );
      } else if (reviewAction === 'reject') {
        if (!rejectionReason.trim()) {
          throw new Error('Rejection reason is required');
        }
        result = await adminLaunchpadService.rejectApplication(
          selectedApp.id,
          address,
          rejectionReason,
          reviewNotes
        );
      } else if (reviewAction === 'request_changes') {
        if (!reviewNotes.trim()) {
          throw new Error('Please specify what changes are needed');
        }
        result = await adminLaunchpadService.requestChanges(
          selectedApp.id,
          address,
          reviewNotes
        );
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      // Close modal and reload
      setShowReviewModal(false);
      loadData();
    } catch (err) {
      console.error('Error reviewing application:', err);
      setError(err.message || 'Failed to review application');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>🔐 Admin Dashboard - Launchpad Vetting</h1>
        <p>Review and approve launchpad vetting applications</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        {/* Application Stats */}
        {appStats && (
          <div className="stats-section">
            <h2>Application Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Pending Review</span>
                <span className="stat-value pending">{appStats.pending}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Under Review</span>
                <span className="stat-value">{appStats.underReview}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Approved</span>
                <span className="stat-value approved">{appStats.approved}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Rejected</span>
                <span className="stat-value rejected">{appStats.rejected}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Approval Rate</span>
                <span className="stat-value">{appStats.approvalRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Platform Stats */}
        {platformStats && (
          <div className="stats-section">
            <h2>Platform Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Launchpads</span>
                <span className="stat-value">{platformStats.totalLaunchpads}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active Launchpads</span>
                <span className="stat-value active">{platformStats.activeLaunchpads}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Vetted Launchpads</span>
                <span className="stat-value vetted">{platformStats.vettedLaunchpads}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Mints</span>
                <span className="stat-value">{platformStats.totalMints}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value">
                  {(platformStats.totalRevenue / 1_000_000).toFixed(2)} CORE
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Unique Participants</span>
                <span className="stat-value">{platformStats.uniqueParticipants}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={filterStatus.includes('pending')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilterStatus([...filterStatus, 'pending']);
                  } else {
                    setFilterStatus(filterStatus.filter(s => s !== 'pending'));
                  }
                }}
              />
              <span>Pending</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filterStatus.includes('under_review')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilterStatus([...filterStatus, 'under_review']);
                  } else {
                    setFilterStatus(filterStatus.filter(s => s !== 'under_review'));
                  }
                }}
              />
              <span>Under Review</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filterStatus.includes('requires_changes')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilterStatus([...filterStatus, 'requires_changes']);
                  } else {
                    setFilterStatus(filterStatus.filter(s => s !== 'requires_changes'));
                  }
                }}
              />
              <span>Requires Changes</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Applications List */}
      <div className="applications-section">
        <h2>
          Applications
          {applications.length > 0 && (
            <span className="count-badge">{applications.length}</span>
          )}
        </h2>

        {applications.length === 0 ? (
          <div className="empty-state">
            <p>No applications to review</p>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map(app => (
              <div key={app.id} className="application-card">
                {/* Header */}
                <div className="card-header">
                  <div className="header-left">
                    {app.launchpads?.banner_image && (
                      <img
                        src={app.launchpads.banner_image}
                        alt={app.project_name}
                        className="launchpad-image"
                      />
                    )}
                    <div>
                      <h3>{app.project_name}</h3>
                      <span className="launchpad-name">
                        Launchpad: {app.launchpads?.name}
                      </span>
                    </div>
                  </div>
                  <div className={`status-badge status-${app.status}`}>
                    {app.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="card-content">
                  <div className="content-row">
                    <span className="label">Description:</span>
                    <span className="value">{app.project_description}</span>
                  </div>

                  {app.team_info && (
                    <div className="content-row">
                      <span className="label">Team:</span>
                      <span className="value">{app.team_info}</span>
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="content-row">
                    <span className="label">Socials:</span>
                    <div className="social-links">
                      {app.website_url && (
                        <a href={app.website_url} target="_blank" rel="noopener noreferrer">
                          🌐 Website
                        </a>
                      )}
                      {app.twitter_url && (
                        <a href={app.twitter_url} target="_blank" rel="noopener noreferrer">
                          🐦 Twitter
                        </a>
                      )}
                      {app.discord_url && (
                        <a href={app.discord_url} target="_blank" rel="noopener noreferrer">
                          💬 Discord
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Launchpad Info */}
                  {app.launchpads && (
                    <div className="launchpad-info">
                      <div className="info-item">
                        <span>Max Supply:</span>
                        <span>{app.launchpads.max_supply}</span>
                      </div>
                      <div className="info-item">
                        <span>Mint Price:</span>
                        <span>
                          {(app.launchpads.mint_price / 1_000_000).toFixed(2)} CORE
                        </span>
                      </div>
                      <div className="info-item">
                        <span>Start Time:</span>
                        <span>{formatDate(app.launchpads.start_time)}</span>
                      </div>
                    </div>
                  )}

                  {/* KYC Status */}
                  <div className="content-row">
                    <span className="label">KYC:</span>
                    <span className={`kyc-status ${app.kyc_completed ? 'completed' : 'pending'}`}>
                      {app.kyc_completed ? '✓ Completed' : '⏳ Pending'}
                      {app.kyc_provider && ` (${app.kyc_provider})`}
                    </span>
                  </div>

                  <div className="content-row">
                    <span className="label">Submitted:</span>
                    <span className="value">{formatDate(app.submitted_at)}</span>
                  </div>

                  <div className="content-row">
                    <span className="label">Applicant:</span>
                    <span className="value address">{app.applicant_address}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <Button
                    variant="success"
                    onClick={() => openReviewModal(app, 'approve')}
                    disabled={processing}
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => openReviewModal(app, 'request_changes')}
                    disabled={processing}
                  >
                    ⚠️ Request Changes
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => openReviewModal(app, 'reject')}
                    disabled={processing}
                  >
                    ✗ Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApp && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => !processing && setShowReviewModal(false)}
          title={`${reviewAction.charAt(0).toUpperCase() + reviewAction.slice(1).replace('_', ' ')} Application`}
        >
          <div className="review-modal">
            <div className="modal-content">
              <h3>{selectedApp.project_name}</h3>
              <p className="launchpad-info">{selectedApp.launchpads?.name}</p>

              {reviewAction === 'reject' && (
                <div className="form-group">
                  <label htmlFor="rejectionReason">Rejection Reason *</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why is this application being rejected?"
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reviewNotes">
                  Admin Notes {reviewAction === 'request_changes' && '*'}
                </label>
                <textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Optional notes about approval...'
                      : reviewAction === 'request_changes'
                      ? 'Specify what changes are needed...'
                      : 'Optional additional notes...'
                  }
                  rows={4}
                />
              </div>

              {error && (
                <div className="modal-error">
                  {error}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant={
                  reviewAction === 'approve' ? 'success' :
                  reviewAction === 'reject' ? 'danger' :
                  'warning'
                }
                onClick={handleReview}
                disabled={processing}
              >
                {processing ? 'Processing...' : `Confirm ${reviewAction.replace('_', ' ')}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminLaunchpadDashboard;

