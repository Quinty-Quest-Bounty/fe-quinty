import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SafariProps {
  url?: string;
  src?: string;
  className?: string;
  children?: ReactNode;
}

export function Safari({ url = "quinty.xyz", src, className, children }: SafariProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl",
        className
      )}
    >
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
        {/* Traffic Lights */}
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>

        {/* URL Bar */}
        <div className="ml-4 flex-1">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="text-sm text-gray-600">{url}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-white">
        {src ? (
          <img
            src={src}
            alt="Safari browser content"
            className="h-full w-full object-cover object-top"
          />
        ) : children ? (
          children
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <div className="mb-4 text-6xl">🌐</div>
              <p className="text-gray-400">No content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
