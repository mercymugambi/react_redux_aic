import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  loginUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectSessionExpired,
  clearError,
  clearSessionExpired,
} from '../redux/authSlice';
import './Login.css';

/* ── Toast Notification Component ── */
function Toast({ type, title, message, onClose }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  useEffect(() => {
    timerRef.current = setTimeout(handleClose, 4000);
    return () => clearTimeout(timerRef.current);
  }, [handleClose]);

  return (
    <div className={`login-toast login-toast--${type} ${exiting ? 'toast-exit' : ''}`}>
      <div className="login-toast-icon">
        {type === 'error' ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="login-toast-body">
        <p className="login-toast-title">{title}</p>
        <p className="login-toast-message">{message}</p>
      </div>
      <button className="login-toast-close" onClick={handleClose} aria-label="Close notification">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="login-toast-progress" />
    </div>
  );
}

/* ── Main Login Component ── */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successLogin, setSuccessLogin] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const sessionExpired = useSelector(selectSessionExpired);

  // Explain the redirect when an expired or revoked token signed the user out
  const [toasts, setToasts] = useState(() =>
    sessionExpired
      ? [{ id: 'session-expired', type: 'error', title: 'Session Expired', message: 'Please sign in again to continue.' }]
      : []
  );

  const emailRef = useRef(null);

  // Focus email field on mount
  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  // Navigate on authentication
  useEffect(() => {
    if (isAuthenticated) {
      setSuccessLogin(true);
      const timer = setTimeout(() => navigate('/admin'), 1200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  // Clear Redux errors on mount
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSessionExpired());
  }, [dispatch]);

  // Show toast on Redux error
  useEffect(() => {
    if (error) {
      addToast('error', 'Sign In Failed', error);
    }
  }, [error]);

  // Show success toast
  useEffect(() => {
    if (successLogin) {
      addToast('success', 'Welcome Back!', 'Redirecting you to the dashboard…');
    }
  }, [successLogin]);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const validateFields = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFieldErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      addToast('error', 'Validation Error', firstError || 'Please fill in all fields correctly.');
      return;
    }

    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (err) {
      // Error is handled via Redux state → useEffect above
    }
  };

  // Clear field error on change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
  };

  return (
    <div className="login-page">
      {/* ── Toast Notifications ── */}
      <div className="login-toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* ════════════ LEFT PANEL — Form ════════════ */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          {/* Back to site */}
          <Link to="/" className="login-back-link">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to website
          </Link>

          {/* Mobile Brand */}
          <div className="login-brand-mobile">
            <div className="login-brand-mobile-icon">
              <img src="/favicon.ico" alt="AIC Kabuku logo" />
            </div>
            <div>
              <div className="login-brand-mobile-name">AIC Kabuku</div>
              <div className="login-brand-mobile-sub">Church Community</div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="login-heading">Welcome Back</h1>
          <p className="login-subheading">
            Sign in to access the AIC Kabuku admin dashboard.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="login-email" className="login-label">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  ref={emailRef}
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="admin@aickabuku.org"
                  className={`login-input${fieldErrors.email ? ' input-error' : ''}`}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && (
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="login-field">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  className={`login-input${fieldErrors.password ? ' input-error' : ''}`}
                  autoComplete="current-password"
                  style={{ paddingRight: '3.25rem' }}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || successLogin}
              className="login-submit-btn"
              id="login-submit"
            >
              {successLogin ? (
                <>
                  <svg style={{ width: 22, height: 22, animation: 'loginSuccessPulse 500ms ease both' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Signed In Successfully
                </>
              ) : loading ? (
                <>
                  <div className="login-spinner" />
                  Signing you in…
                </>
              ) : (
                <>
                  Sign In
                  <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>Admin Access Only</span>
          </div>

          {/* Footer */}
          <p className="login-footer-text">
            Need help? Contact the{' '}
            <Link to="/contact-admin">church administrator</Link>.
          </p>
        </div>
      </div>

      {/* ════════════ RIGHT PANEL — Decorative ════════════ */}
      <div className="login-hero-panel">
        {/* Floating decorative shapes */}
        <div className="login-hero-circle login-hero-circle--1" />
        <div className="login-hero-circle login-hero-circle--2" />

        {/* Wave SVGs */}
        <svg className="login-hero-wave login-hero-wave--top" viewBox="0 0 1440 320" fill="rgba(255,255,255,0.08)">
          <path d="M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,186.7C672,181,768,139,864,138.7C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
        </svg>
        <svg className="login-hero-wave login-hero-wave--bottom" viewBox="0 0 1440 320" fill="rgba(255,255,255,0.05)">
          <path d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,149.3C672,149,768,171,864,181.3C960,192,1056,192,1152,176C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>

        {/* Soft sweeping arcs */}
        <svg className="login-hero-arcs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-10,22 C25,2 55,42 110,12" />
          <path d="M-10,78 C20,48 55,112 110,82" />
          <path d="M68,-10 C45,30 98,58 78,110" />
        </svg>

        {/* Center Content */}
        <div className="login-hero-content">
          {/* Showcase — glass frame holding the photo */}
          <div className="login-hero-showcase">
            <div className="login-hero-glow" />
            <div className="login-hero-frame">
              <img
                className="login-hero-photo"
                src="/assets/Woman_reading_bible.png"
                alt="A woman reading the Holy Bible"
                width="463"
                height="579"
              />
            </div>

            {/* Floating logo badge */}
            <div className="login-hero-badge">
              <img src="/favicon.ico" alt="" />
            </div>

            {/* Floating scripture card */}
            <div className="login-hero-verse">
              <div className="login-hero-verse-icon">
                <svg viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <p className="login-hero-verse-text">“Your word is a lamp to my feet.”</p>
                <p className="login-hero-verse-ref">Psalm 119:105</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
