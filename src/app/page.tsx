"use client";

import TeamAuth from "@/components/TeamAuth";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm lg:flex flex-col gap-12">
        <div className="text-center space-y-6">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-2xl">
            LOCKED IN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">
              REALITY
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light border-l-2 border-violet-500 pl-6 text-left">
            "The line between the digital and the physical has blurred.
            Can your team decode the truth before time runs out?"
          </p>
        </div>

        <TeamAuth />
      </div>
    </main>
  );
}
