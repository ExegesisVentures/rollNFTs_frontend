// User Profile Page
// File: src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWalletStore from '../store/walletStore';
import profileService from '../services/profileService';
import { nftsAPI, collectionsAPI } from '../services/api';
import NFTCard from '../components/NFTCard';
import CollectionCard from '../components/CollectionCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import toast from 'react-hot-toast';
import './Profile.scss';

const Profile = () => {
  const { address } = useParams(); // If viewing another user's profile
  const navigate = useNavigate();
  const { isConnected, walletAddress } = useWalletStore();
  
  // Determine whose profile we're viewing
  const profileAddress = address || walletAddress;
  const isOwnProfile = !address || address === walletAddress;

  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nfts'); // nfts, collections, activity, favorites
  
  // Profile data
  const [nfts, setNfts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activity, setActivity] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Loading states
  const [nftsLoading, setNftsLoading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    email: '',
    website: '',
    twitter: '',
    discord: '',
    instagram: '',
  });
  
  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    email_notifications: true,
    show_wallet_balance: true,
    profile_visibility: 'public',
  });
  
  // Avatar/Banner upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (profileAddress) {
      loadProfile();
      loadNFTs();
      loadCollections();
    }
  }, [profileAddress]);

  // Load data based on active tab
  useEffect(() => {
    if (profileAddress && profile) {
      switch (activeTab) {
        case 'activity':
          loadActivity();
          break;
        case 'favorites':
          loadFavorites();
          break;
        case 'notifications':
          if (isOwnProfile) loadNotifications();
          break;
        default:
          break;
      }
    }
  }, [activeTab, profileAddress]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await profileService.getProfile(profileAddress);
      
      if (result.success) {
        setProfile(result.data);
        setEditForm({
          display_name: result.data.display_name || '',
          username: result.data.username || '',
          bio: result.data.bio || '',
          email: result.data.email || '',
          website: result.data.website || '',
          twitter: result.data.twitter || '',
          discord: result.data.discord || '',
          instagram: result.data.instagram || '',
        });
        setSettings({
          email_notifications: result.data.email_notifications,
          show_wallet_balance: result.data.show_wallet_balance,
          profile_visibility: result.data.profile_visibility,
        });
        
        // Update last seen if viewing own profile
        if (isOwnProfile) {
          profileService.updateLastSeen(profileAddress);
        }
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadNFTs = async () => {
    try {
      setNftsLoading(true);
      const result = await nftsAPI.getByOwner(profileAddress);
      if (result.success) {
        setNfts(result.data);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setNftsLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      setCollectionsLoading(true);
      const result = await collectionsAPI.getByOwner(profileAddress);
      if (result.success) {
        setCollections(result.data);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      setActivityLoading(true);
      const result = await profileService.getUserActivity(profileAddress);
      if (result.success) {
        setActivity(result.data);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const result = await profileService.getFavorites(profileAddress);
      if (result.success) {
        setFavorites(result.data);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const result = await profileService.getNotifications(profileAddress);
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await profileService.updateProfile(profileAddress, editForm);
      
      if (result.success) {
        setProfile(result.data);
        setEditMode(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const result = await profileService.updateProfile(profileAddress, settings);
      
      if (result.success) {
        setProfile(result.data);
        setShowSettingsModal(false);
        toast.success('Settings updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      const result = await profileService.uploadAvatar(profileAddress, file);
      
      if (result.success) {
        setProfile({ ...profile, avatar_url: result.url });
        toast.success('Avatar updated!');
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
      setUploadingBanner(true);
      const result = await profileService.uploadBanner(profileAddress, file);
      
      if (result.success) {
        setProfile({ ...profile, banner_url: result.url });
        toast.success('Banner updated!');
      } else {
        toast.error(result.error || 'Failed to upload banner');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(profileAddress);
    toast.success('Address copied!');
  };

  const handleMarkAllNotificationsRead = async () => {
    const result = await profileService.markAllNotificationsRead(profileAddress);
    if (result.success) {
      loadNotifications();
      toast.success('All notifications marked as read');
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      mint: '🎨',
      purchase: '🛒',
      sale: '💰',
      list: '📝',
      delist: '❌',
      transfer: '📤',
      collection_created: '📁',
      offer_made: '💼',
      offer_received: '📨',
    };
    return icons[type] || '📌';
  };

  if (!isConnected && isOwnProfile) {
    return (
      <div className="profile">
        <div className="container">
          <EmptyState
            icon="👤"
            title="Connect Wallet to View Profile"
            description="Please connect your wallet to view and manage your profile."
            action={{
              label: 'Go to Home',
              onClick: () => navigate('/'),
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile">
        <div className="container">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile">
        <div className="container">
          <EmptyState
            icon="❌"
            title="Profile Not Found"
            description="This profile doesn't exist."
            action={{
              label: 'Go Back',
              onClick: () => navigate(-1),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      {/* Banner */}
      <div className="profile__banner">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="profile__banner-image" />
        ) : (
          <div className="profile__banner-placeholder" />
        )}
        
        {isOwnProfile && (
          <label className="profile__banner-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              disabled={uploadingBanner}
            />
            {uploadingBanner ? '⏳' : '📷'} Change Banner
          </label>
        )}
      </div>

      <div className="container">
        {/* Profile Header */}
        <div className="profile__header">
          <div className="profile__avatar-section">
            <div className="profile__avatar">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" />
              ) : (
                <div className="profile__avatar-placeholder">
                  {profile.display_name?.charAt(0) || '?'}
                </div>
              )}
              
              {isOwnProfile && (
                <label className="profile__avatar-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? '⏳' : '📷'}
                </label>
              )}
            </div>
          </div>

          <div className="profile__info">
            <div className="profile__name-section">
              {editMode ? (
                <input
                  type="text"
                  className="profile__name-input"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  placeholder="Display Name"
                />
              ) : (
                <>
                  <h1 className="profile__name">{profile.display_name || 'Anonymous User'}</h1>
                  {profile.username && (
                    <span className="profile__username">@{profile.username}</span>
                  )}
                </>
              )}
            </div>

            {editMode ? (
              <input
                type="text"
                className="profile__username-input"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Username (optional)"
              />
            ) : null}

            <div className="profile__address" onClick={handleCopyAddress}>
              <span className="profile__address-text">
                {profileAddress.slice(0, 12)}...{profileAddress.slice(-8)}
              </span>
              <span className="profile__address-copy">📋</span>
            </div>

            {editMode ? (
              <textarea
                className="profile__bio-input"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows="3"
              />
            ) : (
              profile.bio && <p className="profile__bio">{profile.bio}</p>
            )}

            {/* Social Links */}
            {editMode ? (
              <div className="profile__socials-edit">
                <input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="🌐 Website"
                />
                <input
                  type="text"
                  value={editForm.twitter}
                  onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                  placeholder="🐦 Twitter"
                />
                <input
                  type="text"
                  value={editForm.discord}
                  onChange={(e) => setEditForm({ ...editForm, discord: e.target.value })}
                  placeholder="💬 Discord"
                />
                <input
                  type="text"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="📧 Email"
                />
              </div>
            ) : (
              <div className="profile__socials">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    🌐 Website
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer">
                    🐦 Twitter
                  </a>
                )}
                {profile.discord && (
                  <span>💬 {profile.discord}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="profile__actions">
            {isOwnProfile ? (
              editMode ? (
                <>
                  <Button variant="primary" onClick={handleSaveProfile}>
                    💾 Save Profile
                  </Button>
                  <Button variant="secondary" onClick={() => setEditMode(false)}>
                    ❌ Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" onClick={() => setEditMode(true)}>
                    ✏️ Edit Profile
                  </Button>
                  <Button variant="secondary" onClick={() => setShowSettingsModal(true)}>
                    ⚙️ Settings
                  </Button>
                </>
              )
            ) : (
              <Button variant="primary">
                Follow
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="profile__stats">
          <div className="profile__stat">
            <span className="profile__stat-value">{nfts.length}</span>
            <span className="profile__stat-label">NFTs Owned</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value">{collections.length}</span>
            <span className="profile__stat-label">Collections</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value">{profile.total_sales || 0}</span>
            <span className="profile__stat-label">Sales</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value">
              {profile.total_volume ? `${profile.total_volume.toFixed(2)}` : '0'} COREUM
            </span>
            <span className="profile__stat-label">Total Volume</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile__tabs">
          <button
            className={`profile__tab ${activeTab === 'nfts' ? 'profile__tab--active' : ''}`}
            onClick={() => setActiveTab('nfts')}
          >
            🖼️ NFTs ({nfts.length})
          </button>
          <button
            className={`profile__tab ${activeTab === 'collections' ? 'profile__tab--active' : ''}`}
            onClick={() => setActiveTab('collections')}
          >
            📁 Collections ({collections.length})
          </button>
          <button
            className={`profile__tab ${activeTab === 'activity' ? 'profile__tab--active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📊 Activity
          </button>
          {isOwnProfile && (
            <>
              <button
                className={`profile__tab ${activeTab === 'favorites' ? 'profile__tab--active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                ⭐ Favorites
              </button>
              <button
                className={`profile__tab ${activeTab === 'notifications' ? 'profile__tab--active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                🔔 Notifications ({notifications.filter(n => !n.read).length})
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="profile__content">
          {/* NFTs Tab */}
          {activeTab === 'nfts' && (
            <div className="profile__nfts">
              {nftsLoading ? (
                <LoadingSpinner />
              ) : nfts.length > 0 ? (
                <div className="profile__nfts-grid">
                  {nfts.map((nft) => (
                    <NFTCard key={nft.id} nft={nft} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🖼️"
                  title="No NFTs Yet"
                  description={isOwnProfile ? "You don't own any NFTs yet." : "This user doesn't own any NFTs yet."}
                  action={isOwnProfile ? {
                    label: 'Browse Marketplace',
                    onClick: () => navigate('/'),
                  } : null}
                />
              )}
            </div>
          )}

          {/* Collections Tab */}
          {activeTab === 'collections' && (
            <div className="profile__collections">
              {collectionsLoading ? (
                <LoadingSpinner />
              ) : collections.length > 0 ? (
                <div className="profile__collections-grid">
                  {collections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📁"
                  title="No Collections"
                  description={isOwnProfile ? "You haven't created any collections yet." : "This user hasn't created any collections yet."}
                  action={isOwnProfile ? {
                    label: 'Create Collection',
                    onClick: () => navigate('/create-collection'),
                  } : null}
                />
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="profile__activity">
              {activityLoading ? (
                <LoadingSpinner />
              ) : activity.length > 0 ? (
                <div className="profile__activity-list">
                  {activity.map((item) => (
                    <div key={item.id} className="profile__activity-item">
                      <span className="profile__activity-icon">{getActivityIcon(item.activity_type)}</span>
                      <div className="profile__activity-details">
                        <span className="profile__activity-type">
                          {item.activity_type.replace('_', ' ')}
                        </span>
                        {item.nft_token_id && (
                          <span className="profile__activity-nft">
                            NFT: {item.nft_token_id.slice(0, 8)}...
                          </span>
                        )}
                        {item.amount && (
                          <span className="profile__activity-amount">
                            {item.amount} COREUM
                          </span>
                        )}
                      </div>
                      <span className="profile__activity-time">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📊"
                  title="No Activity"
                  description="No recent activity to display."
                />
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && isOwnProfile && (
            <div className="profile__favorites">
              {favorites.length > 0 ? (
                <div className="profile__favorites-grid">
                  {/* Render favorite NFTs */}
                  <EmptyState
                    icon="⭐"
                    title="Feature Coming Soon"
                    description="Favorites will be displayed here."
                  />
                </div>
              ) : (
                <EmptyState
                  icon="⭐"
                  title="No Favorites"
                  description="You haven't favorited any NFTs yet."
                />
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && isOwnProfile && (
            <div className="profile__notifications">
              {notifications.length > 0 ? (
                <>
                  <div className="profile__notifications-header">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={handleMarkAllNotificationsRead}
                    >
                      Mark All as Read
                    </Button>
                  </div>
                  <div className="profile__notifications-list">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`profile__notification ${!notif.read ? 'profile__notification--unread' : ''}`}
                        onClick={() => profileService.markNotificationRead(notif.id)}
                      >
                        <div className="profile__notification-content">
                          <h4 className="profile__notification-title">{notif.title}</h4>
                          <p className="profile__notification-message">{notif.message}</p>
                        </div>
                        <span className="profile__notification-time">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="🔔"
                  title="No Notifications"
                  description="You're all caught up!"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Profile Settings"
        className="profile__settings-modal"
      >
        <div className="profile__settings">
          <div className="profile__setting">
            <label>
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
              />
              <span>Email Notifications</span>
            </label>
          </div>

          <div className="profile__setting">
            <label>
              <input
                type="checkbox"
                checked={settings.show_wallet_balance}
                onChange={(e) => setSettings({ ...settings, show_wallet_balance: e.target.checked })}
              />
              <span>Show Wallet Balance</span>
            </label>
          </div>

          <div className="profile__setting">
            <label>Profile Visibility</label>
            <select
              value={settings.profile_visibility}
              onChange={(e) => setSettings({ ...settings, profile_visibility: e.target.value })}
              className="profile__setting-select"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="profile__settings-actions">
            <Button variant="primary" onClick={handleSaveSettings}>
              Save Settings
            </Button>
            <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;

