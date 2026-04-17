import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import TerminalCard from '../components/Common/TerminalCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiUser,
  HiMail,
  HiCalendar,
  HiCollection,
  HiShare,
  HiEye,
  HiExternalLink,
  HiClock,
  HiLockClosed,
  HiCheckCircle,
  HiXCircle,
  HiShieldCheck,
  HiTrash,
  HiQrcode,
} from 'react-icons/hi';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState(null); // { qrCode, secret }
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  // GDPR state
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        setProfile(res.data.data);
        setTwoFAEnabled(res.data.data.user.twoFactorEnabled || false);
      } catch {
        setError('failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const res = await authAPI.setup2FA();
      setTwoFASetup(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start 2FA setup');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setTwoFALoading(true);
    try {
      await authAPI.verifySetup2FA(twoFACode);
      setTwoFAEnabled(true);
      setTwoFASetup(null);
      setTwoFACode('');
      toast.success('2FA enabled successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setTwoFALoading(true);
    try {
      await authAPI.disable2FA(twoFACode);
      setTwoFAEnabled(false);
      setShowDisable2FA(false);
      setTwoFACode('');
      toast.success('2FA disabled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await authAPI.deleteAccount(deletePassword);
      toast.success('Account deleted');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deletion failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatExpiry = (date) => {
    if (!date) return 'never';
    const d = new Date(date);
    const now = new Date();
    if (d < now) return 'expired';
    const days = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    return `${days}d remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-term-base flex items-center justify-center">
        <LoadingSpinner text="loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-term-base flex items-center justify-center">
        <p className="font-mono text-sm text-danger">{error}</p>
      </div>
    );
  }

  const { stats, sharedCards } = profile;

  return (
    <div className="min-h-screen bg-term-base">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="font-mono text-xs text-term-muted mb-2">
          <span className="text-primary">~/</span>profile
        </div>

        {/* User Details */}
        <TerminalCard title="user-info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="kv-row">
              <span className="kv-key flex items-center gap-1">
                <HiUser className="w-3 h-3" /> name
              </span>
              <span className="kv-value">{user?.name}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key flex items-center gap-1">
                <HiMail className="w-3 h-3" /> email
              </span>
              <span className="kv-value">{user?.email}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key flex items-center gap-1">
                <HiCalendar className="w-3 h-3" /> member since
              </span>
              <span className="kv-value">{formatDate(profile.user.createdAt)}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key flex items-center gap-1">
                <HiLockClosed className="w-3 h-3" /> account id
              </span>
              <span className="kv-value text-term-muted text-xs truncate">{profile.user.id}</span>
            </div>
          </div>
        </TerminalCard>

        {/* Stats */}
        <TerminalCard title="stats">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-term-base border border-term-border text-center" style={{ borderRadius: '2px' }}>
              <div className="flex items-center justify-center mb-1">
                <HiCollection className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent font-mono">{stats.totalCards}</div>
              <div className="text-xs text-term-muted font-mono mt-1">total cards</div>
            </div>
            <div className="p-3 bg-term-base border border-term-border text-center" style={{ borderRadius: '2px' }}>
              <div className="flex items-center justify-center mb-1">
                <HiShare className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary font-mono">{stats.totalShared}</div>
              <div className="text-xs text-term-muted font-mono mt-1">shared cards</div>
            </div>
            <div className="p-3 bg-term-base border border-term-border text-center" style={{ borderRadius: '2px' }}>
              <div className="flex items-center justify-center mb-1">
                <HiCheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary font-mono">{stats.activeShared}</div>
              <div className="text-xs text-term-muted font-mono mt-1">active links</div>
            </div>
            <div className="p-3 bg-term-base border border-term-border text-center" style={{ borderRadius: '2px' }}>
              <div className="flex items-center justify-center mb-1">
                <HiEye className="w-4 h-4 text-ai" />
              </div>
              <div className="text-2xl font-bold text-ai font-mono">{stats.totalViews}</div>
              <div className="text-xs text-term-muted font-mono mt-1">total views</div>
            </div>
          </div>
        </TerminalCard>

        {/* 2FA */}
        <TerminalCard title="two-factor authentication">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-sm">
                <HiShieldCheck className={`w-4 h-4 ${twoFAEnabled ? 'text-primary' : 'text-term-muted'}`} />
                <span className="text-term-default">status:</span>
                <span className={twoFAEnabled ? 'text-primary' : 'text-term-muted'}>
                  {twoFAEnabled ? 'enabled' : 'disabled'}
                </span>
              </div>
              {!twoFAEnabled && !twoFASetup && (
                <button onClick={handleSetup2FA} disabled={twoFALoading} className="btn-primary text-xs px-3 py-1.5">
                  {twoFALoading ? 'loading...' : 'enable 2fa'}
                </button>
              )}
              {twoFAEnabled && !showDisable2FA && (
                <button onClick={() => setShowDisable2FA(true)} className="text-xs font-mono text-danger hover:underline">
                  disable 2fa
                </button>
              )}
            </div>

            {/* Setup flow: show QR */}
            {twoFASetup && (
              <div className="space-y-3 border border-term-border p-4" style={{ borderRadius: '2px' }}>
                <p className="font-mono text-xs text-term-muted flex items-center gap-1">
                  <HiQrcode className="w-3 h-3" /> scan with google authenticator or authy
                </p>
                <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-40 h-40 mx-auto bg-white p-2" />
                <p className="font-mono text-xs text-term-muted text-center">
                  manual key: <span className="text-accent tracking-widest">{twoFASetup.secret}</span>
                </p>
                <div className="space-y-2">
                  <label className="label">enter code to confirm</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                    className="input text-center tracking-widest"
                    placeholder="000000"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleVerify2FA} disabled={twoFALoading || twoFACode.length !== 6} className="flex-1 btn-primary text-xs py-2">
                      {twoFALoading ? 'verifying...' : 'confirm & enable'}
                    </button>
                    <button onClick={() => { setTwoFASetup(null); setTwoFACode(''); }} className="flex-1 text-xs font-mono text-term-muted hover:text-primary border border-term-border py-2">
                      cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Disable flow */}
            {showDisable2FA && (
              <div className="space-y-3 border border-danger border-opacity-30 p-4" style={{ borderRadius: '2px' }}>
                <p className="font-mono text-xs text-term-muted">enter your current authenticator code to disable 2fa</p>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  className="input text-center tracking-widest"
                  placeholder="000000"
                />
                <div className="flex gap-2">
                  <button onClick={handleDisable2FA} disabled={twoFALoading || twoFACode.length !== 6} className="flex-1 text-xs font-mono text-danger border border-danger border-opacity-50 py-2 hover:bg-danger hover:bg-opacity-10">
                    {twoFALoading ? 'disabling...' : 'disable 2fa'}
                  </button>
                  <button onClick={() => { setShowDisable2FA(false); setTwoFACode(''); }} className="flex-1 text-xs font-mono text-term-muted hover:text-primary border border-term-border py-2">
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </TerminalCard>

        {/* GDPR: Delete Account */}
        <TerminalCard title="danger-zone">
          <div className="space-y-3">
            <p className="font-mono text-xs text-term-muted">
              permanently delete your account and all associated data (cards, versions, shares). this cannot be undone.
            </p>
            {!showDeleteAccount ? (
              <button onClick={() => setShowDeleteAccount(true)} className="flex items-center gap-2 text-xs font-mono text-danger hover:underline">
                <HiTrash className="w-3 h-3" /> delete my account
              </button>
            ) : (
              <div className="space-y-3 border border-danger border-opacity-30 p-4" style={{ borderRadius: '2px' }}>
                <label className="label text-danger">confirm password to delete account</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input"
                  placeholder="enter your password"
                />
                <div className="flex gap-2">
                  <button onClick={handleDeleteAccount} disabled={deleteLoading || !deletePassword} className="flex-1 text-xs font-mono text-danger border border-danger border-opacity-50 py-2 hover:bg-danger hover:bg-opacity-10">
                    {deleteLoading ? 'deleting...' : 'permanently delete'}
                  </button>
                  <button onClick={() => { setShowDeleteAccount(false); setDeletePassword(''); }} className="flex-1 text-xs font-mono text-term-muted hover:text-primary border border-term-border py-2">
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </TerminalCard>

        {/* Shared Cards */}
        <TerminalCard title="shared-datacards">
          {sharedCards.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-term-muted">
              no shared cards yet —{' '}
              <Link to="/dashboard" className="text-primary hover:underline">
                go to dashboard
              </Link>{' '}
              to share a card
            </div>
          ) : (
            <div className="space-y-3">
              {sharedCards.map((card) => (
                <div
                  key={card.id}
                  className="p-3 bg-term-base border border-term-border"
                  style={{ borderRadius: '2px' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      to={`/cards/${card.id}`}
                      className="font-mono text-sm text-term-default hover:text-primary transition-colors"
                    >
                      {card.title}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {card.isExpired ? (
                        <span className="flex items-center gap-1 text-xs font-mono text-danger">
                          <HiXCircle className="w-3 h-3" /> expired
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-mono text-primary">
                          <HiCheckCircle className="w-3 h-3" /> active
                        </span>
                      )}
                      <a
                        href={`${window.location.origin}/card/shared/${card.shareToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:text-accent transition-colors"
                        title="open share link"
                      >
                        <HiExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="kv-row">
                      <span className="kv-key flex items-center gap-1">
                        <HiEye className="w-3 h-3" /> views
                      </span>
                      <span className="kv-value">{card.viewCount}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-key flex items-center gap-1">
                        <HiClock className="w-3 h-3" /> expires
                      </span>
                      <span className={`kv-value ${card.isExpired ? 'text-danger' : card.shareExpiry ? 'text-warn' : 'text-primary'}`}>
                        {formatExpiry(card.shareExpiry)}
                      </span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-key flex items-center gap-1">
                        <HiCalendar className="w-3 h-3" /> last view
                      </span>
                      <span className="kv-value">{card.lastViewedAt ? formatDate(card.lastViewedAt) : '—'}</span>
                    </div>
                  </div>

                  <div className="mt-2 font-mono text-xs text-term-muted truncate">
                    <span className="text-term-border">link: </span>
                    {window.location.origin}/card/shared/{card.shareToken}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TerminalCard>

      </div>
    </div>
  );
};

export default Profile;
