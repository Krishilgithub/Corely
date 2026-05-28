"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import "./login.css";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" fill="#18181b" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // We always show success regardless of user existence for security
      setResetSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Link href="/" className="login-back-btn">
        <ArrowLeft size={16} /> Back to Home
      </Link>
      <div className="login-bg-blob blob-1" />
      <div className="login-bg-blob blob-2" />

      <AnimatePresence mode="wait">
        {!isForgotPassword ? (
          <motion.div 
            key="login"
            className="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="login-header">
              <Link href="/" style={{ textDecoration: "none" }}>
                <div className="login-logo cursor-pointer">
                  <Image src="/logo.png" alt="Corely" width={32} height={32} style={{ borderRadius: 8 }} />
                  <div className="login-logo-text">Corely</div>
                </div>
              </Link>
              <h1 className="login-title">Welcome back</h1>
              <p className="login-subtitle">Sign in to your enterprise intelligence layer</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Work Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="password" className="form-label">Password</label>
                  <button type="button" className="login-forgot-btn" onClick={() => setIsForgotPassword(true)}>
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="login-btn"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  "Sign in to workspace"
                )}
              </button>
            </form>

            <div className="login-divider">
              <span className="login-divider-text">Or continue with</span>
            </div>

            <div className="login-oauth-group">
              <button className="login-oauth-btn" type="button" onClick={() => alert("SSO integration coming soon.")}>
                <GoogleIcon /> Google
              </button>
              <button className="login-oauth-btn" type="button" onClick={() => alert("SSO integration coming soon.")}>
                <GithubIcon /> GitHub
              </button>
            </div>

            <div className="login-footer">
              Don&apos;t have an account? <Link href="/signup">Sign up</Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="forgot"
            className="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="login-header">
              <div className="login-logo cursor-pointer" onClick={() => { setIsForgotPassword(false); setResetSent(false); }}>
                <Image src="/logo.png" alt="Corely" width={32} height={32} style={{ borderRadius: 8 }} />
                <div className="login-logo-text">Corely</div>
              </div>
              <h1 className="login-title">Reset password</h1>
              <p className="login-subtitle">
                {resetSent 
                  ? "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder." 
                  : "Enter your email address and we'll send you a link to reset your password."}
              </p>
            </div>

            {!resetSent ? (
              <form className="login-form" onSubmit={handleResetSubmit}>
                <div className="form-group">
                  <label htmlFor="reset-email" className="form-label">Email address</label>
                  <input
                    id="reset-email"
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="login-btn" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="login-spinner animate-spin" /> : "Send reset link"}
                </button>
              </form>
            ) : (
              <div className="login-form">
                <button type="button" className="login-btn" onClick={() => { setIsForgotPassword(false); setResetSent(false); }}>
                  Back to login
                </button>
              </div>
            )}
            
            {!resetSent && (
              <div className="login-footer">
                Remember your password? <button type="button" className="login-text-btn" onClick={() => setIsForgotPassword(false)}>Log in</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
