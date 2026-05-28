"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import "../login/login.css"; // Reuse the login styling

export default function SignupPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !company.trim()) return;

    setIsSubmitting(true);
    // In this prototype, we seamlessly log the user in immediately after "signup"
    await login(email);
  };

  return (
    <div className="login-page">
      <div className="login-bg-blob blob-1" />
      <div className="login-bg-blob blob-2" />

      <motion.div 
        className="login-card"
        style={{ marginTop: "40px", marginBottom: "40px" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="login-header">
          <Link href="/" style={{ textDecoration: "none" }}>
            <div className="login-logo cursor-pointer">
              <div className="login-logo-icon">C</div>
              <div className="login-logo-text">Corely</div>
            </div>
          </Link>
          <h1 className="login-title">Create your workspace</h1>
          <p className="login-subtitle">Start building your institutional memory engine today</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="company" className="form-label">Company Name</label>
            <input
              id="company"
              type="text"
              className="form-input"
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Work Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="jane@acme.com"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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
                Creating workspace...
              </>
            ) : (
              "Start 14-Day Free Trial"
            )}
          </button>
        </form>

        <div className="login-footer">
          Already have an account? <Link href="/login">Log in here</Link>
        </div>
      </motion.div>
    </div>
  );
}
