"use client";

import { useMemo } from "react";
import { Streamdown } from "streamdown";

import { useI18n } from "@/core/i18n/hooks";

import { aboutMarkdownEn, aboutMarkdownZh } from "./about-content";
import {
  BilingualViewToggle,
  useBilingualViewMode,
} from "./bilingual-view";

export function AboutSettingsPage() {
  const { locale } = useI18n();
  const [viewMode, setViewMode] = useBilingualViewMode(
    locale === "zh-CN" ? "zh" : "en",
  );

  const markdown = useMemo(() => {
    if (viewMode === "zh") return aboutMarkdownZh;
    if (viewMode === "en") return aboutMarkdownEn;
    return `${aboutMarkdownZh}\n\n---\n\n${aboutMarkdownEn}`;
  }, [viewMode]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <BilingualViewToggle mode={viewMode} onChange={setViewMode} />
      </div>
      <Streamdown>{markdown}</Streamdown>
    </div>
  );
}
