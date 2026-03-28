"use client";

import type { BilingualViewMode } from "./bilingual-view";

const EXACT_TRANSLATIONS: Record<string, string> = {
  "Provides filesystem access within allowed directories":
    "在允许目录范围内提供文件系统访问能力。",
  "Provides shell command execution in sandboxed environment":
    "在沙盒环境中提供命令行执行能力。",
  "Provides shell command execution within sandboxed environment":
    "在沙盒环境中提供命令行执行能力。",
  "Provides web search capabilities":
    "提供网页搜索能力。",
  "Provides web content fetching capabilities":
    "提供网页内容抓取能力。",
  "Provides image search capabilities":
    "提供图片搜索能力。",
  "Provides browser automation capabilities":
    "提供浏览器自动化能力。",
  "This skill should be used when the user wants to visualize data. It intelligently selects the most suitable chart type from 26 available options, extracts parameters based on detailed specifications, and generates a chart image using a JavaScript script.":
    "该技能用于数据可视化。它会从 26 种图表类型中自动选择最合适的图表，按详细规范提取参数，并通过 JavaScript 脚本生成图表图片。",
};

const PHRASE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/This skill should be used when/gi, "该技能适用于"],
  [/the user wants to/gi, "用户希望"],
  [/visualize data/gi, "进行数据可视化"],
  [/It intelligently selects/gi, "它会智能选择"],
  [/the most suitable chart type/gi, "最合适的图表类型"],
  [/from 26 available options/gi, "（从 26 种可用图表中）"],
  [/extracts parameters/gi, "提取参数"],
  [/based on detailed specifications/gi, "并基于详细规范"],
  [/and generates a chart image/gi, "并生成图表图片"],
  [/using a JavaScript script/gi, "（使用 JavaScript 脚本）"],
  [/Provides filesystem access within allowed directories/gi, "在允许目录范围内提供文件系统访问能力"],
  [/Provides web search capabilities/gi, "提供网页搜索能力"],
  [/Provides web content fetching capabilities/gi, "提供网页内容抓取能力"],
  [/Provides image search capabilities/gi, "提供图片搜索能力"],
  [/Provides shell command execution/gi, "提供命令行执行能力"],
];

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

export function translateDescriptionToZh(rawText: string): string {
  const normalized = normalizeText(rawText);
  if (!normalized) return rawText;

  const exact = EXACT_TRANSLATIONS[normalized];
  if (exact) return exact;

  let translated = normalized;
  for (const [pattern, replacement] of PHRASE_TRANSLATIONS) {
    translated = translated.replace(pattern, replacement);
  }

  if (translated === normalized) {
    return rawText;
  }
  return translated;
}

export function formatDescriptionByMode(
  mode: BilingualViewMode,
  rawText: string,
) {
  const zhText = translateDescriptionToZh(rawText);
  if (mode === "en") return rawText;
  if (mode === "zh") return zhText;
  if (zhText === rawText) return rawText;
  return `${zhText}\n${rawText}`;
}
