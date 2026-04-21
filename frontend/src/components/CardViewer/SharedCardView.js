import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cardAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import TerminalCard from '../Common/TerminalCard';
import { HiLockClosed, HiLocationMarker, HiClock, HiDesktopComputer, HiShieldExclamation } from 'react-icons/hi';

const SharedCardView = () => {
  const { token } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [password, setPassword] = useState('');
  const [wrongPassword, setWrongPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // null = not decided, true = accepted, false = declined
  const [consent, setConsent] = useState(null);
  const fetched = useRef(false);

  const loadCard = async (pw = null, trackingConsent = true) => {
    setLoading(true);
    try {
      const response = await cardAPI.getShared(token, pw, trackingConsent);
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

  // Only load card if consent was accepted
  useEffect(() => {
    if (consent !== true || fetched.current) return;
    fetched.current = true;
    loadCard(null, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setWrongPassword(false);
    await loadCard(password.trim(), consent);
    setSubmitting(false);
  };

  // Step 1 — Consent gate (shown before anything else)
  if (consent === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-term-base px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center font-mono text-lg">
              <span className="text-term-muted">[</span>
              <span className="text-primary">sc</span>
              <span className="text-term-muted">]</span>
              <span className="ml-2 text-term-subtle">securecard</span>
            </Link>
          </div>

          <TerminalCard title="before you view this card">
            <div className="flex justify-center mb-4">
              <HiShieldExclamation className="w-10 h-10 text-warn" />
            </div>

            <p className="font-mono text-xs text-term-muted mb-4 text-center">
              the owner of this card has enabled visit tracking. if you continue, the following will be collected and shown to them:
            </p>

            <div className="space-y-2 mb-5">
              {[
                { icon: HiLocationMarker, text: 'approximate location (country & city)' },
                { icon: HiClock,          text: 'date, time & timezone of your visit' },
                { icon: HiDesktopComputer, text: 'browser & device type' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-2 border border-term-border font-mono text-xs" style={{ borderRadius: '2px' }}>
                  <Icon className="w-4 h-4 text-warn shrink-0" />
                  <span className="text-term-default">{text}</span>
                </div>
              ))}
            </div>

            <p className="font-mono text-xs text-term-muted mb-5 text-center">
              if you decline, none of this data will be collected and you can still view the card.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConsent(false)}
                className="flex-1 btn-secondary text-xs"
              >
                decline
              </button>
              <button
                onClick={() => setConsent(true)}
                className="flex-1 btn-primary text-xs"
              >
                accept & view
              </button>
            </div>
          </TerminalCard>
        </div>
      </div>
    );
  }

  // Step 2 — Declined
  if (consent === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-term-base px-4">
        <div className="max-w-sm w-full text-center font-mono">
          <HiShieldExclamation className="w-10 h-10 text-term-muted mx-auto mb-4" />
          <h1 className="text-term-bright text-sm font-bold mb-2">access declined</h1>
          <p className="text-term-muted text-xs mb-6">
            you declined the data collection notice. this card cannot be viewed without accepting it.
          </p>
          <button
            onClick={() => setConsent(null)}
            className="btn-secondary text-xs"
          >
            ← go back
          </button>
        </div>
      </div>
    );
  }

  // Step 3 — Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-term-base">
        <LoadingSpinner size="lg" text="loading shared card..." />
      </div>
    );
  }

  // Step 4 — Error
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

  // Step 5 — Password prompt (after consent)
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

  if (!card) return null;

  // Step 6 — Card content
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
          tag={<span className="text-xs font-mono text-term-muted">shared</span>}
        >
          {card.description && (
            <p className="text-term-muted font-mono text-sm mb-5">{card.description}</p>
          )}

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
                    <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {field.value}
                    </a>
                  ) : field.type === 'email' && field.value ? (
                    <a href={`mailto:${field.value}`} className="text-accent hover:underline">{field.value}</a>
                  ) : field.type === 'phone' && field.value ? (
                    <a href={`tel:${field.value}`} className="text-accent hover:underline">{field.value}</a>
                  ) : (
                    field.value || <span className="text-term-muted">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>

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
