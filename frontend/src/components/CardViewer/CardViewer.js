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
                  <div className="space-y-1">
                    <p className="text-xs text-term-muted font-mono mb-3">
                      {history.length} saved version{history.length !== 1 ? 's' : ''} · click to inspect
                    </p>
                    {history.map((entry) => (
                      <button
                        key={entry.version}
                        onClick={() => handleLoadVersion(entry.version)}
                        disabled={versionLoading}
                        className="w-full text-left p-3 border border-term-border hover:border-term-subtle bg-term-base transition-colors font-mono"
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
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
            <TerminalCard title="export as PDF" className="w-full max-w-sm">
              <button
                onClick={() => { setShowExportModal(false); setExportPassword(''); setProtectWithPassword(false); }}
                className="absolute top-3 right-3 text-term-muted hover:text-term-default transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>

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
