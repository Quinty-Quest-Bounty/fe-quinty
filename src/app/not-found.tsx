"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Cursor Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 80%)`
        }}
      />

      {/* Grid Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="text-9xl md:text-[12rem] font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500">
            404
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6">
            PAGE NOT FOUND
          </h1>

          <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
      </div>
    </div>
  );
}
