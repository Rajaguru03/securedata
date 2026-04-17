import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiShieldCheck } from 'react-icons/hi';
import TerminalCard from '../Common/TerminalCard';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // 2FA state
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const { login, complete2FALogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success && result.twoFactorRequired) {
      setTempToken(result.tempToken);
      setTwoFactorStep(true);
      toast('enter your authenticator code', { icon: '🔐' });
    } else if (result.success) {
      toast.success('welcome back!');
      navigate(from, { replace: true });
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await complete2FALogin(tempToken, totpCode);
    if (result.success) {
      toast.success('welcome back!');
      navigate(from, { replace: true });
    } else {
      toast.error(result.error);
      setTotpCode('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-term-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center font-mono text-lg mb-6">
            <span className="text-term-muted">[</span>
            <span className="text-primary">sc</span>
            <span className="text-term-muted">]</span>
            <span className="ml-2 text-term-subtle">securecard</span>
          </Link>
          <h2 className="text-2xl font-bold text-term-bright">welcome back</h2>
          <p className="mt-2 text-term-muted font-mono text-sm">sign in to your account</p>
        </div>

        {/* 2FA Step */}
        {twoFactorStep ? (
          <TerminalCard title="two-factor authentication">
            <div className="mb-4 flex items-center gap-2 text-xs font-mono text-term-muted">
              <HiShieldCheck className="w-4 h-4 text-primary" />
              enter the 6-digit code from your authenticator app
            </div>
            <form onSubmit={handle2FASubmit} className="space-y-5">
              <div>
                <label htmlFor="totpCode" className="label">verification code</label>
                <input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="input text-center text-xl tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full btn-primary py-2.5">
                {loading ? 'verifying...' : 'verify'}
              </button>
              <button type="button" onClick={() => { setTwoFactorStep(false); setTotpCode(''); }}
                className="w-full text-xs font-mono text-term-muted hover:text-primary transition-colors">
                back to login
              </button>
            </form>
          </TerminalCard>
        ) : (
        <TerminalCard title="authentication">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiMail className="h-4 w-4 text-term-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLockClosed className="h-4 w-4 text-term-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <HiEyeOff className="h-4 w-4 text-term-muted hover:text-term-subtle" />
                  ) : (
                    <HiEye className="h-4 w-4 text-term-muted hover:text-term-subtle" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-mono text-term-muted hover:text-primary transition-colors"
              >
                forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5"
            >
              {loading ? 'authenticating...' : 'sign in'}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-5 text-center">
            <p className="text-term-muted font-mono text-xs">
              no account?{' '}
              <Link to="/register" className="text-accent hover:text-primary transition-colors">
                register
              </Link>
            </p>
          </div>
        </TerminalCard>

        )} {/* end 2FA conditional */}

        {/* Security notice */}
        <p className="mt-5 text-center text-xs font-mono text-term-muted">
          your data is encrypted and secure
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
