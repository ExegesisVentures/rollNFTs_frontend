/**
 * Launchpad Vetting Application Form
 * File: src/pages/LaunchpadVettingApplication.jsx
 * 
 * Form for creators to apply for the "Vetted" badge for their launchpad.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWalletStore from '../store/walletStore';
import { launchpadService } from '../services/launchpadService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import './LaunchpadVettingApplication.scss';

const LaunchpadVettingApplication = () => {
  const { id } = useParams(); // launchpad ID
  const navigate = useNavigate();
  const { address, signMessage } = useWalletStore();

  const [launchpad, setLaunchpad] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    teamInfo: '',
    websiteUrl: '',
    twitterUrl: '',
    discordUrl: '',
    telegramUrl: '',
    roadmap: '',
    utilityDescription: '',
    artSamples: [],
    teamBackground: '',
    kycCompleted: false,
    kycProvider: '',
    verificationDocuments: []
  });

  const [artSampleUrls, setArtSampleUrls] = useState('');
  const [docUrls, setDocUrls] = useState('');

  // Load launchpad and existing application
  useEffect(() => {
    if (!address) {
      navigate('/launchpads');
      return;
    }

    loadData();
  }, [address, id]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load launchpad
      const lpResult = await launchpadService.getLaunchpadById(id);
      if (!lpResult.success) {
        throw new Error(lpResult.error);
      }

      const lp = lpResult.launchpad;
      setLaunchpad(lp);

      // Check if user is creator
      if (lp.creator_address !== address) {
        throw new Error('Only the launchpad creator can apply for vetting');
      }

      // Check if already vetted
      if (lp.is_vetted) {
        setError('This launchpad is already vetted');
        return;
      }

      // Check for existing application
      const appResult = await launchpadService.getVettingApplication(id, address);
      if (appResult.success && appResult.application) {
        setExistingApplication(appResult.application);
        
        // Pre-fill form if there's a rejected or requires_changes application
        if (['rejected', 'requires_changes'].includes(appResult.application.status)) {
          setFormData({
            projectName: appResult.application.project_name || '',
            projectDescription: appResult.application.project_description || '',
            teamInfo: appResult.application.team_info || '',
            websiteUrl: appResult.application.website_url || '',
            twitterUrl: appResult.application.twitter_url || '',
            discordUrl: appResult.application.discord_url || '',
            telegramUrl: appResult.application.telegram_url || '',
            roadmap: appResult.application.roadmap || '',
            utilityDescription: appResult.application.utility_description || '',
            artSamples: appResult.application.art_samples || [],
            teamBackground: appResult.application.team_background || '',
            kycCompleted: appResult.application.kyc_completed || false,
            kycProvider: appResult.application.kyc_provider || '',
            verificationDocuments: appResult.application.verification_documents || []
          });
        }
      }

      // Pre-fill project name from launchpad
      if (!formData.projectName) {
        setFormData(prev => ({
          ...prev,
          projectName: lp.name
        }));
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    if (!formData.projectName.trim()) {
      setError('Project name is required');
      return false;
    }

    if (!formData.projectDescription.trim() || formData.projectDescription.length < 100) {
      setError('Project description must be at least 100 characters');
      return false;
    }

    if (!formData.teamInfo.trim()) {
      setError('Team information is required');
      return false;
    }

    if (!formData.websiteUrl && !formData.twitterUrl && !formData.discordUrl) {
      setError('At least one social link (website, Twitter, or Discord) is required');
      return false;
    }

    if (!formData.roadmap.trim()) {
      setError('Project roadmap is required');
      return false;
    }

    if (!formData.utilityDescription.trim()) {
      setError('NFT utility description is required');
      return false;
    }

    if (!formData.teamBackground.trim()) {
      setError('Team background is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Parse art sample URLs
      const artSamples = artSampleUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // Parse verification document URLs
      const verificationDocs = docUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // Generate signature proof
      const message = `I am applying for vetting for launchpad: ${launchpad.name} (${id})`;
      const signature = await signMessage(message);

      // Submit application
      const result = await launchpadService.submitVettingApplication({
        launchpadId: id,
        applicantAddress: address,
        projectName: formData.projectName.trim(),
        projectDescription: formData.projectDescription.trim(),
        teamInfo: formData.teamInfo.trim(),
        websiteUrl: formData.websiteUrl.trim() || null,
        twitterUrl: formData.twitterUrl.trim() || null,
        discordUrl: formData.discordUrl.trim() || null,
        telegramUrl: formData.telegramUrl.trim() || null,
        roadmap: formData.roadmap.trim(),
        utilityDescription: formData.utilityDescription.trim(),
        artSamples,
        teamBackground: formData.teamBackground.trim(),
        kycCompleted: formData.kycCompleted,
        kycProvider: formData.kycProvider.trim() || null,
        signatureProof: signature,
        verificationDocuments: verificationDocs
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/launchpads/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!address) {
    return (
      <div className="vetting-application-container">
        <div className="not-connected">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to apply for vetting.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="vetting-application-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !launchpad) {
    return (
      <div className="vetting-application-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/launchpads')}>
            Back to Launchpads
          </Button>
        </div>
      </div>
    );
  }

  // Show existing application status if pending or under review
  if (existingApplication && ['pending', 'under_review'].includes(existingApplication.status)) {
    return (
      <div className="vetting-application-container">
        <div className="application-status">
          <h1>Application Status</h1>
          <div className={`status-card status-${existingApplication.status}`}>
            <div className="status-icon">
              {existingApplication.status === 'pending' ? '⏳' : '👀'}
            </div>
            <h2>{existingApplication.status === 'pending' ? 'Pending Review' : 'Under Review'}</h2>
            <p>
              Your vetting application for <strong>{launchpad.name}</strong> has been submitted.
            </p>
            <div className="status-details">
              <div className="detail-item">
                <span>Submitted:</span>
                <span>{new Date(existingApplication.submitted_at).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span>Status:</span>
                <span className="status-badge">{existingApplication.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <p className="status-message">
              Our team is reviewing your application. You will be notified once a decision is made.
            </p>
            <Button onClick={() => navigate(`/launchpads/${id}`)}>
              Back to Launchpad
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vetting-application-container">
      {success ? (
        <div className="success-state">
          <div className="success-icon">✓</div>
          <h2>Application Submitted!</h2>
          <p>Your vetting application has been submitted successfully.</p>
          <p>Our team will review it and get back to you soon.</p>
        </div>
      ) : (
        <>
          <div className="application-header">
            <h1>Apply for Vetted Badge</h1>
            <p>Submit your application to receive the "Vetted" badge for {launchpad?.name}</p>
            {existingApplication?.status === 'requires_changes' && (
              <div className="warning-message">
                ⚠️ <strong>Changes Requested:</strong> {existingApplication.admin_notes}
              </div>
            )}
            {existingApplication?.status === 'rejected' && (
              <div className="error-message">
                ✗ <strong>Previous Application Rejected:</strong> {existingApplication.rejection_reason}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="vetting-form">
            {/* Project Information */}
            <section className="form-section">
              <h2>Project Information</h2>

              <div className="form-group">
                <label htmlFor="projectName">Project Name *</label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="projectDescription">Project Description * (min. 100 characters)</label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Describe your project, its vision, and what makes it unique..."
                  required
                />
                <small>{formData.projectDescription.length} / 100 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="utilityDescription">NFT Utility *</label>
                <textarea
                  id="utilityDescription"
                  name="utilityDescription"
                  value={formData.utilityDescription}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Explain the utility and benefits of your NFTs..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="roadmap">Project Roadmap *</label>
                <textarea
                  id="roadmap"
                  name="roadmap"
                  value={formData.roadmap}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Share your project's roadmap and future plans..."
                  required
                />
              </div>
            </section>

            {/* Team Information */}
            <section className="form-section">
              <h2>Team Information</h2>

              <div className="form-group">
                <label htmlFor="teamInfo">Team Overview *</label>
                <textarea
                  id="teamInfo"
                  name="teamInfo"
                  value={formData.teamInfo}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Introduce your team members and roles..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="teamBackground">Team Background *</label>
                <textarea
                  id="teamBackground"
                  name="teamBackground"
                  value={formData.teamBackground}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Share your team's experience and credentials..."
                  required
                />
              </div>
            </section>

            {/* Social Links */}
            <section className="form-section">
              <h2>Social Presence</h2>
              <p className="section-note">At least one social link is required</p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="websiteUrl">Website</label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="twitterUrl">Twitter</label>
                  <input
                    type="url"
                    id="twitterUrl"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="discordUrl">Discord</label>
                  <input
                    type="url"
                    id="discordUrl"
                    name="discordUrl"
                    value={formData.discordUrl}
                    onChange={handleChange}
                    placeholder="https://discord.gg/..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telegramUrl">Telegram</label>
                  <input
                    type="url"
                    id="telegramUrl"
                    name="telegramUrl"
                    value={formData.telegramUrl}
                    onChange={handleChange}
                    placeholder="https://t.me/..."
                  />
                </div>
              </div>
            </section>

            {/* Art Samples */}
            <section className="form-section">
              <h2>Art Samples</h2>

              <div className="form-group">
                <label htmlFor="artSamples">Art Sample URLs</label>
                <textarea
                  id="artSamples"
                  value={artSampleUrls}
                  onChange={(e) => setArtSampleUrls(e.target.value)}
                  rows={4}
                  placeholder="Enter image URLs (one per line)..."
                />
                <small>Provide URLs to showcase your NFT artwork</small>
              </div>
            </section>

            {/* KYC/Verification */}
            <section className="form-section">
              <h2>KYC & Verification</h2>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="kycCompleted"
                    checked={formData.kycCompleted}
                    onChange={handleChange}
                  />
                  <span>KYC Completed</span>
                </label>
              </div>

              {formData.kycCompleted && (
                <div className="form-group">
                  <label htmlFor="kycProvider">KYC Provider</label>
                  <input
                    type="text"
                    id="kycProvider"
                    name="kycProvider"
                    value={formData.kycProvider}
                    onChange={handleChange}
                    placeholder="e.g., Civic, Synaps, Fractal"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="verificationDocs">Verification Document URLs</label>
                <textarea
                  id="verificationDocs"
                  value={docUrls}
                  onChange={(e) => setDocUrls(e.target.value)}
                  rows={3}
                  placeholder="Enter document URLs (one per line)..."
                />
                <small>Optional: Links to any verification documents or credentials</small>
              </div>
            </section>

            {/* Error Display */}
            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {/* Submit Actions */}
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/launchpads/${id}`)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>

            <div className="form-note">
              <p><strong>Note:</strong> Your application will be reviewed by our team. This process may take 2-5 business days.</p>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default LaunchpadVettingApplication;

