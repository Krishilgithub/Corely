"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Loader2, ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import CorelyLogo from "@/components/icons/corely-logo";
import "../login/login.css";

// Colours are status tokens, so the meter works in light and dark mode.
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "var(--hairline)" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "var(--error)" };
  if (score <= 2) return { score: 2, label: "Fair", color: "var(--warning)" };
  if (score <= 3) return { score: 3, label: "Good", color: "var(--success)" };
  return { score: 4, label: "Strong", color: "var(--success)" };
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
    <div className="auth-page">
      <div className="auth-glow" aria-hidden="true" />
      <Link href="/" className="auth-back-link">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="auth-shell">
        <Link href="/" className="auth-brand">
          <span className="auth-logo-tile">
            <CorelyLogo size={32} />
          </span>
          <span className="auth-wordmark">Corely</span>
        </Link>

        <div className="auth-heading">
          <h1 className="auth-title">Create your workspace</h1>
          <p className="auth-subtitle">Join teams that never lose institutional knowledge</p>
        </div>

        <div className="auth-card">
          {/* Value Reminder */}
          <div className="auth-perks">
            {[
              { stat: "14-day", desc: "Free trial" },
              { stat: "∞", desc: "Documents" },
              { stat: "SOC 2", desc: "Compliant" },
            ].map((item) => (
              <div key={item.stat} className="auth-perk">
                <div className="auth-perk__stat">{item.stat}</div>
                <div className="auth-perk__desc">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="auth-banner auth-banner--error"
              >
                <span className="auth-banner__icon">
                  <AlertCircle size={14} />
                </span>
                <span className="auth-banner__text">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name + Company side by side */}
            <div className="auth-grid-2">
              <div className="auth-field">
                <label htmlFor="name" className="auth-label">Full Name</label>
                <input id="name" type="text" className="auth-input" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </div>
              <div className="auth-field">
                <label htmlFor="company" className="auth-label">Company</label>
                <input id="company" type="text" className="auth-input" placeholder="Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} required autoComplete="organization" />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Work Email</label>
              <input id="email" type="email" className="auth-input" placeholder="jane@acme.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} required autoComplete="email" />
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input auth-input--with-toggle"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="auth-strength">
                  <div className="auth-strength__bars">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="auth-strength__bar"
                        style={level <= strength.score ? { background: strength.color } : undefined}
                      />
                    ))}
                  </div>
                  <div className="auth-strength__meta">
                    {strength.score >= 3 && <CheckCircle2 size={12} style={{ color: strength.color }} />}
                    <span className="auth-strength__label" style={{ color: strength.color }}>{strength.label}</span>
                    {strength.score < 3 && <span className="auth-strength__hint">— use uppercase, numbers, symbols</span>}
                  </div>
                </div>
              )}
            </div>

            {/* ToS Checkbox */}
            <label className="auth-check auth-check--top">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => { setTosAccepted(e.target.checked); setError(null); }}
                className="auth-checkbox"
              />
              <span>
                I agree to Corely&apos;s{" "}
                <Link href="/terms" className="auth-inline-link">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="auth-inline-link">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              className="auth-btn"
              disabled={isSubmitting || isLoading || !tosAccepted}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Creating workspace…</span>
                </>
              ) : (
                <>
                  <span>Start 14-day free trial</span>
                  <ArrowRight size={16} className="auth-btn__arrow" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
