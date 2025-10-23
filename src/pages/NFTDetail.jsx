// NFT Detail Page
// File: src/pages/NFTDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { nftsAPI } from '../services/api';
import { ipfsToHttp } from '../utils/ipfs';
import toast, { Toaster } from 'react-hot-toast';
import useWalletStore from '../store/walletStore';
import WalletModal from '../components/WalletModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import './NFTDetail.scss';

const NFTDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, walletAddress } = useWalletStore();
  
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    loadNFT();
  }, [id]);

  const loadNFT = async () => {
    try {
      setLoading(true);
      const response = await nftsAPI.getById(id);
      if (response.success) {
        setNft(response.data);
      } else {
        toast.error('NFT not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading NFT:', error);
      toast.error('Failed to load NFT');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleBuyClick = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      setShowWalletModal(true);
      return;
    }
    setShowBuyModal(true);
  };

  const handleConfirmPurchase = async () => {
    try {
      setBuying(true);
      
      // TODO: Implement actual blockchain purchase
      // For now, simulate the purchase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await nftsAPI.purchase(id, {
        buyer: walletAddress,
        price: nft.price
      });
      
      if (response.success) {
        toast.success('NFT purchased successfully!');
        setShowBuyModal(false);
        navigate('/my-nfts');
      } else {
        toast.error(response.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="nft-detail">
        <div className="nft-detail__container">
          <LoadingSpinner text="Loading NFT..." />
        </div>
      </div>
    );
  }

  if (!nft) {
    return null;
  }

  const imageUrl = ipfsToHttp(nft.metadata?.image || nft.image);
  const isOwner = isConnected && nft.owner?.toLowerCase() === walletAddress?.toLowerCase();
  const isListed = nft.status === 'listed';

  return (
    <div className="nft-detail">
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

      <div className="nft-detail__container">
        <div className="nft-detail__grid">
          {/* Image Section */}
          <div className="nft-detail__image-section">
            <div className="nft-detail__image-container">
              <img 
                src={imageUrl} 
                alt={nft.metadata?.name || nft.name}
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x600?text=NFT';
                }}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="nft-detail__info-section">
            {nft.collection_name && (
              <Link 
                to={`/collection/${nft.collection_id}`} 
                className="nft-detail__collection"
              >
                {nft.collection_name}
              </Link>
            )}

            <h1 className="nft-detail__title">
              {nft.metadata?.name || nft.name || 'Unnamed NFT'}
            </h1>

            <div className="nft-detail__owner">
              <span className="nft-detail__owner-label">Owned by</span>
              <span className="nft-detail__owner-address">
                {isOwner ? 'You' : `${nft.owner?.slice(0, 8)}...${nft.owner?.slice(-6)}`}
              </span>
              <span className={`nft-detail__status-badge nft-detail__status-badge--${isListed ? 'listed' : 'sold'}`}>
                {isListed ? 'Listed' : 'Not Listed'}
              </span>
            </div>

            {/* Price Section */}
            {isListed && nft.price && (
              <div className="nft-detail__price-section">
                <p className="nft-detail__price-section-label">Current Price</p>
                <p className="nft-detail__price-section-value">
                  {nft.price} {nft.currency || 'XRP'}
                </p>
              </div>
            )}

            {/* Actions */}
            {isListed && !isOwner && (
              <div className="nft-detail__actions">
                <Button 
                  variant="primary" 
                  size="lg"
                  fullWidth
                  onClick={handleBuyClick}
                >
                  Buy Now
                </Button>
              </div>
            )}

            {isOwner && (
              <div className="nft-detail__actions">
                <Button 
                  variant="success" 
                  onClick={() => navigate(`/list/${id}`)}
                >
                  {isListed ? 'Update Listing' : 'List for Sale'}
                </Button>
                {isListed && (
                  <Button 
                    variant="danger" 
                    onClick={() => {/* TODO: Delist */}}
                  >
                    Delist
                  </Button>
                )}
              </div>
            )}

            {/* Description */}
            {nft.metadata?.description && (
              <div className="nft-detail__description">
                <h3 className="nft-detail__description-title">Description</h3>
                <p className="nft-detail__description-text">
                  {nft.metadata.description}
                </p>
              </div>
            )}

            {/* Properties */}
            {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
              <div className="nft-detail__properties">
                <h3 className="nft-detail__properties-title">Properties</h3>
                <div className="nft-detail__properties-grid">
                  {nft.metadata.attributes.map((attr, index) => (
                    <div key={index} className="nft-detail__properties-item">
                      <p className="nft-detail__properties-item-label">
                        {attr.trait_type}
                      </p>
                      <p className="nft-detail__properties-item-value">
                        {attr.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="nft-detail__details">
              <h3 className="nft-detail__details-title">Details</h3>
              <div className="nft-detail__details-item">
                <span className="nft-detail__details-item-label">Contract Address</span>
                <span className="nft-detail__details-item-value">
                  {nft.contract_address?.slice(0, 10)}...{nft.contract_address?.slice(-8)}
                </span>
              </div>
              <div className="nft-detail__details-item">
                <span className="nft-detail__details-item-label">Token ID</span>
                <span className="nft-detail__details-item-value">{nft.token_id || nft.id}</span>
              </div>
              <div className="nft-detail__details-item">
                <span className="nft-detail__details-item-label">Blockchain</span>
                <span className="nft-detail__details-item-value">{nft.chain || 'Coreum'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title="Confirm Purchase"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowBuyModal(false)} disabled={buying}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleConfirmPurchase} loading={buying}>
              Confirm Purchase
            </Button>
          </>
        }
      >
        <div>
          <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>
            You are about to purchase:
          </p>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            {nft.metadata?.name || nft.name}
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4d9cff' }}>
            {nft.price} {nft.currency || 'XRP'}
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            This transaction cannot be reversed. Please confirm you want to proceed.
          </p>
        </div>
      </Modal>

      {/* Wallet Connection Modal */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </div>
  );
};

export default NFTDetail;

