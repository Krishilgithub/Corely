"use client";

import { useState, Suspense } from "react";
import { Loader2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import CorelyLogo from "@/components/icons/corely-logo";
import "../login/login.css";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <Link href="/" className="auth-brand">
        <span className="auth-logo-tile">
          <CorelyLogo size={32} />
        </span>
        <span className="auth-wordmark">Corely</span>
      </Link>

      <div className="auth-heading">
        <h1 className="auth-title">Choose a new password</h1>
        <p className="auth-subtitle">
          {success ? "Password reset successfully. Redirecting..." : "Enter your new password below."}
        </p>
      </div>

      {!success && (
        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-banner auth-banner--error">
                <span className="auth-banner__icon">
                  <AlertCircle size={14} />
                </span>
                <span className="auth-banner__text">{error}</span>
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">New Password</label>
              <input
                id="password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <span>Reset password</span>
                  <ArrowRight size={16} className="auth-btn__arrow" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-glow" aria-hidden="true" />
      <Link href="/" className="auth-back-link">
        <ArrowLeft size={16} /> Back to Home
      </Link>
      <Suspense
        fallback={
          <div className="auth-shell">
            <div className="auth-card auth-card--loading">
              <Loader2 size={20} className="auth-spinner" />
            </div>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
