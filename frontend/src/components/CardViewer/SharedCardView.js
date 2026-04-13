import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cardAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';
import TerminalCard from '../Common/TerminalCard';
import {
  HiLockClosed,
  HiMail,
  HiPhone,
  HiLink,
  HiCalendar,
  HiDocumentText,
  HiExclamation,
} from 'react-icons/hi';

const FIELD_ICONS = {
  email: HiMail,
  phone: HiPhone,
  url: HiLink,
  date: HiCalendar,
  textarea: HiDocumentText,
};

const SharedCardView = () => {
  const { token } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [password, setPassword] = useState('');
  const [wrongPassword, setWrongPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fetched = useRef(false);

  const loadCard = async (pw = null) => {
    try {
      const response = await cardAPI.getShared(token, pw);
      setCard(response.data.data.datacard);
      setRequiresPassword(false);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresPassword) {
        setRequiresPassword(true);
        setCardTitle(data.title || '');
        setWrongPassword(!!data.wrongPassword);
      } else {
        setError(data?.error || 'Card not found or link expired');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || fetched.current) return;
    fetched.current = true;
    loadCard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setWrongPassword(false);
    await loadCard(password.trim());
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-term-base">
        <LoadingSpinner size="lg" text="loading shared card..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-term-base px-4">
        <div className="max-w-md w-full text-center font-mono">
          <div className="text-4xl text-danger mb-4">!</div>
          <h1 className="text-xl font-bold text-term-bright mb-2">card not available</h1>
          <p className="text-term-muted text-sm mb-6">{error}</p>
          <Link to="/" className="btn-primary text-sm inline-block">
            go to home
          </Link>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-term-base px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center font-mono text-lg mb-6">
              <span className="text-term-muted">[</span>
              <span className="text-primary">sc</span>
              <span className="text-term-muted">]</span>
              <span className="ml-2 text-term-subtle">securecard</span>
            </Link>
          </div>
          <TerminalCard title="protected card">
            <div className="flex flex-col items-center mb-5">
              <HiLockClosed className="w-8 h-8 text-warn mb-2" />
              <p className="font-mono text-sm text-term-bright text-center">
                {cardTitle ? `"${cardTitle}"` : 'this card'} is password protected
              </p>
              <p className="font-mono text-xs text-term-muted mt-1 text-center">
                enter the password to view its contents
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="label">password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input ${wrongPassword ? 'border-danger' : ''}`}
                  placeholder="enter share password"
                  autoFocus
                />
                {wrongPassword && (
                  <p className="mt-1 text-xs font-mono text-danger">incorrect password, try again</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting || !password.trim()}
                className="w-full btn-primary text-sm"
              >
                {submitting ? 'verifying...' : '→ unlock card'}
              </button>
            </form>
          </TerminalCard>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <div className="min-h-screen bg-term-base py-8 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <Link to="/" className="inline-flex items-center font-mono text-sm">
          <span className="text-term-muted">[</span>
          <span className="text-primary">sc</span>
          <span className="text-term-muted">]</span>
          <span className="ml-2 text-term-subtle">securecard</span>
        </Link>
      </div>

      {/* Card */}
      <div className="max-w-2xl mx-auto">
        <TerminalCard
          title={card.title}
          tag={
            <span className="text-xs font-mono text-term-muted">shared</span>
          }
        >
          {/* Description */}
          {card.description && (
            <p className="text-term-muted font-mono text-sm mb-5">{card.description}</p>
          )}

          {/* Fields */}
          <div className="mb-4">
            {card.fields?.map((field, index) => (
              <div key={index} className="kv-row">
                <span className="kv-key">{field.label}</span>
                <span className="kv-value">
                  {field.encrypted ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-term-muted">[protected]</span>
                      <span className="text-warn">░░░░░░░░</span>
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
          {card.tags?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-term-border">
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-term-base border border-term-border text-term-subtle text-xs font-mono"
                    style={{ borderRadius: '2px' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </TerminalCard>

        {/* Footer note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-term-muted font-mono">
            shared via securecard · some fields may be protected for privacy
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto mt-10 text-center">
        <p className="text-term-muted font-mono text-xs mb-3">want to create your own secure datacards?</p>
        <Link to="/register" className="btn-primary text-xs inline-block">
          → get started free
        </Link>
      </div>
    </div>
  );
};

export default SharedCardView;
