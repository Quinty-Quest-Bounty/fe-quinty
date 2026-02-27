import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";

export function ReputationSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <Card className="border border-white/60 bg-white/40 backdrop-blur-xl p-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-slate-200" />
                    <div className="space-y-3 flex-1">
                        <div className="h-8 w-48 rounded bg-slate-200" />
                        <div className="h-4 w-32 rounded bg-slate-200" />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border border-white/60 bg-white/40 backdrop-blur-xl p-6">
                        <div className="h-4 w-24 rounded bg-slate-200 mb-4" />
                        <div className="h-8 w-16 rounded bg-slate-200 mb-4" />
                        <div className="h-2 w-full rounded bg-slate-200" />
                    </Card>
                ))}
            </div>

            <Card className="border border-white/60 bg-white/40 backdrop-blur-xl p-8">
                <div className="h-6 w-48 rounded bg-slate-200 mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-slate-200" />
                    ))}
                </div>
            </Card>
        </div>
    );
}
