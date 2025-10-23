// Main App Component
// File: src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import NFTDetail from './pages/NFTDetail';
import MyNFTs from './pages/MyNFTs';
import CreateNFT from './pages/CreateNFT';
import CreateCollection from './pages/CreateCollection';
import BulkMint from './pages/BulkMint';
import BulkTransfer from './pages/BulkTransfer';
import AdminVerification from './pages/AdminVerification';
import ErrorBoundary from './components/shared/ErrorBoundary';
import './App.scss';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app">
          <div className="app__content">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collection/:id" element={<CollectionDetail />} />
              <Route path="/nft/:id" element={<NFTDetail />} />
              <Route path="/create" element={<CreateNFT />} />
              <Route path="/create-collection" element={<CreateCollection />} />
              <Route path="/bulk-mint" element={<BulkMint />} />
              <Route path="/bulk-transfer" element={<BulkTransfer />} />
              <Route path="/admin/verification" element={<AdminVerification />} />
              <Route path="/my-nfts" element={<MyNFTs />} />
              <Route path="*" element={
                <div className="container" style={{paddingTop: '4rem', textAlign: 'center'}}>
                  <h1>404 - Page Not Found</h1>
                  <p style={{marginTop: '1rem'}}>The page you're looking for doesn't exist.</p>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
