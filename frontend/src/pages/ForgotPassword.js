import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import TerminalCard from '../components/Common/TerminalCard';
import { HiMail, HiArrowLeft, HiClipboardCopy, HiCheck, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
      } else {
        toast.error('email not found');
      }
    } catch {
      toast.error('something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    toast.success('link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-term-base py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center font-mono text-lg mb-6">
            <span className="text-term-muted">[</span>
            <span className="text-primary">sc</span>
            <span className="text-term-muted">]</span>
            <span className="ml-2 text-term-subtle">securecard</span>
          </Link>
          <h2 className="text-2xl font-bold text-term-bright">reset password</h2>
          <p className="mt-2 text-term-muted font-mono text-sm">
            enter your registered email
          </p>
        </div>

        <TerminalCard title="forgot-password">
          {resetUrl ? (
            <div className="space-y-4">
              <div className="p-3 bg-primary-muted border border-primary-dim font-mono text-xs text-primary" style={{ borderRadius: '2px' }}>
                + reset link generated — expires in 15 minutes
              </div>
              <div>
                <label className="label">your reset link</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={resetUrl}
                    className="input flex-1 text-xs"
                  />
                  <button
                    onClick={handleCopy}
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
              <button
                onClick={() => navigate(resetUrl.replace(window.location.origin, ''))}
                className="w-full btn-primary flex items-center justify-center space-x-2 text-sm"
              >
                <span>go to reset page</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center">
                <Link to="/login" className="text-xs font-mono text-term-muted hover:text-primary transition-colors">
                  back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-4 w-4 text-term-muted" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5"
              >
                {loading ? 'generating...' : '→ get reset link'}
              </button>
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-mono text-term-muted hover:text-primary transition-colors"
                >
                  <HiArrowLeft className="w-3 h-3" /> back to login
                </Link>
              </div>
            </form>
          )}
        </TerminalCard>
      </div>
    </div>
  );
};

export default ForgotPassword;
