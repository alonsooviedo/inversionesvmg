"use client";

import { useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(8, 13, 26, 0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div
        className={`w-full ${maxWidth} max-h-[90vh] rounded-2xl flex flex-col`}
        style={{ background: "#111C33", border: "1px solid #1A2744" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 flex-shrink-0"
          style={{ background: "#111C33", borderBottom: "1px solid #1A2744" }}>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted transition-colors"
            style={{ background: "#162040" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E8EDF5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}>
            ✕
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
