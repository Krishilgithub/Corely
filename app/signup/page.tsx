"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Loader2, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import "../login/login.css";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "#e4e4e7" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#f59e0b" };
  if (score <= 3) return { score: 3, label: "Good", color: "#3b82f6" };
  return { score: 4, label: "Strong", color: "#10b981" };
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !company.trim() || !password.trim()) return;
    if (!tosAccepted) { setError("Please accept the Terms of Service to continue."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      await register(name, company, email, password);
    } catch {
      setError("Something went wrong. Please try again.");
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

      <motion.div
        className="login-card"
        style={{ marginTop: 40, marginBottom: 40 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="login-header">
          <Link href="/" style={{ textDecoration: "none" }}>
            <div className="login-logo cursor-pointer">
              <Image src="/logo.png" alt="Corely" width={32} height={32} style={{ borderRadius: 8 }} />
              <div className="login-logo-text">Corely</div>
            </div>
          </Link>
          <h1 className="login-title">Create your workspace</h1>
          <p className="login-subtitle">Join teams that never lose institutional knowledge</p>
        </div>

        {/* Value Reminder */}
        <div style={{ display: "flex", gap: 20, background: "#fff3ee", borderRadius: 10, padding: "12px 16px", marginBottom: 24 }}>
          {[
            { stat: "14-day", desc: "Free trial" },
            { stat: "∞", desc: "Documents" },
            { stat: "SOC 2", desc: "Compliant" },
          ].map((item) => (
            <div key={item.stat} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#ff6b00" }}>{item.stat}</div>
              <div style={{ fontSize: 11, color: "#92400e", fontWeight: 500 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="login-error-banner" style={{ marginBottom: 16 }}>
              <AlertCircle size={15} /><span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Name + Company side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input id="name" type="text" className="form-input" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="company" className="form-label">Company</label>
              <input id="company" type="text" className="form-input" placeholder="Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} required autoComplete="organization" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Work Email</label>
            <input id="email" type="email" className="form-input" placeholder="jane@acme.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" className="login-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1, height: 4, borderRadius: 100,
                        background: level <= strength.score ? strength.color : "#e4e4e7",
                        transition: "background 0.25s ease",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {strength.score >= 3 && <CheckCircle2 size={11} color={strength.color} />}
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: strength.color }}>{strength.label}</span>
                  {strength.score < 3 && <span style={{ fontSize: 11.5, color: "#a1a1aa" }}>— use uppercase, numbers, symbols</span>}
                </div>
              </div>
            )}
          </div>

          {/* ToS Checkbox */}
          <div className="login-remember-row">
            <label className="login-remember-label" style={{ alignItems: "flex-start", gap: 10 }}>
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => { setTosAccepted(e.target.checked); setError(null); }}
                className="login-checkbox"
                style={{ marginTop: 2 }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                I agree to Corely&apos;s{" "}
                <Link href="/terms" style={{ color: "#ff6b00", textDecoration: "none", fontWeight: 600 }}>Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" style={{ color: "#ff6b00", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting || isLoading || !tosAccepted}
            style={{ background: !tosAccepted ? "#d4d4d8" : "#ff6b00", marginTop: 4 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="login-spinner" />
                Creating workspace…
              </>
            ) : (
              "Start 14-Day Free Trial →"
            )}
          </button>
        </form>

        <div className="login-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
