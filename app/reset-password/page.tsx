"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
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
    <motion.div 
      className="login-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="login-header">
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="login-logo cursor-pointer">
            <Image src="/logo.png" alt="Corely" width={32} height={32} style={{ borderRadius: 8 }} />
            <div className="login-logo-text">Corely</div>
          </div>
        </Link>
        <h1 className="login-title">Choose a new password</h1>
        <p className="login-subtitle">
          {success ? "Password reset successfully! Redirecting..." : "Enter your new password below."}
        </p>
      </div>

      {!success && (
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <div className="form-group">
            <label htmlFor="password" className="form-label">New Password</label>
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
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="login-spinner animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="login-page">
      <div className="login-bg-blob blob-1" />
      <div className="login-bg-blob blob-2" />
      <Suspense fallback={<div className="login-card"><Loader2 className="animate-spin" /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
