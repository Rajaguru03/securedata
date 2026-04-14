import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import TerminalCard from '../components/Common/TerminalCard';
import { HiLockClosed, HiEye, HiEyeOff, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const passwordRules = [
  { test: (p) => p.length >= 8,          label: 'at least 8 characters' },
  { test: (p) => /[A-Z]/.test(p),        label: 'one uppercase letter' },
  { test: (p) => /[a-z]/.test(p),        label: 'one lowercase letter' },
  { test: (p) => /\d/.test(p),           label: 'one number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'one special character (!@#$...)' },
];

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const allRulesPassed = passwordRules.every(r => r.test(password));
  const passwordsMatch = password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesPassed) { toast.error('password does not meet requirements'); return; }
    if (!passwordsMatch) { toast.error('passwords do not match'); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'reset link is invalid or expired');
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
          <h2 className="text-2xl font-bold text-term-bright">new password</h2>
          <p className="mt-2 text-term-muted font-mono text-sm">choose a strong password</p>
        </div>

        <TerminalCard title="reset-password">
          {done ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <HiCheckCircle className="w-10 h-10 text-primary" />
              </div>
              <p className="font-mono text-sm text-term-default">password updated successfully</p>
              <p className="font-mono text-xs text-term-muted">redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="label">new password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-4 w-4 text-term-muted" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword
                      ? <HiEyeOff className="h-4 w-4 text-term-muted" />
                      : <HiEye className="h-4 w-4 text-term-muted" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    {passwordRules.map((rule, i) => (
                      <div key={i} className={`flex items-center text-xs font-mono ${rule.test(password) ? 'text-primary' : 'text-term-muted'}`}>
                        <span className="mr-2">{rule.test(password) ? '[x]' : '[ ]'}</span>
                        {rule.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="label">confirm password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-4 w-4 text-term-muted" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`input pl-10 ${confirm && !passwordsMatch ? 'input-error' : ''}`}
                    placeholder="confirm your password"
                  />
                </div>
                {confirm && !passwordsMatch && (
                  <p className="mt-1 text-xs font-mono text-danger">passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !allRulesPassed || !passwordsMatch}
                className="w-full btn-primary py-2.5"
              >
                {loading ? 'updating...' : '→ update password'}
              </button>
            </form>
          )}
        </TerminalCard>
      </div>
    </div>
  );
};

export default ResetPassword;
