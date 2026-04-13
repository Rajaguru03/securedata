import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TerminalCard from '../components/Common/TerminalCard';

const features = [
  {
    tag: '[enc]',
    title: 'AES-256 Encryption',
    description: 'Your sensitive data is encrypted with military-grade AES-256-GCM encryption.',
  },
  {
    tag: '[ai]',
    title: 'AI-Powered Generation',
    description: 'Use LLM to automatically generate datacard content from natural language.',
  },
  {
    tag: '[tpl]',
    title: 'Multiple Templates',
    description: 'Choose from professional, minimal, and creative templates for your cards.',
  },
  {
    tag: '[shr]',
    title: 'Secure Sharing',
    description: 'Share cards with expiring links. Encrypted fields stay protected.',
  },
];

const Divider = ({ label }) => (
  <div className="flex items-center gap-2 my-6">
    <span className="text-term-border font-mono text-xs">──</span>
    <span className="text-term-muted font-mono text-xs">{label}</span>
    <span className="flex-1 overflow-hidden text-term-border font-mono text-xs">{'─'.repeat(80)}</span>
  </div>
);

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-term-base">
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <p className="text-term-muted font-mono text-sm mb-3">$ securecard --init</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-term-bright mb-6 cursor-blink">
              create secure datacards
              <br />
              <span className="text-primary">with ai assistance</span>
            </h1>
            <p className="text-term-subtle font-mono max-w-2xl mx-auto mb-8 text-sm leading-relaxed">
              build professional digital cards with field-level encryption,
              ai-powered content generation, and secure sharing capabilities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary px-6 py-2 text-sm">
                  → go to dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary px-6 py-2 text-sm">
                    → get started free
                  </Link>
                  <Link to="/login" className="btn-outline px-6 py-2 text-sm">
                    sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Hero illustration */}
          <div className="mt-16 max-w-2xl mx-auto">
            <TerminalCard title="professional profile · business contact card">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <div className="w-3 h-3 rounded-full bg-warn" />
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <div className="space-y-0">
                <div className="kv-row">
                  <span className="kv-key">name</span>
                  <span className="kv-value">John Doe</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">email</span>
                  <span className="kv-value text-accent">john@example.com</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">ssn</span>
                  <span className="kv-value flex items-center gap-2">
                    <span className="text-warn">░░░░░░░░</span>
                    <span className="badge-yellow text-xs">encrypted</span>
                  </span>
                </div>
              </div>
            </TerminalCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-term-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Divider label="features" />
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-term-bright mb-3">
              built for security &amp; simplicity
            </h2>
            <p className="text-term-muted font-mono text-sm max-w-2xl mx-auto">
              every feature designed with security best practices and ease of use in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="card hover:border-term-subtle transition-colors">
                <div className="mb-3">
                  <span className="text-primary font-mono text-xs font-bold">{feature.tag}</span>
                </div>
                <h3 className="text-sm font-semibold text-term-bright mb-2">
                  {feature.title.toLowerCase()}
                </h3>
                <p className="text-term-muted text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-term-surface border-y border-term-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <div className="lg:w-1/2">
              <p className="text-primary font-mono text-xs uppercase tracking-widest mb-3">+ security first</p>
              <h2 className="text-2xl font-bold text-term-bright mb-6">
                enterprise-grade security for your data
              </h2>
              <ul className="space-y-3">
                {[
                  'AES-256-GCM encryption for sensitive fields',
                  'JWT-based authentication with bcrypt password hashing',
                  'Rate limiting and input validation on all endpoints',
                  'Prompt injection defenses for AI features',
                  'OWASP Top 10 security measures implemented',
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3 font-mono text-sm">
                    <span className="text-primary flex-shrink-0">+</span>
                    <span className="text-term-default">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2">
              <TerminalCard title="field-level encryption">
                <div className="font-mono text-xs space-y-3">
                  <div>
                    <span className="text-term-muted">// field-level encryption</span>
                  </div>
                  <div className="text-primary">
                    const encrypted = encrypt(sensitiveData);
                  </div>
                  <div className="mt-2">
                    <span className="text-term-muted">// output format</span>
                  </div>
                  <div className="text-accent break-all">
                    "iv:authTag:ciphertext"
                  </div>
                  <div className="mt-2">
                    <span className="text-term-muted">// tamper detection</span>
                  </div>
                  <div className="text-warn">
                    GCM authentication tag validates integrity
                  </div>
                </div>
              </TerminalCard>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-term-surface border-y border-primary-dim">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-term-bright mb-4">
            ready to create your secure datacard?
          </h2>
          <p className="text-term-muted font-mono text-sm mb-8">
            join users who trust securecard for their digital identity needs.
          </p>
          {isAuthenticated ? (
            <Link
              to="/cards/new"
              className="inline-flex items-center space-x-2 btn-primary px-6 py-2 text-sm"
            >
              → create new card
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 btn-primary px-6 py-2 text-sm"
            >
              → get started free
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-term-base border-t border-term-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="font-mono text-sm mb-4 md:mb-0">
              <span className="text-term-muted">[</span>
              <span className="text-primary">sc</span>
              <span className="text-term-muted">]</span>
              <span className="ml-2 text-term-subtle">securecard</span>
            </div>
            <p className="text-xs font-mono text-term-muted">
              msc cyber security project &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
