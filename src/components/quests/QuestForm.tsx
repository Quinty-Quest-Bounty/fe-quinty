import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Gift, Calendar as CalendarIcon, Users, Coins, Tag, Code, Palette, Megaphone, BookOpen, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, startOfDay } from "date-fns";
import { ImageUpload } from "../ui/image-upload";
import { TokenSelector } from "../ui/TokenSelector";
import { ETH_ADDRESS, getTokenInfo } from "../../utils/contracts";

type QuestType = "development" | "design" | "marketing" | "research" | "other";

const QUEST_TYPES: { id: QuestType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "development", label: "Development", icon: <Code className="w-4 h-4" />, color: "border-blue-500 bg-blue-50 text-blue-700" },
    { id: "design", label: "Design", icon: <Palette className="w-4 h-4" />, color: "border-purple-500 bg-purple-50 text-purple-700" },
    { id: "marketing", label: "Marketing", icon: <Megaphone className="w-4 h-4" />, color: "border-orange-500 bg-orange-50 text-orange-700" },
    { id: "research", label: "Research", icon: <BookOpen className="w-4 h-4" />, color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
    { id: "other", label: "Other", icon: <MoreHorizontal className="w-4 h-4" />, color: "border-slate-500 bg-slate-50 text-slate-700" },
];

interface QuestFormProps {
    onSubmit: (data: any) => void;
    isPending: boolean;
}

export function QuestForm({ onSubmit, isPending }: QuestFormProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        perQualifier: "",
        maxQualifiers: 100,
        deadline: "",
        requirements: "",
        imageUrl: "",
        questType: "other" as QuestType,
        token: ETH_ADDRESS,
    });

    const [deadlineDate, setDeadlineDate] = useState<Date>();
    const [deadlineTime, setDeadlineTime] = useState("23:59");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deadlineDate) return;

        const [hours, minutes] = deadlineTime.split(":");
        const deadlineDateTime = new Date(deadlineDate);
        deadlineDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

        onSubmit({
            ...formData,
            deadline: deadlineDateTime.toISOString(),
            token: formData.token,
        });
    };

    return (
        <Card className="max-w-3xl mx-auto border border-slate-200 bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black text-slate-900">Create New Quest</CardTitle>
                        <p className="text-slate-400 text-xs">Launch a reward campaign for your community</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Image</label>
                                <ImageUpload
                                    onUpload={(cid) => setFormData({ ...formData, imageUrl: cid ? `ipfs://${cid}` : "" })}
                                    value={formData.imageUrl}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quest Title</label>
                                <Input
                                    placeholder="e.g. Follow us on X and Join Discord"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="border-slate-200 bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag className="w-3 h-3" />
                                    Category
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {QUEST_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, questType: type.id })}
                                            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold border-2 transition-all ${
                                                formData.questType === type.id
                                                    ? type.color
                                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                            }`}
                                        >
                                            {type.icon}
                                            <span className="truncate">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                <Textarea
                                    placeholder="What is this quest about?"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="border-slate-200 bg-white resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requirements</label>
                                <Textarea
                                    placeholder="1. Follow @QuintyLabs\n2. Join Discord..."
                                    rows={4}
                                    value={formData.requirements}
                                    onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                    className="border-slate-200 bg-white resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Token</label>
                                <TokenSelector
                                    value={formData.token}
                                    onChange={(v) => setFormData({ ...formData, token: v })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Reward / User ({getTokenInfo(formData.token).symbol})
                                    </label>
                                    <div className="relative">
                                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input
                                            type="number"
                                            step="0.001"
                                            placeholder="0.01"
                                            value={formData.perQualifier}
                                            onChange={e => setFormData({ ...formData, perQualifier: e.target.value })}
                                            className="pl-10 border-slate-200 bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Winners</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input
                                            type="number"
                                            placeholder="100"
                                            value={formData.maxQualifiers}
                                            onChange={e => setFormData({ ...formData, maxQualifiers: parseInt(e.target.value) || 0 })}
                                            className="pl-10 border-slate-200 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deadline</label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 border-slate-200 bg-white justify-start font-normal text-slate-600">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                {deadlineDate ? format(deadlineDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-slate-200">
                                            <Calendar
                                                mode="single"
                                                selected={deadlineDate}
                                                onSelect={setDeadlineDate}
                                                disabled={(date) => date < startOfDay(new Date())}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        value={deadlineTime}
                                        onChange={e => setDeadlineTime(e.target.value)}
                                        className="w-28 border-slate-200 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-700">Total Escrow</span>
                                    <span className="text-base font-black text-[#0EA885]">
                                        {(parseFloat(formData.perQualifier) || 0) * (formData.maxQualifiers || 0)} {getTokenInfo(formData.token).symbol}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">This amount will be locked in the contract until distribution.</p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending || !formData.title || !formData.perQualifier || !deadlineDate}
                                className="w-full h-11 bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold uppercase tracking-wider transition-all mt-4"
                            >
                                {isPending ? "Launching Quest..." : "Launch Quest"}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
