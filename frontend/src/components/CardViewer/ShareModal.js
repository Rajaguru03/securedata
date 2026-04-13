import React, { useState, useEffect, useCallback } from 'react';
import { useCards } from '../../context/CardContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import TerminalCard from '../Common/TerminalCard';
import { cardAPI } from '../../services/api';
import { HiX, HiClipboardCopy, HiCheck, HiTrash, HiChartBar, HiLink, HiLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ShareModal = ({ cardId, cardTitle, existingShareToken, existingShareExpiry, onClose }) => {
  const { generateShareLink, revokeShareLink } = useCards();
  const [tab, setTab] = useState('link'); // 'link' | 'stats'
  const [shareData, setShareData] = useState(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [expiryPreset, setExpiryPreset] = useState('7');
  const [customDays, setCustomDays] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const hasActiveLink = !revoked && existingShareToken &&
    (!existingShareExpiry || new Date(existingShareExpiry) > new Date());

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await cardAPI.getShareStats(cardId);
      setStats(res.data.data);
    } catch {
      toast.error('failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    if (tab === 'stats') fetchStats();
  }, [tab, fetchStats]);

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

          {/* Tab bar */}
          <div className="flex space-x-1 mb-5 border-b border-term-border pb-2">
            <button
              onClick={() => setTab('link')}
              className={`flex items-center space-x-1 px-3 py-1 font-mono text-xs transition-colors ${
                tab === 'link'
                  ? 'text-primary border-b-2 border-primary -mb-2'
                  : 'text-term-muted hover:text-term-default'
              }`}
            >
              <HiLink className="w-3 h-3" />
              <span>link</span>
            </button>
            <button
              onClick={() => setTab('stats')}
              className={`flex items-center space-x-1 px-3 py-1 font-mono text-xs transition-colors ${
                tab === 'stats'
                  ? 'text-primary border-b-2 border-primary -mb-2'
                  : 'text-term-muted hover:text-term-default'
              }`}
            >
              <HiChartBar className="w-3 h-3" />
              <span>stats</span>
            </button>
          </div>

          {/* ── LINK TAB ── */}
          {tab === 'link' && (
            <>
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
                      {/* <option value="14">14 days</option> */}
                      {/* <option value="30">30 days</option> */}
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
            </>
          )}

          {/* ── STATS TAB ── */}
          {tab === 'stats' && (
            <div className="space-y-4">
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner text="loading stats..." />
                </div>
              ) : stats ? (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="p-3 bg-term-surface border border-term-border font-mono text-center"
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="text-2xl text-primary font-bold">{stats.totalViews}</div>
                      <div className="text-xs text-term-muted mt-1">total views</div>
                    </div>
                    <div
                      className="p-3 bg-term-surface border border-term-border font-mono text-center"
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="text-2xl text-primary font-bold">{stats.uniqueVisitors}</div>
                      <div className="text-xs text-term-muted mt-1">unique visitors</div>
                    </div>
                  </div>

                  {/* Device breakdown */}
                  {stats.deviceBreakdown && stats.deviceBreakdown.length > 0 && (
                    <div>
                      <div className="text-xs font-mono text-term-muted mb-2">device breakdown</div>
                      <div className="space-y-1">
                        {stats.deviceBreakdown.map(({ device, count }) => {
                          const pct = stats.totalViews > 0 ? Math.round((count / stats.totalViews) * 100) : 0;
                          return (
                            <div key={device} className="flex items-center space-x-2 font-mono text-xs">
                              <span className="text-term-muted w-16">{device}</span>
                              <div className="flex-1 bg-term-surface border border-term-border h-3" style={{ borderRadius: '2px' }}>
                                <div
                                  className="h-full bg-primary-dim"
                                  style={{ width: `${pct}%`, borderRadius: '2px' }}
                                />
                              </div>
                              <span className="text-term-subtle w-12 text-right">{count} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Views by day (last 7) */}
                  {stats.viewsByDay && stats.viewsByDay.length > 0 && (
                    <div>
                      <div className="text-xs font-mono text-term-muted mb-2">views by day (last 30 days)</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {stats.viewsByDay.slice(-7).map((d) => (
                          <div key={d.date} className="flex items-center justify-between font-mono text-xs">
                            <span className="text-term-muted">{d.date}</span>
                            <span className="text-term-subtle">{d.count} view{d.count !== 1 ? 's' : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent views */}
                  {stats.recentViews && stats.recentViews.length > 0 && (
                    <div>
                      <div className="text-xs font-mono text-term-muted mb-2">recent visits</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {stats.recentViews.map((v, i) => (
                          <div key={i} className="flex items-center justify-between font-mono text-xs">
                            <span className="text-term-subtle">
                              {v.browser || 'unknown'}
                              <span className="text-term-muted ml-1">· {v.deviceType || 'unknown'}</span>
                            </span>
                            <span className="text-term-muted">
                              {new Date(v.viewedAt).toLocaleString('en-US', {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.totalViews === 0 && (
                    <div className="text-center py-6 font-mono text-xs text-term-muted">
                      no views yet — share the link to start tracking
                    </div>
                  )}

                  <button
                    onClick={fetchStats}
                    className="w-full btn-secondary text-xs"
                  >
                    ↻ refresh
                  </button>
                </>
              ) : (
                <div className="text-center py-6 font-mono text-xs text-term-muted">
                  no stats available
                </div>
              )}
            </div>
          )}
        </TerminalCard>
      </div>
    </div>
  );
};

export default ShareModal;
