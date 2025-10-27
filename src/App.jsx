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
import Profile from './pages/Profile';
// Launchpad imports
import Launchpads from './pages/Launchpads';
import CreateLaunchpad from './pages/CreateLaunchpad';
import LaunchpadDetail from './pages/LaunchpadDetail';
import ManageLaunchpad from './pages/ManageLaunchpad';
import LaunchpadVettingApplication from './pages/LaunchpadVettingApplication';
import AdminLaunchpadDashboard from './pages/AdminLaunchpadDashboard';
// Free Spin imports
import FreeSpins from './pages/FreeSpins';
import FreeSpinDetail from './pages/FreeSpinDetail';
import AdminSpinCampaign from './pages/AdminSpinCampaign';
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
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:address" element={<Profile />} />
              
              {/* Launchpad Routes */}
              <Route path="/launchpads" element={<Launchpads />} />
              <Route path="/launchpads/create" element={<CreateLaunchpad />} />
              <Route path="/launchpads/:id" element={<LaunchpadDetail />} />
              <Route path="/launchpads/:id/manage" element={<ManageLaunchpad />} />
              <Route path="/launchpads/:id/apply-vetting" element={<LaunchpadVettingApplication />} />
              <Route path="/admin/launchpads" element={<AdminLaunchpadDashboard />} />
              
              {/* Free Spin Routes */}
              <Route path="/free-spins" element={<FreeSpins />} />
              <Route path="/free-spins/:campaignId" element={<FreeSpinDetail />} />
              <Route path="/free-spins/create" element={<AdminSpinCampaign />} />
              <Route path="/admin/spin-campaigns" element={<AdminSpinCampaign />} />
              
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
