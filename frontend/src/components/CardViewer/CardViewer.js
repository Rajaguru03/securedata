import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCards } from '../../context/CardContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import TerminalCard from '../Common/TerminalCard';
import ShareModal from './ShareModal';
import { cardAPI } from '../../services/api';
import {
  HiArrowLeft,
  HiPencil,
  HiShare,
  HiDownload,
  HiLockClosed,
  HiX,
  HiEye,
  HiEyeOff,
  HiClock,
  HiClipboardList,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const Divider = ({ label }) => (
  <div className="flex items-center gap-2 my-4">
    <span className="text-term-border font-mono text-xs">──</span>
    <span className="text-term-muted font-mono text-xs">{label}</span>
    <span className="flex-1 overflow-hidden text-term-border font-mono text-xs">{'─'.repeat(80)}</span>
  </div>
);

const CardViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCard, currentCard, loading, error } = useCards();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [revealedFields, setRevealedFields] = useState({});
  const [exportPassword, setExportPassword] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [protectWithPassword, setProtectWithPassword] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionLoading, setVersionLoading] = useState(false);
  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelections, setCompareSelections] = useState([]);  // max 2 version numbers
  const [compareVersions, setCompareVersions] = useState(null);   // { v1, v2 } full version objects
  const [compareLoading, setCompareLoading] = useState(false);
  // Access log state
  const [showAccessLog, setShowAccessLog] = useState(false);
  const [accessLog, setAccessLog] = useState(null);
  const [accessLogLoading, setAccessLogLoading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchCard(id);
    }
  }, [id, fetchCard]);

  const handleExportPDF = async (e) => {
    e.preventDefault();
    if (protectWithPassword && exportPassword.length < 4) return;
    setExportLoading(true);
    try {
      const password = protectWithPassword ? exportPassword : null;
      const response = await cardAPI.exportPDF(currentCard._id, password);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentCard.title.replace(/[^a-z0-9]/gi, '_')}_datacard.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(protectWithPassword ? 'PDF exported — open with your password' : 'PDF exported successfully');
      setShowExportModal(false);
      setExportPassword('');
      setProtectWithPassword(false);
    } catch (err) {
      toast.error('failed to export PDF');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const response = await cardAPI.exportMarkdown(currentCard._id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/markdown' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentCard.title.replace(/[^a-z0-9]/gi, '_')}_datacard.md`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Markdown exported');
    } catch {
      toast.error('failed to export Markdown');
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await cardAPI.exportJSON(currentCard._id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentCard.title.replace(/[^a-z0-9]/gi, '_')}_datacard.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('JSON exported');
    } catch {
      toast.error('failed to export JSON');
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryPanel(true);
    if (history.length > 0) return; // already loaded
    setHistoryLoading(true);
    try {
      const res = await cardAPI.getHistory(id);
      setHistory(res.data.data.history || []);
    } catch {
      toast.error('failed to load version history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadVersion = async (version) => {
    setVersionLoading(true);
    try {
      const res = await cardAPI.getVersion(id, version);
      setSelectedVersion(res.data.data.version);
    } catch {
      toast.error('failed to load version snapshot');
    } finally {
      setVersionLoading(false);
    }
  };

  // Toggle a version in the compare selection (max 2)
  const handleToggleCompare = (version) => {
    setCompareSelections(prev => {
      if (prev.includes(version)) return prev.filter(v => v !== version);
      if (prev.length >= 2) return [prev[1], version];
      return [...prev, version];
    });
  };

  const handleCompare = async () => {
    if (compareSelections.length !== 2) return;
    setCompareLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        cardAPI.getVersion(id, Math.min(...compareSelections)),
        cardAPI.getVersion(id, Math.max(...compareSelections)),
      ]);
      setCompareVersions({ v1: r1.data.data.version, v2: r2.data.data.version });
    } catch {
      toast.error('failed to load versions for comparison');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleOpenAccessLog = async () => {
    setShowAccessLog(true);
    if (accessLog) return;
    setAccessLogLoading(true);
    try {
      const res = await cardAPI.getShareStats(id);
      setAccessLog(res.data.data);
    } catch {
      toast.error('failed to load access log');
    } finally {
      setAccessLogLoading(false);
    }
  };

  if (loading && !currentCard) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="loading card..." />
      </div>
    );
  }

  if (error || !currentCard) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center font-mono">
        <p className="text-danger mb-4 text-sm">{error || 'card not found'}</p>
        <Link to="/dashboard" className="btn-primary text-sm">
          back to dashboard
        </Link>
      </div>
    );
  }

  const visibilityLabel = currentCard.visibility === 'public'
    ? <span className="text-primary">[pub]</span>
    : <span className="text-accent">[prv]</span>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-term-muted hover:text-term-default font-mono text-sm transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>back</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenHistory}
            className="btn-secondary flex items-center space-x-1 text-xs"
            title="version history"
          >
            <HiClock className="w-4 h-4" />
            <span className="hidden sm:inline">history</span>
            {currentCard.currentVersion > 1 && (
              <span className="ml-1 px-1 bg-term-border text-term-muted text-xs font-mono" style={{ borderRadius: '2px' }}>
                v{currentCard.currentVersion}
              </span>
            )}
          </button>
          <button
            onClick={handleOpenAccessLog}
            className="btn-secondary flex items-center space-x-1 text-xs"
            title="access log"
          >
            <HiClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">access log</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-secondary flex items-center space-x-1 text-xs"
          >
            <HiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">export</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-secondary flex items-center space-x-1 text-xs"
          >
            <HiShare className="w-4 h-4" />
            <span className="hidden sm:inline">share</span>
          </button>
          <Link
            to={`/cards/${id}/edit`}
            className="btn-primary flex items-center space-x-1 text-xs"
          >
            <HiPencil className="w-4 h-4" />
            <span className="hidden sm:inline">edit</span>
          </Link>
        </div>
      </div>

      {/* Card */}
      <div ref={cardRef}>
        <TerminalCard
          title={currentCard.title}
          tag={visibilityLabel}
        >
          {/* Description */}
          {currentCard.description && (
            <p className="text-term-muted font-mono text-sm mb-5">{currentCard.description}</p>
          )}

          {/* Fields */}
          <div className="mb-4">
            {currentCard.fields?.map((field, index) => (
              <div key={index} className="kv-row">
                <span className="kv-key">{field.label}</span>
                <span className="kv-value">
                  {field.encrypted ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-term-muted">[encrypted]</span>
                      {revealedFields[index] ? (
                        <>
                          <span className="text-term-default">{field.value}</span>
                          <button
                            onClick={() => setRevealedFields(prev => ({ ...prev, [index]: false }))}
                            className="text-term-muted hover:text-term-default transition-colors"
                            title="hide"
                          >
                            <HiEyeOff className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-warn">░░░░░░░░</span>
                          <button
                            onClick={() => setRevealedFields(prev => ({ ...prev, [index]: true }))}
                            className="text-term-muted hover:text-term-default transition-colors"
                            title="reveal"
                          >
                            <HiEye className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </span>
                  ) : field.type === 'url' && field.value ? (
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {field.value}
                    </a>
                  ) : field.type === 'email' && field.value ? (
                    <a href={`mailto:${field.value}`} className="text-accent hover:underline">
                      {field.value}
                    </a>
                  ) : field.type === 'phone' && field.value ? (
                    <a href={`tel:${field.value}`} className="text-accent hover:underline">
                      {field.value}
                    </a>
                  ) : (
                    field.value || <span className="text-term-muted">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Tags */}
          {currentCard.tags?.length > 0 && (
            <>
              <Divider label="tags" />
              <div className="flex flex-wrap gap-2">
                {currentCard.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-term-base border border-term-border text-term-subtle text-xs font-mono"
                    style={{ borderRadius: '2px' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Meta info */}
          <Divider label="metadata" />
          <div>
            <div className="kv-row">
              <span className="kv-key">created</span>
              <span className="kv-value">{new Date(currentCard.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">visibility</span>
              <span className="kv-value">{currentCard.visibility}</span>
            </div>
          </div>
        </TerminalCard>
      </div>

      {/* Version History Panel */}
      {showHistoryPanel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="term-modal-backdrop" onClick={() => { setShowHistoryPanel(false); setSelectedVersion(null); }} />
          <div className="flex min-h-full items-center justify-center p-4 relative z-50">
            <TerminalCard title="version history" className="w-full max-w-lg max-h-[80vh] overflow-hidden">
              <button
                onClick={() => { setShowHistoryPanel(false); setSelectedVersion(null); }}
                className="absolute top-3 right-3 text-term-muted hover:text-term-default transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                {/* Version snapshot detail */}
                {selectedVersion ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setSelectedVersion(null)}
                        className="text-xs font-mono text-term-muted hover:text-term-default flex items-center gap-1 transition-colors"
                      >
                        <HiArrowLeft className="w-3 h-3" /> back to history
                      </button>
                    </div>
                    <div className="p-2 bg-term-base border border-term-border font-mono text-xs text-term-muted" style={{ borderRadius: '2px' }}>
                      snapshot · version {selectedVersion.version} · {new Date(selectedVersion.savedAt).toLocaleString()}
                    </div>
                    <div className="kv-row">
                      <span className="kv-key">title</span>
                      <span className="kv-value font-bold text-term-bright">{selectedVersion.title}</span>
                    </div>
                    {selectedVersion.description && (
                      <div className="kv-row">
                        <span className="kv-key">description</span>
                        <span className="kv-value">{selectedVersion.description}</span>
                      </div>
                    )}
                    <p className="text-xs text-term-muted font-mono uppercase tracking-widest mt-3 mb-1">
                      fields ({selectedVersion.fields?.length || 0})
                    </p>
                    {selectedVersion.fields?.map((field, i) => (
                      <div key={i} className="kv-row">
                        <span className="kv-key">{field.label}</span>
                        <span className="kv-value flex items-center gap-2">
                          <span>{field.encrypted ? '••••••••' : (field.value || '—')}</span>
                          <span className="text-term-muted text-xs">[{field.type}]</span>
                          {field.encrypted && <span className="badge-yellow text-xs">encrypted</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : historyLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" text="loading history..." />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 font-mono text-term-muted text-xs">
                    <p>no previous versions found.</p>
                    <p className="mt-1">versions are saved automatically on every edit.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-term-muted font-mono">
                        {history.length} saved version{history.length !== 1 ? 's' : ''}
                      </p>
                      {history.length >= 2 && (
                        <button
                          onClick={() => { setCompareMode(v => !v); setCompareSelections([]); setCompareVersions(null); }}
                          className={`text-xs font-mono px-2 py-1 border transition-colors ${compareMode ? 'border-primary text-primary' : 'border-term-border text-term-muted hover:border-term-subtle'}`}
                          style={{ borderRadius: '2px' }}
                        >
                          {compareMode ? 'cancel compare' : 'compare versions'}
                        </button>
                      )}
                    </div>

                    {compareMode && (
                      <div className="p-2 bg-term-base border border-term-border font-mono text-xs text-term-muted mb-2" style={{ borderRadius: '2px' }}>
                        select 2 versions to compare · {compareSelections.length}/2 selected
                        {compareSelections.length === 2 && (
                          <button
                            onClick={handleCompare}
                            disabled={compareLoading}
                            className="ml-3 text-primary hover:underline"
                          >
                            {compareLoading ? 'loading...' : 'compare →'}
                          </button>
                        )}
                      </div>
                    )}

                    {history.map((entry) => (
                      <button
                        key={entry.version}
                        onClick={() => compareMode ? handleToggleCompare(entry.version) : handleLoadVersion(entry.version)}
                        disabled={versionLoading || compareLoading}
                        className={`w-full text-left p-3 border bg-term-base transition-colors font-mono ${
                          compareSelections.includes(entry.version)
                            ? 'border-primary'
                            : 'border-term-border hover:border-term-subtle'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {compareMode && (
                              <span className={`w-3 h-3 border flex-shrink-0 ${compareSelections.includes(entry.version) ? 'bg-primary border-primary' : 'border-term-border'}`} style={{ borderRadius: '2px' }} />
                            )}
                            <span className="text-xs text-term-muted">v{entry.version}</span>
                            <span className="text-xs text-term-default">{entry.title}</span>
                          </div>
                          <span className="text-xs text-term-muted">
                            {new Date(entry.savedAt).toLocaleDateString()} {new Date(entry.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {entry.changeNote && (
                          <p className="mt-1 text-xs text-term-muted truncate">{entry.changeNote}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TerminalCard>
          </div>
        </div>
      )}

      {/* Compare View Modal */}
      {compareVersions && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="term-modal-backdrop" onClick={() => setCompareVersions(null)} />
          <div className="flex min-h-full items-center justify-center p-4 relative z-50">
            <TerminalCard title={`compare v${compareVersions.v1.version} → v${compareVersions.v2.version}`} className="w-full max-w-3xl max-h-[85vh] overflow-hidden">
              <button onClick={() => setCompareVersions(null)} className="absolute top-3 right-3 text-term-muted hover:text-term-default">
                <HiX className="w-4 h-4" />
              </button>
              <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
                {/* Header row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 bg-term-base border border-term-border font-mono text-xs text-term-muted" style={{ borderRadius: '2px' }}>
                    v{compareVersions.v1.version} · {new Date(compareVersions.v1.savedAt).toLocaleString()}
                  </div>
                  <div className="p-2 bg-term-base border border-primary font-mono text-xs text-primary" style={{ borderRadius: '2px' }}>
                    v{compareVersions.v2.version} · {new Date(compareVersions.v2.savedAt).toLocaleString()}
                  </div>
                </div>

                {/* Title diff */}
                {compareVersions.v1.title !== compareVersions.v2.title && (
                  <div className="mb-3">
                    <p className="text-xs font-mono text-term-muted uppercase tracking-widest mb-1">title</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-danger bg-opacity-10 border border-danger border-opacity-30 font-mono text-xs text-danger" style={{ borderRadius: '2px' }}>− {compareVersions.v1.title}</div>
                      <div className="p-2 bg-primary-muted border border-primary-dim font-mono text-xs text-primary" style={{ borderRadius: '2px' }}>+ {compareVersions.v2.title}</div>
                    </div>
                  </div>
                )}

                {/* Fields diff */}
                <p className="text-xs font-mono text-term-muted uppercase tracking-widest mb-2">fields</p>
                {(() => {
                  const v1Fields = compareVersions.v1.fields || [];
                  const v2Fields = compareVersions.v2.fields || [];
                  const allLabels = [...new Set([...v1Fields.map(f => f.label), ...v2Fields.map(f => f.label)])];
                  return allLabels.map(label => {
                    const f1 = v1Fields.find(f => f.label === label);
                    const f2 = v2Fields.find(f => f.label === label);
                    const changed = f1?.value !== f2?.value;
                    const added = !f1 && f2;
                    const removed = f1 && !f2;
                    return (
                      <div key={label} className={`mb-2 grid grid-cols-2 gap-3 ${!changed && !added && !removed ? 'opacity-40' : ''}`}>
                        <div className={`p-2 font-mono text-xs border ${removed ? 'bg-danger bg-opacity-10 border-danger border-opacity-30 text-danger' : 'border-term-border text-term-default'}`} style={{ borderRadius: '2px' }}>
                          <span className="text-term-muted block text-xs mb-0.5">{label}</span>
                          {f1 ? (removed ? <span>− {f1.value || '—'}</span> : f1.value || '—') : <span className="text-term-muted italic">not present</span>}
                        </div>
                        <div className={`p-2 font-mono text-xs border ${added ? 'bg-primary-muted border-primary-dim text-primary' : changed ? 'bg-primary-muted border-primary-dim text-primary' : 'border-term-border text-term-default'}`} style={{ borderRadius: '2px' }}>
                          <span className="text-term-muted block text-xs mb-0.5">{label}</span>
                          {f2 ? (added ? <span>+ {f2.value || '—'}</span> : f2.value || '—') : <span className="text-term-muted italic">not present</span>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </TerminalCard>
          </div>
        </div>
      )}

      {/* Access Log Modal */}
      {showAccessLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="term-modal-backdrop" onClick={() => setShowAccessLog(false)} />
          <div className="flex min-h-full items-center justify-center p-4 relative z-50">
            <TerminalCard title="access log" className="w-full max-w-lg max-h-[80vh] overflow-hidden">
              <button onClick={() => setShowAccessLog(false)} className="absolute top-3 right-3 text-term-muted hover:text-term-default">
                <HiX className="w-4 h-4" />
              </button>
              <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                {accessLogLoading ? (
                  <div className="flex justify-center py-8"><LoadingSpinner size="sm" text="loading access log..." /></div>
                ) : !accessLog ? (
                  <p className="text-xs font-mono text-term-muted text-center py-8">no data available</p>
                ) : !accessLog.shareActive ? (
                  <p className="text-xs font-mono text-term-muted text-center py-8">this card has no active share link — access log is only recorded for shared cards</p>
                ) : (
                  <div className="space-y-4">
                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'total views', value: accessLog.totalViews },
                        { label: 'unique visitors', value: accessLog.uniqueVisitors },
                        { label: 'last viewed', value: accessLog.lastViewedAt ? new Date(accessLog.lastViewedAt).toLocaleDateString() : '—' },
                      ].map(s => (
                        <div key={s.label} className="p-3 border border-term-border text-center font-mono" style={{ borderRadius: '2px' }}>
                          <div className="text-lg font-bold text-accent">{s.value}</div>
                          <div className="text-xs text-term-muted mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Device breakdown */}
                    {accessLog.deviceBreakdown?.length > 0 && (
                      <div>
                        <p className="text-xs font-mono text-term-muted uppercase tracking-widest mb-2">device breakdown</p>
                        <div className="space-y-1">
                          {accessLog.deviceBreakdown.map(d => (
                            <div key={d.device} className="flex items-center justify-between font-mono text-xs">
                              <span className="text-term-default">{d.device}</span>
                              <span className="text-term-muted">{d.count} view{d.count !== 1 ? 's' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent views */}
                    {accessLog.recentViews?.length > 0 && (
                      <div>
                        <p className="text-xs font-mono text-term-muted uppercase tracking-widest mb-2">recent access events</p>
                        <div className="space-y-1">
                          {accessLog.recentViews.map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-2 border border-term-border font-mono text-xs" style={{ borderRadius: '2px' }}>
                              <div className="flex items-center gap-2">
                                <span className="text-term-default">{v.browser}</span>
                                <span className="text-term-muted">·</span>
                                <span className="text-term-muted">{v.deviceType}</span>
                                {v.referrer && <span className="text-term-muted truncate max-w-24" title={v.referrer}>← {v.referrer}</span>}
                              </div>
                              <span className="text-term-muted shrink-0">
                                {new Date(v.viewedAt).toLocaleDateString()} {new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {accessLog.totalViews === 0 && (
                      <p className="text-xs font-mono text-term-muted text-center py-4">no views yet — share the link to start tracking</p>
                    )}
                  </div>
                )}
              </div>
            </TerminalCard>
          </div>
        </div>
      )}

      {/* LLM badge */}
      {currentCard.generatedByLLM && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center px-3 py-1 bg-ai-muted text-ai border border-ai font-mono text-xs" style={{ borderRadius: '2px' }}>
            ✦ generated with ai
          </span>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          cardId={currentCard._id}
          cardTitle={currentCard.title}
          existingShareToken={currentCard.shareToken}
          existingShareExpiry={currentCard.shareExpiry}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Export PDF Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="term-modal-backdrop" onClick={() => { setShowExportModal(false); setExportPassword(''); }} />
          <div className="flex min-h-full items-center justify-center p-4 relative z-50">
            <TerminalCard title="export datacard" className="w-full max-w-sm">
              <button
                onClick={() => { setShowExportModal(false); setExportPassword(''); setProtectWithPassword(false); }}
                className="absolute top-3 right-3 text-term-muted hover:text-term-default transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>

              {/* Markdown & JSON quick exports */}
              <div className="mb-5 space-y-2">
                <p className="text-xs text-term-muted font-mono uppercase tracking-widest mb-2">standard formats</p>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center justify-between p-3 border border-term-border hover:border-term-subtle transition-colors font-mono text-xs"
                  style={{ borderRadius: '2px' }}
                >
                  <span className="text-term-default">markdown (.md)</span>
                  <HiDownload className="w-4 h-4 text-term-muted" />
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-between p-3 border border-term-border hover:border-term-subtle transition-colors font-mono text-xs"
                  style={{ borderRadius: '2px' }}
                >
                  <span className="text-term-default">json (.json)</span>
                  <HiDownload className="w-4 h-4 text-term-muted" />
                </button>
              </div>

              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-term-border" />
                <span className="text-xs font-mono text-term-muted">or export as PDF</span>
                <div className="flex-1 h-px bg-term-border" />
              </div>

              <form onSubmit={handleExportPDF} className="space-y-4">
                {/* Password protection toggle */}
                <div
                  className="flex items-center justify-between p-3 border border-term-border cursor-pointer hover:border-term-subtle transition-colors"
                  style={{ borderRadius: '2px' }}
                  onClick={() => { setProtectWithPassword(v => !v); setExportPassword(''); }}
                >
                  <div className="flex items-center space-x-2">
                    <HiLockClosed className={`w-4 h-4 ${protectWithPassword ? 'text-primary' : 'text-term-muted'}`} />
                    <span className="text-xs font-mono text-term-default">password protect this PDF</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${protectWithPassword ? 'bg-primary' : 'bg-term-border'}`}>
                    <div className={`w-3 h-3 rounded-full bg-term-base transition-transform ${protectWithPassword ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {protectWithPassword && (
                  <div>
                    <div className="flex items-start space-x-3 mb-3 p-3 bg-warn-muted border border-warn" style={{ borderRadius: '2px' }}>
                      <HiLockClosed className="w-4 h-4 text-warn mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-mono text-warn">
                        the PDF will be encrypted with your password. you will need it every time you open the file.
                      </p>
                    </div>
                    <label className="label">
                      <span className="flex items-center space-x-1">
                        <HiLockClosed className="w-3 h-3" />
                        <span>pdf password</span>
                      </span>
                    </label>
                    <input
                      type="password"
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      className="input"
                      placeholder="min. 4 characters"
                      autoFocus
                      maxLength={100}
                    />
                    {exportPassword.length > 0 && exportPassword.length < 4 && (
                      <p className="mt-1 text-xs font-mono text-danger">minimum 4 characters</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={exportLoading || (protectWithPassword && exportPassword.length < 4)}
                  className="w-full btn-primary flex items-center justify-center space-x-2 text-sm"
                >
                  {exportLoading ? (
                    <LoadingSpinner size="sm" text="generating PDF..." />
                  ) : (
                    <>
                      <HiDownload className="w-4 h-4" />
                      <span>{protectWithPassword ? 'download protected PDF' : 'download PDF'}</span>
                    </>
                  )}
                </button>
              </form>
            </TerminalCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardViewer;
