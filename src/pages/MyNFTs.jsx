// My NFTs Page
// File: src/pages/MyNFTs.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nftsAPI } from '../services/api';
import useWalletStore from '../store/walletStore';
import WalletModal from '../components/WalletModal';
import NFTCard from '../components/NFTCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import Button from '../components/shared/Button';
import toast, { Toaster } from 'react-hot-toast';
import './MyNFTs.scss';

const MyNFTs = () => {
  const navigate = useNavigate();
  const { isConnected, walletAddress } = useWalletStore();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, listed, unlisted

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadMyNFTs();
    } else {
      setLoading(false);
    }
  }, [isConnected, walletAddress, filter]);

  const loadMyNFTs = async () => {
    try {
      setLoading(true);
      const response = await nftsAPI.getByOwner(walletAddress);
      if (response.success) {
        let filtered = response.data;
        if (filter === 'listed') {
          filtered = filtered.filter(nft => nft.status === 'listed');
        } else if (filter === 'unlisted') {
          filtered = filtered.filter(nft => nft.status !== 'listed');
        }
        setNfts(filtered);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load your NFTs');
    } finally {
      setLoading(false);
    }
  };

  const handleNFTClick = (nft) => {
    navigate(`/nft/${nft.id}`);
  };

  if (!isConnected) {
    return (
      <>
        <div className="my-nfts">
          <div className="my-nfts__container">
            <EmptyState
              icon="🔐"
              title="Wallet Not Connected"
              description="Please connect your wallet to view your NFTs."
              actionText="Connect Wallet"
              onAction={() => setShowWalletModal(true)}
            />
          </div>
        </div>
        <WalletModal 
          isOpen={showWalletModal} 
          onClose={() => setShowWalletModal(false)} 
        />
      </>
    );
  }

  return (
    <div className="my-nfts">
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

      <div className="my-nfts__container">
        <div className="my-nfts__header">
          <div>
            <h1 className="my-nfts__title">My NFTs</h1>
            <p className="my-nfts__subtitle">
              Manage your collected and created NFTs
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/create')}>
            Create NFT
          </Button>
        </div>

        <div className="my-nfts__filters">
          <button 
            className={`my-nfts__filter-btn ${filter === 'all' ? 'my-nfts__filter-btn--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({nfts.length})
          </button>
          <button 
            className={`my-nfts__filter-btn ${filter === 'listed' ? 'my-nfts__filter-btn--active' : ''}`}
            onClick={() => setFilter('listed')}
          >
            Listed
          </button>
          <button 
            className={`my-nfts__filter-btn ${filter === 'unlisted' ? 'my-nfts__filter-btn--active' : ''}`}
            onClick={() => setFilter('unlisted')}
          >
            Unlisted
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading your NFTs..." />
        ) : nfts.length > 0 ? (
          <div className="my-nfts__grid">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onClick={() => handleNFTClick(nft)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🖼️"
            title="No NFTs Found"
            description={
              filter === 'all' 
                ? "You don't own any NFTs yet. Start by creating or purchasing one!"
                : filter === 'listed'
                ? "You don't have any NFTs listed for sale."
                : "All your NFTs are currently listed for sale."
            }
            actionText={filter === 'all' ? "Browse Marketplace" : "View All NFTs"}
            onAction={() => filter === 'all' ? navigate('/') : setFilter('all')}
          />
        )}
      </div>
    </div>
  );
};

export default MyNFTs;

