"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Loader2, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import CorelyLogo from "@/components/icons/corely-logo";
import "./login.css";

// Short fade when switching between the sign-in and reset views.
// AnimatePresence uses initial={false}, so nothing animates on first page load.
const viewMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

const bannerMotion = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResetSent(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" aria-hidden="true" />
      <Link href="/" className="auth-back-link">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <AnimatePresence mode="wait" initial={false}>
        {!isForgotPassword ? (
          <motion.div key="login" className="auth-shell" {...viewMotion}>
            <Link href="/" className="auth-brand">
              <span className="auth-logo-tile">
                <CorelyLogo size={32} />
              </span>
              <span className="auth-wordmark">Corely</span>
            </Link>

            <div className="auth-heading">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your enterprise workspace</p>
            </div>

            <div className="auth-card">
              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div {...bannerMotion} className="auth-banner auth-banner--error">
                    <span className="auth-banner__icon">
                      <AlertCircle size={14} />
                    </span>
                    <span className="auth-banner__text">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">Work Email</label>
                  <input
                    id="email"
                    type="email"
                    className="auth-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="auth-field">
                  <div className="auth-label-row">
                    <label htmlFor="password" className="auth-label">Password</label>
                    <button type="button" className="auth-link-btn" onClick={() => setIsForgotPassword(true)}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="auth-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="auth-input auth-input--with-toggle"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span>Remember me for 30 days</span>
                </label>

                <button
                  type="submit"
                  className="auth-btn"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="auth-spinner" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to workspace</span>
                      <ArrowRight size={16} className="auth-btn__arrow" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="auth-footer">
              Don&apos;t have an account? <Link href="/signup">Create account</Link>
            </p>
          </motion.div>
        ) : (
          <motion.div key="forgot" className="auth-shell" {...viewMotion}>
            <div className="auth-brand" onClick={() => { setIsForgotPassword(false); setResetSent(false); }}>
              <span className="auth-logo-tile">
                <CorelyLogo size={32} />
              </span>
              <span className="auth-wordmark">Corely</span>
            </div>

            <div className="auth-heading">
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-subtitle">
                {resetSent
                  ? "Check your inbox for a reset link."
                  : "Enter your work email and we'll send you a reset link."}
              </p>
            </div>

            {resetSent ? (
              <div className="auth-card">
                <div className="auth-banner auth-banner--success">
                  <span className="auth-banner__icon">
                    <CheckCircle size={14} />
                  </span>
                  <span className="auth-banner__text">Reset link sent to <strong>{email}</strong></span>
                </div>
                <button
                  type="button"
                  className="auth-btn auth-btn--back"
                  onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                >
                  <ArrowLeft size={16} className="auth-btn__arrow" />
                  <span>Back to sign in</span>
                </button>
              </div>
            ) : (
              <>
                <div className="auth-card">
                  <AnimatePresence>
                    {error && (
                      <motion.div {...bannerMotion} className="auth-banner auth-banner--error">
                        <span className="auth-banner__icon">
                          <AlertCircle size={14} />
                        </span>
                        <span className="auth-banner__text">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <form className="auth-form" onSubmit={handleResetSubmit}>
                    <div className="auth-field">
                      <label htmlFor="reset-email" className="auth-label">Work Email</label>
                      <input
                        id="reset-email"
                        type="email"
                        className="auth-input"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="auth-btn" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 size={16} className="auth-spinner" />
                      ) : (
                        <>
                          <span>Send reset link</span>
                          <ArrowRight size={16} className="auth-btn__arrow" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
                <p className="auth-footer">
                  Remember your password?{" "}
                  <button type="button" className="auth-footer-btn" onClick={() => setIsForgotPassword(false)}>Sign in</button>
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
