"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/components/context/AuthProvider";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { updatePassword } = useAuth(); 
  const [showPassword, setShowPassword] = useState(false);
const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false); return;
    }

    try {
      //  calling the updatePassword function from AuthContext directly
      await updatePassword(password);

      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 2000);

      console.log("Password updated successfully for user. Redirecting to dashboard...");

    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }

    console.log("Reset password process completed. Current password state:", password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="invert dark:invert-0" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Enter New Password</h1>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center mb-4">{message}</p>}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
            <input
               type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-xl bg-background text-foreground"
              placeholder="New password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition"
            >
             {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-foreground mb-1">Confirm New Password</label>
            <input
               type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-xl bg-background text-foreground"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition"
            >
             {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}