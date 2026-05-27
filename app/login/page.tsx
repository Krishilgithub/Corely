"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Loader2 } from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const { login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    await login(email);
  };

  return (
    <div className="login-page">
      <div className="login-bg-blob blob-1" />
      <div className="login-bg-blob blob-2" />

      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">C</div>
            <div className="login-logo-text">Corely</div>
          </div>
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
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              defaultValue="password123" // Pre-filled for MVP demo purposes
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

        <div className="login-footer">
          Don&apos;t have an account? <a href="#">Request access</a>
        </div>
      </motion.div>
    </div>
  );
}
