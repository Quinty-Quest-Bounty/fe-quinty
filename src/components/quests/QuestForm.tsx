import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Gift, Calendar as CalendarIcon, Users, Coins } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { ImageUpload } from "../ui/image-upload";

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
    });

    const [deadlineDate, setDeadlineDate] = useState<Date>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deadlineDate) return;
        onSubmit({
            ...formData,
            deadline: deadlineDate.toISOString(),
        });
    };

    return (
        <Card className="max-w-3xl mx-auto border border-slate-200 bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-[#0EA885]" />
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reward / User</label>
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
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full border-slate-200 bg-white justify-start font-normal text-slate-600">
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                            {deadlineDate ? format(deadlineDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-slate-200">
                                        <Calendar
                                            mode="single"
                                            selected={deadlineDate}
                                            onSelect={setDeadlineDate}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-700">Total Escrow</span>
                                    <span className="text-base font-black text-[#0EA885]">
                                        {(parseFloat(formData.perQualifier) || 0) * (formData.maxQualifiers || 0)} ETH
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
