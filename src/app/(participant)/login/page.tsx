"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-grid flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900/10 backdrop-blur-xs border border-green-dark rounded-2xl p-8 shadow-2xl">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-4">
              <Lock className="text-slate-400" size={28} />
            </div>
          </div>

          <form className="flex flex-col justify-items-center space-y-5 px-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                Username
              </label>
              <input
                type="text"
                className="w-full bg-[#111111] border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-600 placeholder:text-slate-600 transition"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-[#111111] border border-[#333] text-white rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-slate-600 placeholder:text-slate-600 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-fit self-center bg-slate-700 hover:bg-slate-600 text-white py-3 px-12 my-3 rounded-lg text-lg font-bold transition-colors"
            >
              Login
            </button>
          </form>

          {/* Footer text with hidden link */}
          <p className="mt-2 text-center text-xs text-slate-400">
            Having trouble?{" "}
            <Link
              href="/pakka-real-login-trust-me"
              className="text-slate-900/30 no-underline select-none"
              tabIndex={-1}
              aria-hidden="true"
            >
              Contact support
            </Link>{" "}
            or reach out to organisers
          </p>
        </div>
      </div>
    </main>
  );
}
