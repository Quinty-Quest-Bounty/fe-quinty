"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadToIpfs } from "../../utils/ipfs";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    onUpload: (cid: string) => void;
    value?: string;
    className?: string;
}

export function ImageUpload({ onUpload, value, className }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value ? `https://ipfs.io/ipfs/${value.replace("ipfs://", "")}` : null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setIsUploading(true);

        try {
            const cid = await uploadToIpfs(file);
            onUpload(cid);
        } catch (error) {
            console.error("Upload failed:", error);
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"]
        },
        maxFiles: 1,
        multiple: false
    });

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onUpload("");
    };

    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 min-h-[160px] flex flex-col items-center justify-center gap-2",
                isDragActive ? "border-[#0EA885] bg-[#0EA885]/5" : "border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50",
                preview ? "border-solid" : "border-dashed",
                className
            )}
        >
            <input {...getInputProps()} />

            {preview ? (
                <>
                    <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-bold">Change Image</p>
                    </div>
                    <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-sm text-slate-500 hover:text-red-500 transition-colors z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                    <div className={cn(
                        "p-3 rounded-full bg-white shadow-sm transition-transform duration-300",
                        isDragActive ? "scale-110 text-[#0EA885]" : "text-slate-400 group-hover:scale-110"
                    )}>
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-600">
                            {isDragActive ? "Drop it here!" : "Upload Cover Image"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Drag & drop or click to browse
                        </p>
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#0EA885]" />
                        <p className="text-[10px] font-bold text-[#0EA885] uppercase tracking-widest">Uploading to IPFS...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
