// Verified Badge Component
// File: src/components/VerifiedBadge.jsx
// Shows verification status with badge icon

import React, { useState, useEffect } from 'react';
import verifiedBadgeService from '../services/verifiedBadgeService';
import './VerifiedBadge.scss';

const VerifiedBadge = ({ entityType, entityId, showLabel = false, size = 'medium' }) => {
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadge();
  }, [entityType, entityId]);

  const loadBadge = async () => {
    setLoading(true);
    const result = await verifiedBadgeService.getBadge(entityType, entityId);
    if (result.success && result.badge && result.badge.verified) {
      setBadge(result.badge);
    }
    setLoading(false);
  };

  if (loading || !badge) return null;

  const getBadgeIcon = () => {
    switch (badge.badge_level) {
      case 'official':
        return '🏆'; // Official/Partner badge
      case 'premium':
        return '✨'; // Premium verified badge
      case 'standard':
      default:
        return '✓'; // Standard verified checkmark
    }
  };

  const getBadgeColor = () => {
    switch (badge.badge_level) {
      case 'official':
        return 'gold';
      case 'premium':
        return 'purple';
      case 'standard':
      default:
        return 'blue';
    }
  };

  const getBadgeLabel = () => {
    switch (badge.badge_level) {
      case 'official':
        return 'Official';
      case 'premium':
        return 'Premium Verified';
      case 'standard':
      default:
        return 'Verified';
    }
  };

  return (
    <div className={`verified-badge ${size} ${getBadgeColor()}`} title={`${getBadgeLabel()} - ${badge.verification_reason || ''}`}>
      <span className="badge-icon">{getBadgeIcon()}</span>
      {showLabel && <span className="badge-label">{getBadgeLabel()}</span>}
    </div>
  );
};

export default VerifiedBadge;

