/**
 * Launchpads Browse/Listing Page
 * File: src/pages/Launchpads.jsx
 * 
 * Displays all active and upcoming launchpads with filtering and search.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { launchpadService } from '../services/launchpadService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import VerifiedBadge from '../components/VerifiedBadge';
import Button from '../components/shared/Button';
import './Launchpads.scss';

const Launchpads = () => {
  const [launchpads, setLaunchpads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    vettedOnly: false,
    sortBy: 'created_at',
    status: 'all'
  });

  // Load launchpads
  useEffect(() => {
    loadLaunchpads();
  }, [filters]);

  const loadLaunchpads = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await launchpadService.getActiveLaunchpads({
        vetted: filters.vettedOnly || undefined,
        sortBy: filters.sortBy
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setLaunchpads(result.launchpads);
    } catch (err) {
      console.error('Error loading launchpads:', err);
      setError('Failed to load launchpads');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  // Calculate time status
  const getTimeStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (start > now) {
      return 'upcoming';
    } else if (!end || end > now) {
      return 'live';
    } else {
      return 'ended';
    }
  };

  // Format time remaining
  const getTimeRemaining = (targetTime) => {
    const now = new Date();
    const target = new Date(targetTime);
    const diff = target - now;

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format price
  const formatPrice = (price, denom) => {
    const amount = parseFloat(price);
    if (denom === 'ucore') {
      return `${(amount / 1_000_000).toFixed(2)} CORE`;
    }
    return `${amount} ${denom}`;
  };

  if (loading) {
    return (
      <div className="launchpads-container">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="launchpads-container">
      {/* Header */}
      <div className="launchpads-header">
        <div className="header-content">
          <h1>NFT Launchpads</h1>
          <p>Discover and mint from the latest NFT collections</p>
        </div>
        <Link to="/launchpads/create">
          <Button variant="primary">Create Launchpad</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="launchpads-filters">
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.vettedOnly}
              onChange={(e) => handleFilterChange('vettedOnly', e.target.checked)}
            />
            <span>Vetted Only</span>
          </label>
        </div>

        <div className="filter-group">
          <label htmlFor="sortBy">Sort By:</label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="created_at">Newest</option>
            <option value="start_time">Start Time</option>
            <option value="total_minted">Most Minted</option>
            <option value="total_raised">Highest Revenue</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Launchpads Grid */}
      {launchpads.length === 0 ? (
        <EmptyState
          title="No Launchpads Found"
          message="Be the first to create a launchpad!"
          actionText="Create Launchpad"
          actionLink="/launchpads/create"
        />
      ) : (
        <div className="launchpads-grid">
          {launchpads.map(launchpad => {
            const timeStatus = getTimeStatus(launchpad.start_time, launchpad.end_time);
            const progress = (launchpad.minted_count / launchpad.max_supply) * 100;
            const isSoldOut = launchpad.minted_count >= launchpad.max_supply;

            return (
              <Link
                key={launchpad.id}
                to={`/launchpads/${launchpad.id}`}
                className="launchpad-card"
              >
                {/* Banner Image */}
                <div className="card-banner">
                  {launchpad.banner_image ? (
                    <img src={launchpad.banner_image} alt={launchpad.name} />
                  ) : launchpad.collection_image ? (
                    <img src={launchpad.collection_image} alt={launchpad.name} />
                  ) : (
                    <div className="banner-placeholder">
                      {launchpad.name.charAt(0)}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`status-badge status-${timeStatus}`}>
                    {timeStatus === 'live' && '🔴 LIVE'}
                    {timeStatus === 'upcoming' && '⏰ Upcoming'}
                    {timeStatus === 'ended' && '✓ Ended'}
                  </div>

                  {/* Vetted Badge */}
                  {launchpad.is_vetted && (
                    <div className="vetted-badge-overlay">
                      <VerifiedBadge size="small" />
                    </div>
                  )}

                  {/* Sold Out Badge */}
                  {isSoldOut && (
                    <div className="soldout-badge">SOLD OUT</div>
                  )}
                </div>

                {/* Card Content */}
                <div className="card-content">
                  <div className="card-header">
                    <h3>{launchpad.name}</h3>
                    {launchpad.is_vetted && <VerifiedBadge size="small" inline />}
                  </div>

                  {launchpad.description && (
                    <p className="card-description">
                      {launchpad.description.length > 100
                        ? `${launchpad.description.substring(0, 100)}...`
                        : launchpad.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-label">Mint Price</span>
                      <span className="stat-value">
                        {formatPrice(launchpad.mint_price, launchpad.mint_price_denom || 'ucore')}
                      </span>
                    </div>

                    <div className="stat">
                      <span className="stat-label">Supply</span>
                      <span className="stat-value">
                        {launchpad.minted_count} / {launchpad.max_supply}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    {progress.toFixed(1)}% Minted
                  </div>

                  {/* Time Info */}
                  {timeStatus === 'upcoming' && (
                    <div className="time-info">
                      Starts in {getTimeRemaining(launchpad.start_time)}
                    </div>
                  )}

                  {timeStatus === 'live' && launchpad.end_time && (
                    <div className="time-info live">
                      Ends in {getTimeRemaining(launchpad.end_time)}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Leaderboard Link */}
      <div className="launchpads-footer">
        <Link to="/launchpads/leaderboard">
          <Button variant="secondary">View Leaderboard →</Button>
        </Link>
      </div>
    </div>
  );
};

export default Launchpads;

