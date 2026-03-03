"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function RealLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = api.team.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("teamId", data.id);
      localStorage.setItem("teamName", data.name);
      router.push("/dashboard");
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ name, password });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <Image
        src="/dark-room.png"
        alt="Background"
        fill
        priority
        quality={100}
        className="object-cover z-0 opacity-60"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-row justify-center mb-8 shadow-4xl shadow-black relative group">
          <Image src="/logo.png" alt="Logo" width={500} height={200} className="animate-glitch drop-shadow-[0_0_15px_rgba(84,254,85,0.3)] group-hover:drop-shadow-[0_0_25px_rgba(84,254,85,0.6)] transition-all" />
        </div>

        <div className="bg-black/60 backdrop-blur-xs border-2 border-green-dim/80 rounded-2xl p-8 font-mono">
          <form onSubmit={handleSubmit} className="space-y-4 text-green-500">
            <div className="mb-6 opacity-80 text-sm sm:text-base">
              <div>{">"} INITIATING SECURE CONNECTION...</div>
              <div>{">"} SYSTEM READY.</div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-green-500 whitespace-nowrap">
                {">"} TEAM_ID:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-green-400 focus:ring-0 placeholder:text-green-900 caret-green-500"
                placeholder="_"
                required
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-green-500 whitespace-nowrap">
                {">"} AUTH_KEY:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-green-400 focus:ring-0 placeholder:text-green-900 caret-green-500"
                placeholder="_"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 mt-4">
                {">"} ERROR: {error}
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="text-green-500 hover:text-green-400 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 -ml-3 rounded transition-colors flex items-center gap-2 outline-none w-fit group"
              >
                {loginMutation.isPending ? (
                  <>
                    <span>{">"} AUTHENTICATING <Loader2 className="inline animate-spin ml-1" size={14} /></span>
                  </>
                ) : (
                  <>
                    <span className="group-hover:translate-x-1 transition-transform">{">"}</span>
                    <span>./execute_login.sh</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
