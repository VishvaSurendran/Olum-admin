import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { requestOtp, verifyOtp, onboardCompany, verifyGoogleAuth } from '../services/api';
import styles from './Onboarding.module.css';

/* ─── tiny SVG icons ───────────────────────────── */
const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
  </svg>
);

const IconBot = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

/* ─── Step indicator ───────────────────────────── */
const TOTAL_STEPS = 4;
function StepDots({ current }) {
  return (
    <div className={styles.stepDots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={[
            styles.dot,
            i + 1 === current ? styles.active : '',
            i + 1 < current  ? styles.done   : '',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

/* ─── Feature cards shown on step 1 ───────────── */
const FEATURES = [
  { icon: '🤖', title: 'AI Agent',   desc: 'Trained on your content' },
  { icon: '💬', title: 'Live Chat',  desc: 'Engage visitors instantly' },
  { icon: '📊', title: 'Analytics',  desc: 'Track every conversation' },
];

export default function Onboarding() {
  const navigate  = useNavigate();
  const [step, setStep]       = useState(1);
  const [formData, setFormData] = useState({ url: '', email: '', code: '', name: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const set = (key) => (e) => setFormData((p) => ({ ...p, [key]: e.target.value }));

  /* handlers (unchanged logic) */
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (formData.url) setStep(2);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await requestOtp(formData.email);
      setStep(3);
    } catch { setError('Failed to send verification code. Please try again.'); }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true); setError('');
    try {
      const data = await verifyGoogleAuth(credentialResponse.credential);
      localStorage.setItem('access_token', data.access_token);
      if (data.tenant_id) {
        localStorage.setItem('tenant_id', data.tenant_id);
        navigate('/dashboard');
      } else {
        setStep(4);
      }
    } catch { setError('Google login failed. Please try again.'); }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await verifyOtp(formData.email, formData.code);
      localStorage.setItem('access_token', data.access_token);
      if (data.tenant_id) {
        localStorage.setItem('tenant_id', data.tenant_id);
        navigate('/dashboard');
      } else {
        setStep(4);
      }
    } catch { setError('Invalid or expired code.'); }
    setLoading(false);
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await onboardCompany({ name: formData.name, url: formData.url });
      localStorage.setItem('tenant_id', data.tenant_id);
      localStorage.setItem('tenant_tier', data.tier);
      navigate('/dashboard');
    } catch { setError('Failed to generate bot. Please try again.'); }
    setLoading(false);
  };

  /* copy map */
  const headings = {
    1: 'Transform your website\ninto an AI Agent',
    2: 'Create an account or log in',
    3: 'Check your email',
    4: 'One last detail',
  };
  const subs = {
    1: 'Enter your domain to start training your custom AI agent in seconds.',
    2: 'We use passwordless login. Continue with Google or email.',
    3: `We sent a 6-digit code to ${formData.email || 'your email'}.`,
    4: 'What should we call your workspace?',
  };

  return (
    <div className={styles.pageWrapper}>

      {/* Brand mark */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>✦</div>
        <span className={styles.brandName}>olum<span className={styles.brandDot}>.ai</span></span>
      </div>

      {/* Heading */}
      <div className={styles.headingBlock}>
        <h2 style={{ whiteSpace: 'pre-line' }}>{headings[step]}</h2>
        <p>{subs[step]}</p>
      </div>

      {/* Card */}
      <div className={styles.formContainer}>
        <StepDots current={step} />

        {/* ── Step 1: URL ── */}
        {step === 1 && (
          <>
            {/* <div className={styles.featureCards}>
              {FEATURES.map((f) => (
                <div key={f.title} className={styles.featureCard}>
                  <div className={styles.featureCardIcon}>{f.icon}</div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div> */}

            <form onSubmit={handleUrlSubmit}>
              <div className={`${styles.inputGroup} ${styles.inputHasPrefix}`}>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPrefix}>🌐</span>
                  <input
                    type="url"
                    required
                    placeholder="https://yourcompany.com"
                    className={styles.input}
                    value={formData.url}
                    onChange={set('url')}
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn}>
                Get started &nbsp;
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Auth ── */}
        {step === 2 && (
          <div>
            {/* Custom Google button wrapper — keeps our styling */}
            <button
              type="button"
              className={styles.googleBtn}
              onClick={() => document.querySelector('[data-testid="google-login-button"] div[role="button"]')?.click()}
            >
              <IconGoogle />
              Continue with Google
            </button>

            {/* Hidden real GoogleLogin for the OAuth flow */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login was closed or failed.')}
                useOneTap
              />
            </div>

            <div className={styles.divider}><span>or</span></div>

            <form onSubmit={handleEmailSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className={styles.input}
                  value={formData.email}
                  onChange={set('email')}
                />
              </div>
              {error && <div className={styles.errorText}>{error}</div>}
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Sending code…' : 'Continue with Email'}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 3: OTP ── */}
        {step === 3 && (
          <form onSubmit={handleOtpSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>6-digit code</label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="· · · · · ·"
                className={`${styles.input} ${styles.otpInput}`}
                value={formData.code}
                onChange={set('code')}
              />
            </div>
            {error && <div className={styles.errorText}>{error}</div>}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <p className={styles.helperText}>
              Didn't get it?&nbsp;
              <span className={styles.helperLink} onClick={handleEmailSubmit}>Resend code</span>
            </p>
          </form>
        )}

        {/* ── Step 4: Company name ── */}
        {step === 4 && (
          <form onSubmit={handleFinalize}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Company / Workspace name</label>
              <input
                type="text"
                required
                placeholder="Acme Corp"
                className={styles.input}
                value={formData.name}
                onChange={set('name')}
              />
            </div>
            {error && <div className={styles.errorText}>{error}</div>}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Generating your bot…' : ' Launch Dashboard'}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className={styles.footerNote}>
        By continuing you agree to our{' '}
        <a href="/terms">Terms of Service</a> and{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      {/* Social proof */}
      {/* <div className={styles.socialProof}>
        <span>Join 100,000+ users</span>
        <span>use WELCOME for 50% off</span>
      </div> */}
    </div>
  );
}