import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";

export function AirdropSkeleton() {
    return (
        <Card className="rounded-2xl border border-slate-100 bg-white animate-pulse overflow-hidden">
            <div className="h-40 w-full bg-slate-100" />
            <CardHeader className="p-5 pb-2">
                <div className="h-5 w-3/4 rounded bg-slate-100 mb-2" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-4">
                <div className="space-y-1">
                    <div className="h-1 w-full rounded bg-slate-50" />
                </div>
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-6 w-16 rounded bg-slate-100" />
                        <div className="h-3 w-12 rounded bg-slate-100" />
                    </div>
                    <div className="h-7 w-7 rounded-full bg-slate-100" />
                </div>
            </CardContent>
        </Card>
    );
}

export function AirdropListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <AirdropSkeleton key={i} />
            ))}
        </div>
    );
}
