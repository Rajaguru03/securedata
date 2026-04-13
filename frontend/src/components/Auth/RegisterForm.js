import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiUser, HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import TerminalCard from '../Common/TerminalCard';
import toast from 'react-hot-toast';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation rules (must match backend validator)
  const passwordRules = [
    { test: (p) => p.length >= 8, message: 'at least 8 characters' },
    { test: (p) => /[A-Z]/.test(p), message: 'one uppercase letter' },
    { test: (p) => /[a-z]/.test(p), message: 'one lowercase letter' },
    { test: (p) => /\d/.test(p), message: 'one number' },
    { test: (p) => /[^A-Za-z0-9]/.test(p), message: 'one special character (!@#$...)' },
  ];

  const getStrength = (p) => {
    if (!p) return { score: 0, label: '', color: '' };
    const passed = passwordRules.filter(r => r.test(p)).length;
    if (passed <= 1) return { score: 1, label: 'weak', color: 'bg-danger' };
    if (passed === 2) return { score: 2, label: 'fair', color: 'bg-warn' };
    if (passed === 3) return { score: 3, label: 'good', color: 'bg-accent' };
    if (passed === 4) return { score: 4, label: 'strong', color: 'bg-primary' };
    return { score: 5, label: 'very strong', color: 'bg-primary' };
  };

  const strength = getStrength(formData.password);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('passwords do not match');
      return;
    }

    const failedRules = passwordRules.filter((rule) => !rule.test(formData.password));
    if (failedRules.length > 0) {
      toast.error(`password needs: ${failedRules[0].message}`);
      return;
    }

    setLoading(true);

    const result = await register(formData.name, formData.email, formData.password);

    if (result.success) {
      toast.success('account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
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
          <h2 className="text-2xl font-bold text-term-bright">create your account</h2>
          <p className="mt-2 text-term-muted font-mono text-sm">start creating secure datacards today</p>
        </div>

        {/* Form */}
        <TerminalCard title="registration">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">full name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiUser className="h-4 w-4 text-term-muted" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="John Doe"
                  minLength={2}
                  maxLength={50}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">email address</label>
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
              <label htmlFor="password" className="label">password</label>
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
                  placeholder="create a strong password"
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

              {/* Strength meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-term-muted">strength</span>
                    <span className={`text-xs font-mono ${strength.score >= 4 ? 'text-primary' : strength.score === 3 ? 'text-accent' : strength.score === 2 ? 'text-warn' : 'text-danger'}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1 flex-1 rounded-sm transition-colors duration-200 ${
                          seg <= strength.score ? strength.color : 'bg-term-border'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    {passwordRules.map((rule, index) => (
                      <div
                        key={index}
                        className={`flex items-center text-xs font-mono ${
                          rule.test(formData.password) ? 'text-primary' : 'text-term-muted'
                        }`}
                      >
                        <span className="mr-2">{rule.test(formData.password) ? '[x]' : '[ ]'}</span>
                        {rule.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">confirm password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLockClosed className="h-4 w-4 text-term-muted" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input pl-10 ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? 'input-error'
                      : ''
                  }`}
                  placeholder="confirm your password"
                />
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs font-mono text-danger">passwords do not match</p>
                )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 mt-2"
            >
              {loading ? 'creating account...' : 'create account'}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-5 text-center">
            <p className="text-term-muted font-mono text-xs">
              already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-primary transition-colors">
                sign in
              </Link>
            </p>
          </div>
        </TerminalCard>

        {/* Security notice */}
        <p className="mt-5 text-center text-xs font-mono text-term-muted">
          by creating an account, you agree to our security practices.
          your data is encrypted with AES-256.
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
