import React, { useState } from 'react';
import { useCards } from '../../context/CardContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import TerminalCard from '../Common/TerminalCard';
import { HiX, HiClipboardCopy, HiCheck, HiTrash, HiLockClosed } from 'react-icons/hi';

import toast from 'react-hot-toast';

const ShareModal = ({ cardId, cardTitle, existingShareToken, existingShareExpiry, onClose }) => {
  const { generateShareLink, revokeShareLink } = useCards();
  const [shareData, setShareData] = useState(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [expiryPreset, setExpiryPreset] = useState('7');
  const [customDays, setCustomDays] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasActiveLink = !revoked && existingShareToken &&
    (!existingShareExpiry || new Date(existingShareExpiry) > new Date());

  const handleGenerateLink = async () => {
    setSubmitting(true);
    const result = await generateShareLink(cardId, expiryDays, sharePassword.trim() || null);
    setSubmitting(false);
    if (result.success) {
      setShareData(result.data);
      toast.success('share link generated!');
    } else {
      toast.error(result.error);
    }
  };

  const handleCopyLink = () => {
    if (shareData?.shareUrl) {
      navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      toast.success('link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeLink = async () => {
    if (!window.confirm('Revoke the share link? Anyone with the link will lose access immediately.')) return;
    setSubmitting(true);
    const result = await revokeShareLink(cardId);
    setSubmitting(false);
    if (result.success) {
      setRevoked(true);
      setShareData(null);
      toast.success('share link revoked');
    } else {
      toast.error(result.error);
    }
  };

  const formatExpiry = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="term-modal-backdrop" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4 relative z-50">
        <TerminalCard title="share link" className="w-full max-w-md">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-term-muted hover:text-term-default transition-colors"
          >
            <HiX className="w-4 h-4" />
          </button>

              <p className="text-term-muted font-mono text-xs mb-5">
                generate a shareable link for{' '}
                <span className="text-term-default">"{cardTitle}"</span>.
                encrypted fields will be hidden.
              </p>

              {!shareData && hasActiveLink ? (
                <div className="space-y-4">
                  <div
                    className="p-3 bg-warn-muted border border-warn font-mono text-xs text-warn"
                    style={{ borderRadius: '2px' }}
                  >
                    ! active share link exists for this card
                  </div>
                  <div className="text-xs font-mono text-term-muted">
                    expires: {existingShareExpiry ? formatExpiry(existingShareExpiry) : 'never'}
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setRevoked(true)} className="flex-1 btn-secondary text-xs">
                      generate new link
                    </button>
                    <button
                      onClick={handleRevokeLink}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-danger text-danger hover:bg-danger-muted font-mono text-xs transition-colors"
                      style={{ borderRadius: '2px' }}
                    >
                      {submitting ? <LoadingSpinner size="sm" /> : (
                        <>
                          <HiTrash className="w-4 h-4" />
                          <span>revoke link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : !shareData ? (
                <>
                  <div className="mb-4">
                    <label className="label">expires: link expires in</label>
                    <select
                      value={expiryPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExpiryPreset(val);
                        if (val !== 'custom') {
                          setExpiryDays(Number(val));
                          setCustomDays('');
                        }
                      }}
                      className="input"
                    >
                      <option value="0">No Limit</option>
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="custom">Custom</option>
                    </select>
                    {expiryPreset === 'custom' && (
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type="number"
                          min={1}
                          max={3650}
                          value={customDays}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomDays(v);
                            const n = parseInt(v, 10);
                            if (n >= 1) setExpiryDays(n);
                          }}
                          className="input text-xs w-24"
                          placeholder="days"
                        />
                        <span className="text-xs font-mono text-term-muted">days</span>
                        {customDays && parseInt(customDays, 10) >= 1 && (
                          <span className="text-xs font-mono text-term-subtle">
                            → expires {parseInt(customDays, 10) === 1 ? 'tomorrow' : `in ${customDays} days`}
                          </span>
                        )}
                      </div>
                    )}
                    {expiryPreset === 'custom' && customDays && parseInt(customDays, 10) < 1 && (
                      <p className="mt-1 text-xs font-mono text-danger">minimum 1 day</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="label">
                      <span className="flex items-center space-x-1">
                        <HiLockClosed className="w-3 h-3" />
                        <span>password protect <span className="text-term-muted">(optional)</span></span>
                      </span>
                    </label>
                    <input
                      type="password"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      className="input text-xs"
                      placeholder="leave blank for no password"
                      maxLength={50}
                    />
                    {sharePassword && sharePassword.length < 4 && (
                      <p className="mt-1 text-xs font-mono text-danger">minimum 4 characters</p>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateLink}
                    disabled={submitting || (sharePassword.length > 0 && sharePassword.length < 4) || (expiryPreset === 'custom' && !(parseInt(customDays, 10) >= 1))}
                    className="w-full btn-primary flex items-center justify-center space-x-2 text-sm"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" text="generating..." />
                    ) : (
                      '→ generate share link'
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div
                    className="p-3 bg-primary-muted border border-primary-dim font-mono text-xs text-primary"
                    style={{ borderRadius: '2px' }}
                  >
                    + share link created successfully
                    {shareData?.passwordProtected && (
                      <span className="ml-2 inline-flex items-center space-x-1 text-warn">
                        <HiLockClosed className="w-3 h-3" />
                        <span>password protected</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="label">share url</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={shareData.shareUrl}
                        className="input flex-1 text-xs"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-3 py-2 border text-xs font-mono transition-colors ${
                          copied
                            ? 'bg-primary-dim border-primary text-term-bright'
                            : 'bg-term-base border-term-border text-term-subtle hover:border-term-subtle'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        {copied ? <HiCheck className="w-4 h-4" /> : <HiClipboardCopy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-term-muted">
                    expires: {shareData.shareExpiry ? formatExpiry(shareData.shareExpiry) : 'never'}
                  </div>
                  <div
                    className="p-3 bg-warn-muted border border-warn font-mono text-xs text-warn"
                    style={{ borderRadius: '2px' }}
                  >
                    note: encrypted fields will be hidden when viewed through the share link.
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRevokeLink}
                      disabled={submitting}
                      className="flex items-center justify-center space-x-1 px-3 py-2 border border-danger text-danger hover:bg-danger-muted font-mono text-xs transition-colors"
                      style={{ borderRadius: '2px' }}
                    >
                      <HiTrash className="w-4 h-4" />
                      <span>revoke</span>
                    </button>
                    <button onClick={() => setShareData(null)} className="flex-1 btn-secondary text-xs">
                      new link
                    </button>
                    <button onClick={onClose} className="flex-1 btn-primary text-xs">
                      done
                    </button>
                  </div>
                </div>
              )}
        </TerminalCard>
      </div>
    </div>
  );
};

export default ShareModal;
