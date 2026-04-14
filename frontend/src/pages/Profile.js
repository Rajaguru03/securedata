import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import TerminalCard from '../components/Common/TerminalCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
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
} from 'react-icons/hi';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        setProfile(res.data.data);
      } catch {
        setError('failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
