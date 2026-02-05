import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar as CalendarIcon, Target, DollarSign, Plus, Minus, Percent, Award, Briefcase, ListChecks } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import { ImageUpload } from "../ui/image-upload";

interface BountyFormProps {
    onSubmit: (data: any) => void;
    isPending: boolean;
}

export function BountyForm({ onSubmit, isPending }: BountyFormProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        amount: "",
        deadline: "",
        slashPercent: 30,
        allowMultipleWinners: false,
        winnerShares: [100],
        bountyType: "development",
        requirements: [""],
        deliverables: [""],
        skills: [""],
        hasOprec: false,
        oprecDeadline: "",
        images: [] as string[],
    });

    const [deadlineDate, setDeadlineDate] = useState<Date>();
    const [deadlineTime, setDeadlineTime] = useState("23:59");
    const [oprecDate, setOprecDate] = useState<Date>();

    const handleAddField = (field: "requirements" | "deliverables" | "skills" | "winnerShares") => {
        if (field === "winnerShares") {
            setFormData({ ...formData, winnerShares: [...formData.winnerShares, 0] });
        } else {
            setFormData({ ...formData, [field]: [...formData[field], ""] });
        }
    };

    const handleRemoveField = (field: "requirements" | "deliverables" | "skills" | "winnerShares", index: number) => {
        const newList = [...formData[field]];
        newList.splice(index, 1);
        setFormData({ ...formData, [field]: newList });
    };

    const handleFieldChange = (field: "requirements" | "deliverables" | "skills", index: number, value: string) => {
        const newList = [...formData[field]];
        newList[index] = value;
        setFormData({ ...formData, [field]: newList });
    };

    const handleShareChange = (index: number, value: number) => {
        const newList = [...formData.winnerShares];
        newList[index] = value;
        setFormData({ ...formData, winnerShares: newList });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deadlineDate) return;

        const [hours, minutes] = deadlineTime.split(":");
        const combinedDateTime = new Date(deadlineDate);
        combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

        onSubmit({
            ...formData,
            deadline: combinedDateTime.toISOString(),
            oprecDeadline: oprecDate ? oprecDate.toISOString() : "",
        });
    };

    return (
        <Card className="max-w-4xl mx-auto border border-slate-200 bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-[#0EA885]" />
                    <div>
                        <CardTitle className="text-lg font-black text-slate-900">Create New Bounty</CardTitle>
                        <p className="text-slate-400 text-xs">Set up your task and escrow rewards</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Basic Info & Lists */}
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Image</label>
                                <ImageUpload
                                    onUpload={(cid) => setFormData({ ...formData, images: cid ? [cid] : [] })}
                                    value={formData.images[0]}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Title</label>
                                <Input
                                    placeholder="e.g. Build a React Dashboard"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="border-slate-200 bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bounty Type</label>
                                <Select
                                    value={formData.bountyType}
                                    onValueChange={(v) => setFormData({ ...formData, bountyType: v })}
                                >
                                    <SelectTrigger className="border-slate-200 bg-white">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="development">Development</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="content">Content</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                <Textarea
                                    placeholder="Describe the task in detail..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="border-slate-200 bg-white resize-none"
                                />
                            </div>

                            {/* Requirements List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requirements</label>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleAddField("requirements")} className="h-6 px-2 text-[#0EA885] text-[10px] font-bold">
                                        + ADD
                                    </Button>
                                </div>
                                {formData.requirements.map((req, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            placeholder="e.g. 3+ years React exp..."
                                            value={req}
                                            onChange={e => handleFieldChange("requirements", idx, e.target.value)}
                                            className="border-slate-200 bg-white"
                                        />
                                        {formData.requirements.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveField("requirements", idx)} className="text-slate-300 hover:text-red-500">
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Deliverables List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target className="w-3.5 h-3.5 text-slate-400" />
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deliverables</label>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleAddField("deliverables")} className="h-6 px-2 text-[#0EA885] text-[10px] font-bold">
                                        + ADD
                                    </Button>
                                </div>
                                {formData.deliverables.map((del, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            placeholder="e.g. GitHub Repo Link..."
                                            value={del}
                                            onChange={e => handleFieldChange("deliverables", idx, e.target.value)}
                                            className="border-slate-200 bg-white"
                                        />
                                        {formData.deliverables.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveField("deliverables", idx)} className="text-slate-300 hover:text-red-500">
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Reward, Deadline & Skills */}
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reward Amount (ETH)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.5"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="pl-10 border-slate-200 bg-white"
                                    />
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
                                                disabled={(date) => date < new Date()}
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

                            {/* Skills List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills</label>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleAddField("skills")} className="h-6 px-2 text-[#0EA885] text-[10px] font-bold">
                                        + ADD
                                    </Button>
                                </div>
                                {formData.skills.map((skill, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            placeholder="e.g. TypeScript, Solidity..."
                                            value={skill}
                                            onChange={e => handleFieldChange("skills", idx, e.target.value)}
                                            className="border-slate-200 bg-white"
                                        />
                                        {formData.skills.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveField("skills", idx)} className="text-slate-300 hover:text-red-500">
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Advanced Options */}
                            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Percent className="w-3.5 h-3.5 text-slate-400" />
                                            <label className="text-xs font-bold text-slate-700">Slash Percent</label>
                                        </div>
                                        <Input
                                            type="number"
                                            value={formData.slashPercent}
                                            onChange={e => setFormData({ ...formData, slashPercent: parseInt(e.target.value) || 0 })}
                                            className="w-16 h-8 text-xs border-slate-200 bg-white"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-3.5 h-3.5 text-slate-400" />
                                            <label className="text-xs font-bold text-slate-700">Multiple Winners</label>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 border-slate-300 text-[#0EA885] focus:ring-[#0EA885]"
                                            checked={formData.allowMultipleWinners}
                                            onChange={e => setFormData({ ...formData, allowMultipleWinners: e.target.checked })}
                                        />
                                    </div>

                                    {formData.allowMultipleWinners && (
                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Winner Shares (%)</label>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => handleAddField("winnerShares")} className="h-5 px-1 text-[#0EA885] text-[9px]">
                                                    + ADD SHARE
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {formData.winnerShares.map((share, idx) => (
                                                    <div key={idx} className="flex gap-1">
                                                        <Input
                                                            type="number"
                                                            value={share}
                                                            onChange={e => handleShareChange(idx, parseInt(e.target.value) || 0)}
                                                            className="h-8 text-xs border-slate-200 bg-white"
                                                        />
                                                        {formData.winnerShares.length > 1 && (
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveField("winnerShares", idx)} className="h-8 w-8 text-slate-300">
                                                                <Minus className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                        <label className="text-xs font-bold text-slate-700">Has Oprec</label>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 border-slate-300 text-[#0EA885] focus:ring-[#0EA885]"
                                            checked={formData.hasOprec}
                                            onChange={e => setFormData({ ...formData, hasOprec: e.target.checked })}
                                        />
                                    </div>
                                    {formData.hasOprec && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full h-8 border-slate-200 bg-white justify-start text-xs font-normal">
                                                    <CalendarIcon className="mr-2 h-3 w-3 text-slate-400" />
                                                    {oprecDate ? format(oprecDate, "PPP") : "Oprec Deadline"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={oprecDate}
                                                    onSelect={setOprecDate}
                                                    disabled={(date) => date < new Date()}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending || !formData.title || !formData.amount || !deadlineDate}
                                className="w-full h-11 bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold uppercase tracking-wider transition-all mt-4"
                            >
                                {isPending ? "Creating Bounty..." : "Launch Bounty"}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
