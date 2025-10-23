// Admin Verification Panel
// File: src/pages/AdminVerification.jsx
// Admin dashboard for managing verification requests

import React, { useState, useEffect } from 'react';
import useWalletStore from '../store/walletStore';
import verifiedBadgeService from '../services/verifiedBadgeService';
import toast from 'react-hot-toast';
import './AdminVerification.scss';

const AdminVerification = () => {
  const walletAddress = useWalletStore(state => state.walletAddress);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      const adminStatus = verifiedBadgeService.isAdmin(walletAddress);
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        loadRequests();
      }
    }
  }, [walletAddress]);

  const loadRequests = async () => {
    setLoading(true);
    const result = await verifiedBadgeService.getPendingRequests();
    if (result.success) {
      setRequests(result.requests);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this verification?')) {
      return;
    }

    const reason = prompt('Verification reason (optional):');

    const result = await verifiedBadgeService.approveVerification(
      requestId,
      walletAddress,
      reason || 'Approved by admin'
    );

    if (result.success) {
      loadRequests(); // Reload list
    }
  };

  const handleReject = async (requestId) => {
    const notes = prompt('Rejection reason:');
    if (!notes) return;

    const result = await verifiedBadgeService.rejectVerification(
      requestId,
      walletAddress,
      notes
    );

    if (result.success) {
      loadRequests(); // Reload list
    }
  };

  if (!walletAddress) {
    return (
      <div className="admin-verification-page">
        <div className="admin-container">
          <div className="access-denied">
            <h2>🔒 Admin Access Required</h2>
            <p>Please connect your wallet to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-verification-page">
        <div className="admin-container">
          <div className="access-denied">
            <h2>⛔ Access Denied</h2>
            <p>You do not have admin permissions.</p>
            <small>Connected: {walletAddress}</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-verification-page">
      <div className="admin-container">
        <div className="header">
          <h1>🛡️ Admin: Verification Requests</h1>
          <button onClick={loadRequests} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <p>No pending verification requests</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div>
                    <span className="request-type">
                      {request.entity_type === 'collection' ? '📦 Collection' : '👤 User'}
                    </span>
                    <span className="badge-level">{request.requested_badge_level}</span>
                  </div>
                  <span className="request-date">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="request-details">
                  <div className="detail-row">
                    <label>Entity ID:</label>
                    <code>{request.entity_id}</code>
                  </div>
                  <div className="detail-row">
                    <label>Requester:</label>
                    <code>{request.requester_address}</code>
                  </div>

                  {request.supporting_info && Object.keys(request.supporting_info).length > 0 && (
                    <div className="supporting-info">
                      <label>Supporting Info:</label>
                      <div className="info-grid">
                        {Object.entries(request.supporting_info).map(([key, value]) => (
                          <div key={key} className="info-item">
                            <strong>{key}:</strong>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="btn-approve"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="btn-reject"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;

