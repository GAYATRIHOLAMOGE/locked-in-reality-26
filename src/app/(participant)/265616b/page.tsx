"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

export default function MainframeBreak() {
    const router = useRouter();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [timerEnded, setTimerEnded] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const id = localStorage.getItem("teamId");
        if (!id) {
            router.push("/pakka-real-login-trust-me");
        } else {
            setTeamId(id);
        }
    }, [router]);

    const { data: globalState, isLoading: globalLoading } = api.global.getState.useQuery(undefined, {
        refetchInterval: 5000,
    });

    const { data: team, refetch: refetchTeam } = api.team.getTeam.useQuery(
        { teamId: teamId ?? "" },
        { enabled: !!teamId }
    );

    const submitMutation = api.admin.submitMainframeBreak.useMutation({
        onSuccess: (data) => {
            setMsg({ type: "ok", text: `SUCCESS: ${data.points} POINTS AWARDED.` });
            refetchTeam();
        },
        onError: (e) => {
            setMsg({ type: "err", text: `ERROR: ${e.message}` });
            refetchTeam();
        }
    });

    useEffect(() => {
        if (globalState && !globalState.isMainframeBreakActive) {
            router.push("/dashboard");
        }
    }, [globalState, router]);

    useEffect(() => {
        if (!globalState?.mainframeBreakStartedAt || !globalState?.mainframeBreakDurationMins) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(globalState.mainframeBreakStartedAt!).getTime();
            const end = start + globalState.mainframeBreakDurationMins * 60 * 1000;
            const diff = end - now;

            if (diff <= 0) {
                setTimerEnded(true);
                setTimeLeft("00:00");
                clearInterval(interval);
            } else {
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [globalState]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamId || !inputValue || submitMutation.isPending || team?.hasSubmittedMainframe) return;
        submitMutation.mutate({ teamId, value: parseInt(inputValue) });
    };

    if (globalLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

    const hasSubmitted = team?.hasSubmittedMainframe || !!msg;

    return (
        <main className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center font-mono">
            {/* Static Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHo5aTl6dWx6ZHdwbGhtN2o5Mm5rYjlpY3F4aG5kYWxscTBtbjZrYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ph0oIVQeuvh0k/giphy.gif')] bg-cover bg-center bg-no-repeat opacity-40" />
            </div>

            <div>
                {!timerEnded ? (
                    <>
                    </>
                ) : (
                    <div className="relative z-10 w-full max-w-xl p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col items-center text-center">
                        <h1 className="text-green-glow-strong text-3xl font-black mb-6 tracking-tighter">TERMINAL RECOGNIZED</h1>

                        {hasSubmitted ? (
                            <div className={`p-6 rounded-lg mb-4 w-full border ${msg?.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                                <h2 className="text-xl font-bold mb-2 uppercase tracking-widest">Access Finalized</h2>
                                {msg ? msg.text : "PROTOCOL_ERROR: ATTEMPT_EXHAUSTED. SYSTEM LOGGED."}
                                <p className="text-[10px] mt-4 opacity-60">SERVER WILL RESTORE SEQUENCE STARTING. DO NOT REFRESH.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="w-full space-y-6">
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-2 text-center">
                                    <p className="text-red-400 text-xs font-bold uppercase animate-pulse">
                                        ⚠️ WARNING: ONLY ONE ATTEMPT PERMITTED ⚠️
                                    </p>
                                </div>
                                <p className="text-green-dim text-sm">INPUT OVERRIDE CODE</p>
                                <input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-3xl text-center text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all no-spinner"
                                    required
                                    disabled={submitMutation.isPending}
                                />
                                <button
                                    type="submit"
                                    disabled={submitMutation.isPending}
                                    className="w-full bg-gray-200/80 text-black font-black py-4 rounded-xl hover:bg-white/80 transition-colors disabled:opacity-50"
                                >
                                    {submitMutation.isPending ? "TRANSMITTING..." : "EXECUTE OVERRIDE"}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            <div className="fixed bottom-8 left-8 text-[10px] text-white/20 tracking-widest text-left">
                STATUS: OVERLOADED<br />
                TEAM_SYNC: {team?.name ?? "..."}<br />
                ALERT_CODE: 0x992B
            </div>
        </main>
    );
}
