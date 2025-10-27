// Enhanced Header Component with Wallet Integration
// File: src/components/Header.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useWalletStore from '../store/walletStore';
import WalletModal from './WalletModal';
import { getWalletName } from '../services/walletService';
import { adminLaunchpadService } from '../services/adminLaunchpadService';
import toast, { Toaster } from 'react-hot-toast';
import './Header.scss';

const Header = () => {
  const navigate = useNavigate();
  const { isConnected, walletAddress, walletType, balance, disconnect, autoReconnect } = useWalletStore();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);

  // Auto-reconnect on mount
  useEffect(() => {
    autoReconnect();
  }, [autoReconnect]);

  // Check admin status when wallet connects
  useEffect(() => {
    if (walletAddress) {
      setIsAdmin(adminLaunchpadService.isAdmin(walletAddress));
    } else {
      setIsAdmin(false);
    }
  }, [walletAddress]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleConnect = () => {
    setShowWalletModal(true);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
    toast.success('Wallet disconnected');
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard!');
      setShowDropdown(false);
    }
  };

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#101216',
            color: '#fff',
            border: '1px solid #1b1d23',
          },
        }}
      />

      <header className="header">
        <nav className="header__nav">
          {/* Logo */}
          <Link to="/" className="header__logo">
            <div className="header__logo-icon">
              <span>R</span>
            </div>
            <span className="header__logo-text">ROLL NFTs</span>
          </Link>

          {/* Navigation */}
          <div className="header__links">
            <Link to="/">Marketplace</Link>
            <Link to="/collections">Collections</Link>
            <Link to="/launchpads">Launchpad</Link>
            <Link to="/free-spins">Free Spins</Link>
            <Link to="/create">Create</Link>
            <Link to="/my-nfts">My NFTs</Link>
          </div>

          {/* Wallet Connect */}
          <div className="header__wallet" ref={dropdownRef}>
            {isConnected ? (
              <div className="header__wallet-connected">
                <div className="header__wallet-balance">
                  {balance} COREUM
                </div>
                <button
                  className="header__wallet-address-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span className="header__wallet-type">
                    {getWalletName(walletType)}
                  </span>
                  <span className="header__wallet-address">
                    {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                  </span>
                  <span className="header__wallet-chevron">▼</span>
                </button>

                {showDropdown && (
                  <div className="header__wallet-dropdown">
                    <button
                      type="button"
                      className="header__wallet-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/profile');
                      }}
                    >
                      <span className="header__wallet-dropdown-icon">👤</span>
                      My Profile
                    </button>
                    <button
                      type="button"
                      className="header__wallet-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/my-nfts');
                      }}
                    >
                      <span className="header__wallet-dropdown-icon">🖼️</span>
                      My NFTs
                    </button>
                    <button
                      type="button"
                      className="header__wallet-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/free-spins');
                      }}
                    >
                      <span className="header__wallet-dropdown-icon">🎡</span>
                      Free Spins
                    </button>
                    <button
                      type="button"
                      className="header__wallet-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/free-spins/create');
                      }}
                    >
                      <span className="header__wallet-dropdown-icon">➕</span>
                      Create Spin Campaign
                    </button>
                    {isAdmin && (
                      <>
                        <div className="header__wallet-dropdown-divider"></div>
                        <button
                          type="button"
                          className="header__wallet-dropdown-item header__wallet-dropdown-item--admin"
                          onClick={() => {
                            setShowDropdown(false);
                            navigate('/admin/spin-campaigns');
                          }}
                        >
                          <span className="header__wallet-dropdown-icon">⚙️</span>
                          Admin: Spin Campaigns
                        </button>
                        <button
                          type="button"
                          className="header__wallet-dropdown-item header__wallet-dropdown-item--admin"
                          onClick={() => {
                            setShowDropdown(false);
                            navigate('/admin/launchpads');
                          }}
                        >
                          <span className="header__wallet-dropdown-icon">🚀</span>
                          Admin: Launchpads
                        </button>
                        <button
                          type="button"
                          className="header__wallet-dropdown-item header__wallet-dropdown-item--admin"
                          onClick={() => {
                            setShowDropdown(false);
                            navigate('/admin/verification');
                          }}
                        >
                          <span className="header__wallet-dropdown-icon">🛡️</span>
                          Admin: Verification
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="header__wallet-dropdown-item"
                      onClick={() => {
                        copyAddress();
                      }}
                    >
                      <span className="header__wallet-dropdown-icon">📋</span>
                      Copy Address
                    </button>
                    <button
                      type="button"
                      className="header__wallet-dropdown-item header__wallet-dropdown-item--danger"
                      onClick={() => {
                        handleDisconnect();
                      }}
                    >
                      <span className="header__wallet-dropdown-icon">🔌</span>
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="header__wallet-btn header__wallet-btn--connect"
              >
                <span className="header__wallet-btn-icon">💼</span>
                Connect Wallet
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Wallet Connection Modal */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </>
  );
};

export default Header;

