"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type BilingualViewMode = "zh" | "en" | "both";

const STORAGE_KEY = "deerflow.settings.bilingual-view-mode.v1";

export function useBilingualViewMode(defaultMode: BilingualViewMode = "both") {
  const [mode, setMode] = useState<BilingualViewMode>(defaultMode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "en" || stored === "both") {
      setMode(stored);
      return;
    }
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return [mode, setMode] as const;
}

export function formatBilingualText(
  mode: BilingualViewMode,
  zhText: string,
  enText: string,
) {
  if (mode === "zh") return zhText;
  if (mode === "en") return enText;
  return `${zhText} / ${enText}`;
}

export function BilingualViewToggle({
  mode,
  onChange,
  className,
}: {
  mode: BilingualViewMode;
  onChange: (mode: BilingualViewMode) => void;
  className?: string;
}) {
  const options: { value: BilingualViewMode; label: string }[] = [
    { value: "zh", label: "中文" },
    { value: "en", label: "English" },
    { value: "both", label: "双语" },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs transition",
            mode === option.value
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
