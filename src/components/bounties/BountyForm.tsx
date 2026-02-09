import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar as CalendarIcon, Target, DollarSign, Plus, Minus, Briefcase, ListChecks } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, startOfDay } from "date-fns";
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
        bountyType: "development",
        requirements: [""],
        deliverables: [""],
        skills: [""],
        images: [] as string[],
        slashPercent: 25, // Default 25%
    });

    const [openDeadlineDate, setOpenDeadlineDate] = useState<Date>();
    const [openDeadlineTime, setOpenDeadlineTime] = useState("23:59");
    const [judgingDeadlineDate, setJudgingDeadlineDate] = useState<Date>();
    const [judgingDeadlineTime, setJudgingDeadlineTime] = useState("23:59");

    const handleAddField = (field: "requirements" | "deliverables" | "skills") => {
        setFormData({ ...formData, [field]: [...formData[field], ""] });
    };

    const handleRemoveField = (field: "requirements" | "deliverables" | "skills", index: number) => {
        const newList = [...formData[field]];
        newList.splice(index, 1);
        setFormData({ ...formData, [field]: newList });
    };

    const handleFieldChange = (field: "requirements" | "deliverables" | "skills", index: number, value: string) => {
        const newList = [...formData[field]];
        newList[index] = value;
        setFormData({ ...formData, [field]: newList });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!openDeadlineDate || !judgingDeadlineDate) return;

        const [openHours, openMinutes] = openDeadlineTime.split(":");
        const openDateTime = new Date(openDeadlineDate);
        openDateTime.setHours(parseInt(openHours, 10), parseInt(openMinutes, 10));

        const [judgingHours, judgingMinutes] = judgingDeadlineTime.split(":");
        const judgingDateTime = new Date(judgingDeadlineDate);
        judgingDateTime.setHours(parseInt(judgingHours, 10), parseInt(judgingMinutes, 10));

        onSubmit({
            ...formData,
            openDeadline: openDateTime.toISOString(),
            judgingDeadline: judgingDateTime.toISOString(),
            slashPercent: formData.slashPercent * 100, // Convert to basis points (25% -> 2500)
        });
    };

    return (
        <Card className="max-w-4xl mx-auto border border-slate-200 bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-[#0EA885]" />
                    <div>
                        <CardTitle className="text-lg font-black text-slate-900">Create New Bounty</CardTitle>
                        <p className="text-slate-400 text-xs">Set up your task with escrow rewards</p>
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
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission Deadline (Open Phase)</label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 border-slate-200 bg-white justify-start font-normal text-slate-600">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                {openDeadlineDate ? format(openDeadlineDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-slate-200">
                                            <Calendar
                                                mode="single"
                                                selected={openDeadlineDate}
                                                onSelect={setOpenDeadlineDate}
                                                disabled={(date) => date < startOfDay(new Date())}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        value={openDeadlineTime}
                                        onChange={e => setOpenDeadlineTime(e.target.value)}
                                        className="w-28 border-slate-200 bg-white"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400">When submissions close</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Judging Deadline</label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 border-slate-200 bg-white justify-start font-normal text-slate-600">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                {judgingDeadlineDate ? format(judgingDeadlineDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-slate-200">
                                            <Calendar
                                                mode="single"
                                                selected={judgingDeadlineDate}
                                                onSelect={setJudgingDeadlineDate}
                                                disabled={(date) => date < (openDeadlineDate || startOfDay(new Date()))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        value={judgingDeadlineTime}
                                        onChange={e => setJudgingDeadlineTime(e.target.value)}
                                        className="w-28 border-slate-200 bg-white"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400">Must select winner by this date or get slashed</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Slash Penalty ({formData.slashPercent}%)</label>
                                <input
                                    type="range"
                                    min="25"
                                    max="50"
                                    value={formData.slashPercent}
                                    onChange={e => setFormData({ ...formData, slashPercent: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0EA885]"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>25%</span>
                                    <span>50%</span>
                                </div>
                                <p className="text-[10px] text-slate-400">Penalty if you don't select winner on time</p>
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

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isPending || !formData.title || !formData.amount || !openDeadlineDate || !judgingDeadlineDate}
                                className="w-full h-11 bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold uppercase tracking-wider transition-all mt-4"
                            >
                                {isPending ? "Creating Bounty..." : "Launch Bounty"}
                            </Button>

                            {/* Info Box */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <h4 className="text-xs font-bold text-slate-700 mb-2">How it Works</h4>
                                <ul className="text-[10px] text-slate-500 space-y-1">
                                    <li>1. Create bounty with ETH escrow</li>
                                    <li>2. Performers submit work with 1% deposit</li>
                                    <li>3. Select winner before judging deadline</li>
                                    <li>4. If no winner selected, you get slashed</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
