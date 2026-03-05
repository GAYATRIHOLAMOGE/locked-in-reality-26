import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PuzzleCardProps {
    title: string;
    children: React.ReactNode;
}

export function PuzzleCard({ title, children }: PuzzleCardProps) {
    return (
        <div className="relative z-10 w-full max-w-md p-8 bg-slate-950/40 border border-slate-700/50 backdrop-blur-xl shadow-2xl rounded-3xl">
            <div className="mb-6 px-2">
                <div className="items-center gap-4 mb-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-start mb-4 border border-slate-700/70 rounded-full pl-2 pr-3 py-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        {title}
                    </h1>
                </div>
                {children}
            </div>
        </div>
    );
}
