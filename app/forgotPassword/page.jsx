"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/components/context/AuthProvider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
   const { resetPassword } = useAuth(); 
const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");

    if (!email) {
      setError("Please enter your email address.");
      setLoading(false); return;
    }

    try {
      
      await resetPassword(email);
      setMessage("Password reset link sent! Please check your email.");

      console.log("Reset link sent to:00000000", email);
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);

      console.log("Reset password process completed for:000000000", email);
    }
  };

  console.log("FotPasswordPage rendered. Current email state:000000000000", email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="invert dark:invert-0" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center mb-4">{message}</p>}

        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-xl bg-background text-foreground"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}