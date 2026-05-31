"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import "./login.css";

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

            {/* OAuth buttons hidden as requested */}

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
