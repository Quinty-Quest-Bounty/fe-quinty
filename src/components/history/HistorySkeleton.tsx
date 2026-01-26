import React from "react";
import { Card, CardContent } from "../ui/card";

export function HistorySkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl p-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 rounded bg-slate-200" />
                            <div className="h-3 w-1/2 rounded bg-slate-200" />
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-slate-200" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
