"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm prose-zinc max-w-none",
        "prose-headings:font-semibold prose-headings:text-gray-900",
        "prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2",
        "prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1",
        "prose-p:text-gray-700 prose-p:leading-relaxed",
        "prose-li:text-gray-700",
        "prose-strong:text-gray-900",
        "prose-code:text-[#0EA885] prose-code:bg-gray-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
        "prose-a:text-[#0EA885] prose-a:no-underline hover:prose-a:underline",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
