// Wallet Connection Modal
// File: src/components/WalletModal.jsx

import React, { useState, useEffect } from 'react';
import Modal from './shared/Modal';
import Button from './shared/Button';
import walletService, { WALLET_TYPES, getWalletIcon, getWalletName } from '../services/walletService';
import useWalletStore from '../store/walletStore';
import toast from 'react-hot-toast';
import './WalletModal.scss';

const WalletModal = ({ isOpen, onClose }) => {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const { connect, isConnecting, error, clearError } = useWalletStore();

  useEffect(() => {
    if (isOpen) {
      // Get available wallets when modal opens
      const wallets = walletService.getAvailableWallets();
      setAvailableWallets(wallets);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleWalletSelect = async (walletType) => {
    setSelectedWallet(walletType);
    
    try {
      const result = await connect(walletType);
      
      if (result.success) {
        toast.success(`Connected to ${getWalletName(walletType)}!`);
        onClose();
      } else {
        toast.error(result.error || 'Failed to connect wallet');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to connect wallet');
    } finally {
      setSelectedWallet(null);
    }
  };

  const getInstallLink = (walletType) => {
    switch (walletType) {
      case WALLET_TYPES.KEPLR:
        return 'https://www.keplr.app/download';
      case WALLET_TYPES.LEAP:
        return 'https://www.leapwallet.io/download';
      case WALLET_TYPES.COSMOSTATION:
        return 'https://www.cosmostation.io/wallet';
      default:
        return '#';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Wallet"
      className="wallet-modal"
    >
      <div className="wallet-modal__content">
        {availableWallets.length > 0 ? (
          <>
            <p className="wallet-modal__description">
              Choose a wallet to connect to ROLL NFTs Marketplace
            </p>

            <div className="wallet-modal__wallet-list">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.type}
                  className={`wallet-modal__wallet-button ${
                    selectedWallet === wallet.type ? 'wallet-modal__wallet-button--loading' : ''
                  }`}
                  onClick={() => handleWalletSelect(wallet.type)}
                  disabled={isConnecting}
                >
                  <div className="wallet-modal__wallet-icon">{wallet.icon}</div>
                  <div className="wallet-modal__wallet-info">
                    <span className="wallet-modal__wallet-name">{wallet.name}</span>
                    {selectedWallet === wallet.type && (
                      <span className="wallet-modal__wallet-status">Connecting...</span>
                    )}
                  </div>
                  <div className="wallet-modal__wallet-arrow">→</div>
                </button>
              ))}
            </div>

            {error && (
              <div className="wallet-modal__error">
                <span className="wallet-modal__error-icon">⚠️</span>
                <span className="wallet-modal__error-text">{error}</span>
              </div>
            )}

            <div className="wallet-modal__info">
              <p className="wallet-modal__info-title">New to Cosmos wallets?</p>
              <p className="wallet-modal__info-text">
                Wallets are used to send, receive, and store digital assets. Choose one to get started.
              </p>
            </div>
          </>
        ) : (
          <div className="wallet-modal__no-wallets">
            <div className="wallet-modal__no-wallets-icon">💼</div>
            <h3 className="wallet-modal__no-wallets-title">No Wallets Detected</h3>
            <p className="wallet-modal__no-wallets-text">
              To connect, please install one of the following wallet extensions:
            </p>

            <div className="wallet-modal__install-list">
              {Object.values(WALLET_TYPES).map((type) => (
                <a
                  key={type}
                  href={getInstallLink(type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-modal__install-button"
                >
                  <span className="wallet-modal__install-icon">{getWalletIcon(type)}</span>
                  <span className="wallet-modal__install-name">Install {getWalletName(type)}</span>
                  <span className="wallet-modal__install-arrow">↗</span>
                </a>
              ))}
            </div>

            <p className="wallet-modal__install-hint">
              After installation, refresh this page to connect.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WalletModal;



