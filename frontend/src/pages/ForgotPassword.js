import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import TerminalCard from '../components/Common/TerminalCard';
import { HiMail, HiArrowLeft, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('something went wrong, please try again');
    } finally {
      setLoading(false);
    }
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
            enter your email to receive a reset link
          </p>
        </div>

        <TerminalCard title="forgot-password">
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <HiCheckCircle className="w-10 h-10 text-primary" />
              </div>
              <p className="font-mono text-sm text-term-default">reset link sent</p>
              <p className="font-mono text-xs text-term-muted">
                if <span className="text-term-default">{email}</span> is registered,
                you'll receive an email with a reset link. check your inbox (and spam folder).
              </p>
              <p className="font-mono text-xs text-term-muted">link expires in 15 minutes.</p>
              <Link to="/login" className="btn-primary w-full block text-center text-sm mt-4">
                back to login
              </Link>
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
                {loading ? 'sending...' : '→ send reset link'}
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
