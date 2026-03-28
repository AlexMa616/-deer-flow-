"use client";
import {
  BadgeCheck,
  Heart,
  Leaf,
  Lock,
  Palette,
  RefreshCw,
  Sparkles,
  Sun,
  User,
  Snowflake,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { AlexMark } from "@/components/brand/alex-mark";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { HTTPError, requestJSON } from "@/core/api";
import { setAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: "admin" | "user";
  };
}

type ThemeKey =
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | "newYear"
  | "valentine"
  | "national";

interface ThemeConfig {
  name: string;
  subtitle: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  hero: string;
  background: string;
  orbA: string;
  orbB: string;
  grid: string;
  shine: [string, string, string];
  icon: React.ReactNode;
}

type VisualMode = "tech" | "gemini" | "ocean";

interface VisualModeConfig {
  label: string;
  subtitle: string;
  heroTint: string;
  containerClass: string;
  cardClass: string;
  fieldClass: string;
}

interface DoodlePalette {
  name: string;
  colors: [string, string, string];
}

interface DoodleVariant {
  name: string;
  paths: [string, string];
}

interface DoodleShape {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  opacity: number;
  fill: string;
}

interface DoodleDot {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
}

interface DailyDoodle {
  name: string;
  palette: DoodlePalette;
  variant: DoodleVariant;
  dots: DoodleDot[];
  bars: DoodleShape[];
  colors: string[];
  strokeWidth: number;
  thinStroke: number;
  dash: string;
  offsetX: number;
  offsetY: number;
  gradientId: string;
}

interface SpecialEvent {
  label: string;
  theme: ThemeKey;
  doodleName: string;
  icon: React.ReactNode;
  imageUrl: string;
  palette?: DoodlePalette;
  variant?: DoodleVariant;
}

interface DatedEvent extends SpecialEvent {
  monthDay: string;
}

interface ImageEntry {
  name: string;
  url: string;
}

interface ThemeImageMeta {
  imageUrl: string;
  title?: string;
  provider?: string;
  license?: string;
  attribution?: string;
  sourceUrl?: string;
  query?: string;
  from?: "openverse" | "fallback";
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  spring: {
    name: "霓光新绿",
    subtitle: "清透生长",
    accent: "#00f5d4",
    accentStrong: "#00c2ff",
    accentSoft: "rgba(0,245,212,0.35)",
    hero: "linear-gradient(120deg, rgba(0,245,212,0.75), rgba(0,194,255,0.55), rgba(124,58,237,0.45))",
    background:
      "radial-gradient(circle at 12% 16%, rgba(0,245,212,0.35), transparent 55%), radial-gradient(circle at 78% 12%, rgba(0,194,255,0.35), transparent 58%), linear-gradient(180deg, #080b16, #0b1326 55%, #0c142b)",
    orbA: "rgba(0,245,212,0.45)",
    orbB: "rgba(0,194,255,0.4)",
    grid: "rgb(0,245,212)",
    shine: ["#00f5d4", "#00c2ff", "#7c3aed"],
    icon: <Leaf className="h-3.5 w-3.5" />,
  },
  summer: {
    name: "量子海蓝",
    subtitle: "清爽能量",
    accent: "#22d3ee",
    accentStrong: "#00a6ff",
    accentSoft: "rgba(34,211,238,0.34)",
    hero: "linear-gradient(120deg, rgba(34,211,238,0.75), rgba(0,166,255,0.55), rgba(56,189,248,0.45))",
    background:
      "radial-gradient(circle at 15% 14%, rgba(34,211,238,0.35), transparent 55%), radial-gradient(circle at 82% 10%, rgba(0,166,255,0.32), transparent 58%), linear-gradient(180deg, #070b16, #0b1426 55%, #0d162c)",
    orbA: "rgba(34,211,238,0.42)",
    orbB: "rgba(0,166,255,0.36)",
    grid: "rgb(34,211,238)",
    shine: ["#22d3ee", "#00a6ff", "#38bdf8"],
    icon: <Sun className="h-3.5 w-3.5" />,
  },
  autumn: {
    name: "琥珀电弧",
    subtitle: "沉稳跃迁",
    accent: "#ffb020",
    accentStrong: "#ff7a00",
    accentSoft: "rgba(255,176,32,0.34)",
    hero: "linear-gradient(120deg, rgba(255,176,32,0.75), rgba(255,122,0,0.55), rgba(244,63,94,0.45))",
    background:
      "radial-gradient(circle at 14% 18%, rgba(255,176,32,0.35), transparent 55%), radial-gradient(circle at 80% 10%, rgba(255,122,0,0.32), transparent 55%), linear-gradient(180deg, #0a0b14, #1a1020 55%, #1d0e1c)",
    orbA: "rgba(255,176,32,0.4)",
    orbB: "rgba(255,122,0,0.36)",
    grid: "rgb(255,176,32)",
    shine: ["#ffb020", "#ff7a00", "#f43f5e"],
    icon: <Leaf className="h-3.5 w-3.5" />,
  },
  winter: {
    name: "超频紫辉",
    subtitle: "澄澈秩序",
    accent: "#7c3aed",
    accentStrong: "#4f46e5",
    accentSoft: "rgba(124,58,237,0.34)",
    hero: "linear-gradient(120deg, rgba(124,58,237,0.75), rgba(79,70,229,0.55), rgba(14,165,233,0.45))",
    background:
      "radial-gradient(circle at 16% 12%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(circle at 78% 16%, rgba(14,165,233,0.32), transparent 58%), linear-gradient(180deg, #07090f, #0b1220 55%, #0b1326)",
    orbA: "rgba(124,58,237,0.42)",
    orbB: "rgba(14,165,233,0.34)",
    grid: "rgb(124,58,237)",
    shine: ["#7c3aed", "#4f46e5", "#38bdf8"],
    icon: <Snowflake className="h-3.5 w-3.5" />,
  },
  newYear: {
    name: "量子金辉",
    subtitle: "焕新祝福",
    accent: "#ffd400",
    accentStrong: "#ff9f0a",
    accentSoft: "rgba(255,212,0,0.32)",
    hero: "linear-gradient(120deg, rgba(255,212,0,0.75), rgba(255,159,10,0.55), rgba(56,189,248,0.4))",
    background:
      "radial-gradient(circle at 12% 14%, rgba(255,212,0,0.35), transparent 55%), radial-gradient(circle at 82% 12%, rgba(56,189,248,0.3), transparent 58%), linear-gradient(180deg, #0b0b12, #1a1320 55%, #18111f)",
    orbA: "rgba(255,212,0,0.42)",
    orbB: "rgba(56,189,248,0.32)",
    grid: "rgb(255,212,0)",
    shine: ["#ffd400", "#ff9f0a", "#38bdf8"],
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  valentine: {
    name: "玫瑰磁场",
    subtitle: "温柔链接",
    accent: "#ff2d7a",
    accentStrong: "#ff4fd8",
    accentSoft: "rgba(255,45,122,0.32)",
    hero: "linear-gradient(120deg, rgba(255,45,122,0.75), rgba(255,79,216,0.55), rgba(99,102,241,0.4))",
    background:
      "radial-gradient(circle at 14% 12%, rgba(255,45,122,0.35), transparent 55%), radial-gradient(circle at 80% 10%, rgba(255,79,216,0.32), transparent 58%), linear-gradient(180deg, #0c0a14, #1a0f26 55%, #1b0c22)",
    orbA: "rgba(255,45,122,0.42)",
    orbB: "rgba(99,102,241,0.32)",
    grid: "rgb(255,45,122)",
    shine: ["#ff2d7a", "#ff4fd8", "#6366f1"],
    icon: <Heart className="h-3.5 w-3.5" />,
  },
  national: {
    name: "赤焰信标",
    subtitle: "荣耀传承",
    accent: "#ff3b30",
    accentStrong: "#ff8c00",
    accentSoft: "rgba(255,59,48,0.32)",
    hero: "linear-gradient(120deg, rgba(255,59,48,0.75), rgba(255,140,0,0.55), rgba(255,212,0,0.4))",
    background:
      "radial-gradient(circle at 12% 14%, rgba(255,59,48,0.35), transparent 55%), radial-gradient(circle at 80% 12%, rgba(255,212,0,0.32), transparent 58%), linear-gradient(180deg, #0c0a10, #1f0d0d 55%, #1b0b0b)",
    orbA: "rgba(255,59,48,0.42)",
    orbB: "rgba(255,212,0,0.32)",
    grid: "rgb(255,59,48)",
    shine: ["#ff3b30", "#ff8c00", "#ffd400"],
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
};

const VISUAL_MODES: Record<VisualMode, VisualModeConfig> = {
  tech: {
    label: "智能",
    subtitle: "科技炫彩",
    heroTint:
      "radial-gradient(circle at 14% 10%, rgba(34,211,238,0.24), transparent 42%), radial-gradient(circle at 82% 12%, rgba(99,102,241,0.2), transparent 45%)",
    containerClass:
      "bg-[#050914] text-slate-100 selection:bg-cyan-300/40",
    cardClass:
      "border-cyan-200/20 bg-[#06142b]/88",
    fieldClass:
      "border-cyan-200/20 bg-slate-900/60 text-slate-100 placeholder:text-slate-400 focus:bg-slate-900/80",
  },
  gemini: {
    label: "简约",
    subtitle: "轻奢极简",
    heroTint:
      "radial-gradient(circle at 12% 10%, rgba(66,133,244,0.19), transparent 44%), radial-gradient(circle at 82% 12%, rgba(168,85,247,0.14), transparent 46%), radial-gradient(circle at 52% 0%, rgba(34,211,238,0.1), transparent 38%)",
    containerClass:
      "bg-[#f7f9ff] text-slate-900 selection:bg-sky-200/60",
    cardClass:
      "border-white/75 bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(246,249,255,0.92))]",
    fieldClass:
      "border-slate-200/90 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:bg-white",
  },
  ocean: {
    label: "清新",
    subtitle: "蓝海清新",
    heroTint:
      "radial-gradient(circle at 16% 8%, rgba(34,211,238,0.2), transparent 44%), radial-gradient(circle at 82% 10%, rgba(56,189,248,0.18), transparent 44%)",
    containerClass:
      "bg-[#eef8ff] text-slate-900 selection:bg-cyan-200/60",
    cardClass:
      "border-cyan-100/90 bg-white/84",
    fieldClass:
      "border-cyan-100 bg-white/85 text-slate-900 placeholder:text-slate-400 focus:bg-white",
  },
};

const LOGIN_THEME_MODE_STORAGE_KEY = "deerflow.login.visual-mode.v2";
const THEME_IMAGE_CACHE_PREFIX = "deerflow.login.theme-image.v6";

const getStoredVisualMode = (): VisualMode | null => {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(LOGIN_THEME_MODE_STORAGE_KEY);
  if (saved === "tech" || saved === "gemini" || saved === "ocean") {
    return saved;
  }
  return null;
};

const getInitialVisualMode = (): VisualMode => {
  return getStoredVisualMode() ?? getVisualModeForDate(getDayKey(new Date()));
};

const DOODLE_PALETTES: DoodlePalette[] = [
  { name: "霓虹蓝紫", colors: ["#5de0ff", "#7c3aed", "#22d3ee"] },
  { name: "电弧薄荷", colors: ["#18f0c6", "#4ade80", "#22d3ee"] },
  { name: "量子琥珀", colors: ["#facc15", "#f97316", "#f43f5e"] },
  { name: "超频紫", colors: ["#a855f7", "#818cf8", "#38bdf8"] },
  { name: "赛博玫瑰", colors: ["#f43f5e", "#ec4899", "#f97316"] },
  { name: "离子青", colors: ["#22d3ee", "#0ea5e9", "#60a5fa"] },
  { name: "寒光银", colors: ["#94a3b8", "#cbd5f5", "#60a5fa"] },
  { name: "熔岩信号", colors: ["#f97316", "#f43f5e", "#facc15"] },
  { name: "绿光矩阵", colors: ["#22c55e", "#18f0c6", "#38bdf8"] },
  { name: "晨曦电波", colors: ["#38bdf8", "#8b5cf6", "#fbbf24"] },
];

const DOODLE_VARIANTS: DoodleVariant[] = [
  {
    name: "流线",
    paths: [
      "M6 52 C 28 14, 74 8, 102 40 S 164 82, 196 30",
      "M8 62 C 36 26, 68 18, 96 48 S 152 92, 190 40",
    ],
  },
  {
    name: "弧线",
    paths: [
      "M12 30 C 46 6, 88 6, 120 30 S 176 54, 192 20",
      "M10 58 C 44 28, 92 28, 122 56 S 170 84, 194 46",
    ],
  },
  {
    name: "波纹",
    paths: [
      "M6 44 C 30 30, 52 32, 74 44 S 118 60, 150 44 180 30 196 40",
      "M6 60 C 34 46, 60 50, 82 60 S 120 76, 154 56 182 40 196 52",
    ],
  },
  {
    name: "轨迹",
    paths: [
      "M10 18 C 50 38, 90 12, 130 30 S 182 60, 194 20",
      "M10 44 C 42 26, 88 30, 122 50 S 170 78, 192 52",
    ],
  },
  {
    name: "光谱",
    paths: [
      "M12 20 C 42 40, 82 14, 116 30 S 170 62, 188 28",
      "M14 64 C 44 44, 84 50, 118 64 S 162 74, 188 46",
    ],
  },
];

const EVENT_IMAGES = {
  lanterns:
    "https://512pixels.net/downloads/macos-wallpapers/14-Sonoma-Light.jpg",
  lanternsAlt:
    "https://512pixels.net/downloads/macos-wallpapers/15-Sequoia-Light-6K.jpg",
  shamrock:
    "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=2400&q=82",
  hearts:
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=2400&q=82",
  fireworks:
    "https://images.unsplash.com/photo-1654832544261-d9639df991de?auto=format&fit=crop&w=2400&q=82",
  forest:
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=82",
  dragonBoat:
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=2400&q=82",
  moon:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=82",
  halloween:
    "https://512pixels.net/downloads/macos-wallpapers/10-9.jpg",
  cityscape:
    "https://images.unsplash.com/photo-1754972722440-f7e7f366bc01?auto=format&fit=crop&w=2400&q=82",
  underwater:
    "https://images.unsplash.com/photo-1752934654942-38e8b54259b6?auto=format&fit=crop&w=2400&q=82",
};

const TECH_IMAGE_POOL: ImageEntry[] = [
  {
    name: "macOS Sonoma Light",
    url: "https://512pixels.net/downloads/macos-wallpapers/14-Sonoma-Light.jpg",
  },
  {
    name: "macOS Sequoia Light 6K",
    url: "https://512pixels.net/downloads/macos-wallpapers/15-Sequoia-Light-6K.jpg",
  },
  {
    name: "macOS Mavericks Wave",
    url: "https://512pixels.net/downloads/macos-wallpapers/10-9.jpg",
  },
  {
    name: "City Skyline Night",
    url: "https://images.unsplash.com/photo-1654832544261-d9639df991de?auto=format&fit=crop&w=2600&q=82",
  },
  {
    name: "Urban Rooftop Skyline",
    url: "https://images.unsplash.com/photo-1754972722440-f7e7f366bc01?auto=format&fit=crop&w=2600&q=82",
  },
  {
    name: "Nature Landscape",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2600&q=82",
  },
  {
    name: "Underwater Blue World",
    url: "https://images.unsplash.com/photo-1752934654942-38e8b54259b6?auto=format&fit=crop&w=2600&q=82",
  },
  {
    name: "Deep Sea Fish",
    url: "https://images.unsplash.com/photo-1459743421941-c1caaf5a232f?auto=format&fit=crop&w=2600&q=82",
  },
];

const FIXED_EVENTS: DatedEvent[] = [
  {
    monthDay: "01-01",
    label: "元旦",
    theme: "newYear",
    doodleName: "新岁启程",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[2],
    variant: DOODLE_VARIANTS[0],
  },
  {
    monthDay: "02-02",
    label: "世界湿地日",
    theme: "spring",
    doodleName: "水域新生",
    icon: <Leaf className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[1],
    variant: DOODLE_VARIANTS[2],
  },
  {
    monthDay: "02-14",
    label: "情人节",
    theme: "valentine",
    doodleName: "心动回响",
    icon: <Heart className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.hearts,
    palette: DOODLE_PALETTES[4],
    variant: DOODLE_VARIANTS[3],
  },
  {
    monthDay: "03-08",
    label: "国际妇女节",
    theme: "valentine",
    doodleName: "她力量",
    icon: <Heart className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.hearts,
    palette: DOODLE_PALETTES[9],
    variant: DOODLE_VARIANTS[1],
  },
  {
    monthDay: "03-14",
    label: "圆周率日",
    theme: "winter",
    doodleName: "π 波动",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[0]?.url ?? EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[0],
    variant: DOODLE_VARIANTS[4],
  },
  {
    monthDay: "03-17",
    label: "圣帕特里克节",
    theme: "spring",
    doodleName: "翠影同频",
    icon: <Leaf className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.shamrock,
    palette: DOODLE_PALETTES[8],
    variant: DOODLE_VARIANTS[2],
  },
  {
    monthDay: "03-21",
    label: "世界森林日",
    theme: "spring",
    doodleName: "森系复苏",
    icon: <Leaf className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[8],
    variant: DOODLE_VARIANTS[0],
  },
  {
    monthDay: "03-22",
    label: "世界水日",
    theme: "spring",
    doodleName: "蓝脉共振",
    icon: <Sun className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[5],
    variant: DOODLE_VARIANTS[4],
  },
  {
    monthDay: "04-01",
    label: "愚人节",
    theme: "summer",
    doodleName: "灵感恶作剧",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[1]?.url ?? EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[9],
    variant: DOODLE_VARIANTS[3],
  },
  {
    monthDay: "04-07",
    label: "世界卫生日",
    theme: "spring",
    doodleName: "健康律动",
    icon: <Sun className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[5],
    variant: DOODLE_VARIANTS[4],
  },
  {
    monthDay: "04-22",
    label: "世界地球日",
    theme: "spring",
    doodleName: "守护蓝星",
    icon: <Leaf className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[1],
    variant: DOODLE_VARIANTS[2],
  },
  {
    monthDay: "04-23",
    label: "世界读书日",
    theme: "spring",
    doodleName: "知识星河",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[2]?.url ?? EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[0],
    variant: DOODLE_VARIANTS[4],
  },
  {
    monthDay: "05-01",
    label: "劳动节",
    theme: "summer",
    doodleName: "致敬匠心",
    icon: <BadgeCheck className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[5]?.url ?? EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[5],
    variant: DOODLE_VARIANTS[0],
  },
  {
    monthDay: "05-04",
    label: "青年节",
    theme: "summer",
    doodleName: "跃迁青春",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[4]?.url ?? EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[1],
    variant: DOODLE_VARIANTS[0],
  },
  {
    monthDay: "05-20",
    label: "520",
    theme: "valentine",
    doodleName: "爱意上线",
    icon: <Heart className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.hearts,
    palette: DOODLE_PALETTES[4],
    variant: DOODLE_VARIANTS[3],
  },
  {
    monthDay: "06-01",
    label: "国际儿童节",
    theme: "summer",
    doodleName: "童梦星球",
    icon: <Sun className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[3]?.url ?? EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[9],
    variant: DOODLE_VARIANTS[2],
  },
  {
    monthDay: "06-05",
    label: "世界环境日",
    theme: "summer",
    doodleName: "共生之境",
    icon: <Leaf className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[8],
    variant: DOODLE_VARIANTS[0],
  },
  {
    monthDay: "06-21",
    label: "夏至",
    theme: "summer",
    doodleName: "夏日脉冲",
    icon: <Sun className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[5],
    variant: DOODLE_VARIANTS[1],
  },
  {
    monthDay: "07-01",
    label: "建党节",
    theme: "national",
    doodleName: "初心灯塔",
    icon: <BadgeCheck className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[7],
    variant: DOODLE_VARIANTS[4],
  },
  {
    monthDay: "08-12",
    label: "国际青年日",
    theme: "summer",
    doodleName: "创想加速",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[0]?.url ?? EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[0],
    variant: DOODLE_VARIANTS[0],
  },
  {
    monthDay: "09-10",
    label: "教师节",
    theme: "autumn",
    doodleName: "师道微光",
    icon: <BadgeCheck className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[6],
    variant: DOODLE_VARIANTS[1],
  },
  {
    monthDay: "09-27",
    label: "世界旅游日",
    theme: "autumn",
    doodleName: "山海同游",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[5]?.url ?? EVENT_IMAGES.forest,
    palette: DOODLE_PALETTES[9],
    variant: DOODLE_VARIANTS[2],
  },
  {
    monthDay: "10-01",
    label: "国庆节",
    theme: "national",
    doodleName: "山河礼赞",
    icon: <BadgeCheck className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[7],
    variant: DOODLE_VARIANTS[4],
  },
  {
    monthDay: "10-31",
    label: "万圣节",
    theme: "autumn",
    doodleName: "夜幕奇想",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.halloween,
    palette: DOODLE_PALETTES[7],
    variant: DOODLE_VARIANTS[2],
  },
  {
    monthDay: "11-11",
    label: "双十一",
    theme: "autumn",
    doodleName: "狂欢脉冲",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: TECH_IMAGE_POOL[1]?.url ?? EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[3],
    variant: DOODLE_VARIANTS[0],
  },
  {
    monthDay: "12-24",
    label: "平安夜",
    theme: "winter",
    doodleName: "夜色祝福",
    icon: <Snowflake className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[6],
    variant: DOODLE_VARIANTS[4],
  },
  {
    monthDay: "12-25",
    label: "圣诞节",
    theme: "winter",
    doodleName: "冬日祝福",
    icon: <Snowflake className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[6],
    variant: DOODLE_VARIANTS[1],
  },
  {
    monthDay: "12-31",
    label: "跨年夜",
    theme: "newYear",
    doodleName: "倒数光潮",
    icon: <Sparkles className="h-3 w-3" />,
    imageUrl: EVENT_IMAGES.fireworks,
    palette: DOODLE_PALETTES[2],
    variant: DOODLE_VARIANTS[3],
  },
];

const LUNAR_EVENTS_BY_YEAR: Record<number, DatedEvent[]> = {
  2026: [
    {
      monthDay: "02-17",
      label: "春节",
      theme: "newYear",
      doodleName: "万象新生",
      icon: <Sparkles className="h-3 w-3" />,
      imageUrl: EVENT_IMAGES.lanterns,
      palette: DOODLE_PALETTES[2],
      variant: DOODLE_VARIANTS[0],
    },
    {
      monthDay: "03-03",
      label: "元宵节",
      theme: "winter",
      doodleName: "灯火流光",
      icon: <Sparkles className="h-3 w-3" />,
      imageUrl: EVENT_IMAGES.lanternsAlt,
      palette: DOODLE_PALETTES[9],
      variant: DOODLE_VARIANTS[3],
    },
    {
      monthDay: "04-05",
      label: "清明节",
      theme: "spring",
      doodleName: "清风寄思",
      icon: <Leaf className="h-3 w-3" />,
      imageUrl: EVENT_IMAGES.forest,
      palette: DOODLE_PALETTES[1],
      variant: DOODLE_VARIANTS[1],
    },
    {
      monthDay: "06-19",
      label: "端午节",
      theme: "summer",
      doodleName: "龙舟竞速",
      icon: <Sparkles className="h-3 w-3" />,
      imageUrl: EVENT_IMAGES.dragonBoat,
      palette: DOODLE_PALETTES[5],
      variant: DOODLE_VARIANTS[2],
    },
    {
      monthDay: "09-25",
      label: "中秋节",
      theme: "autumn",
      doodleName: "月影同辉",
      icon: <Snowflake className="h-3 w-3" />,
      imageUrl: EVENT_IMAGES.moon,
      palette: DOODLE_PALETTES[3],
      variant: DOODLE_VARIANTS[4],
    },
    {
      monthDay: "10-01",
      label: "国庆节",
      theme: "national",
      doodleName: "山河礼赞",
      icon: <BadgeCheck className="h-3 w-3" />,
      imageUrl: EVENT_IMAGES.fireworks,
      palette: DOODLE_PALETTES[7],
      variant: DOODLE_VARIANTS[4],
    },
    {
      monthDay: "10-18",
      label: "重阳节",
      theme: "autumn",
      doodleName: "登高问候",
      icon: <Leaf className="h-3 w-3" />,
      imageUrl: EVENT_IMAGES.forest,
      palette: DOODLE_PALETTES[7],
      variant: DOODLE_VARIANTS[1],
    },
  ],
};

const getDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthDayKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
};

const hashSeed = (input: string) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const getSpecialEvent = (date: Date) => {
  const key = getMonthDayKey(date);
  const yearEvents = LUNAR_EVENTS_BY_YEAR[date.getFullYear()] ?? [];
  return yearEvents.find((event) => event.monthDay === key)
    ?? FIXED_EVENTS.find((event) => event.monthDay === key);
};

const getTheme = (date: Date) => {
  const event = getSpecialEvent(date);
  if (event) return THEMES[event.theme];
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return THEMES.spring;
  if (month >= 6 && month <= 8) return THEMES.summer;
  if (month >= 9 && month <= 11) return THEMES.autumn;
  return THEMES.winter;
};

const VISUAL_MODE_ORDER: VisualMode[] = ["tech", "gemini", "ocean"];

const getVisualModeForDate = (dayKey: string): VisualMode => {
  const index = hashSeed(dayKey) % VISUAL_MODE_ORDER.length;
  return VISUAL_MODE_ORDER[index] ?? "tech";
};

const applyVisualModeToTheme = (
  baseTheme: ThemeConfig,
  visualMode: VisualMode,
): ThemeConfig => {
  if (visualMode === "gemini") {
    return {
      ...baseTheme,
      accent: "#1a73e8",
      accentStrong: "#8e24aa",
      accentSoft: "rgba(66,133,244,0.2)",
      hero: "linear-gradient(120deg, rgba(66,133,244,0.62), rgba(52,168,83,0.5), rgba(251,188,5,0.48), rgba(234,67,53,0.46))",
      background:
        "radial-gradient(circle at 12% 9%, rgba(66,133,244,0.2), transparent 46%), radial-gradient(circle at 85% 10%, rgba(168,85,247,0.15), transparent 42%), radial-gradient(circle at 50% 120%, rgba(52,168,83,0.13), transparent 50%), linear-gradient(180deg, #f9fbff, #eef3ff 56%, #f8fbff)",
      orbA: "rgba(66,133,244,0.22)",
      orbB: "rgba(168,85,247,0.18)",
      grid: "rgb(129, 140, 248)",
      shine: ["#4285f4", "#34a853", "#a855f7"],
      subtitle: "轻奢极简",
    };
  }
  if (visualMode === "ocean") {
    return {
      ...baseTheme,
      accent: "#0ea5e9",
      accentStrong: "#14b8a6",
      accentSoft: "rgba(20,184,166,0.22)",
      hero: "linear-gradient(120deg, rgba(14,165,233,0.56), rgba(20,184,166,0.5), rgba(56,189,248,0.44))",
      background:
        "radial-gradient(circle at 10% 10%, rgba(56,189,248,0.24), transparent 50%), radial-gradient(circle at 88% 12%, rgba(45,212,191,0.2), transparent 48%), linear-gradient(180deg, #eff9ff, #d9f1ff 54%, #eef8ff)",
      orbA: "rgba(56,189,248,0.28)",
      orbB: "rgba(45,212,191,0.24)",
      grid: "rgb(56, 189, 248)",
      shine: ["#0ea5e9", "#14b8a6", "#38bdf8"],
      subtitle: "蓝海清新",
    };
  }
  return {
    ...baseTheme,
    subtitle: "科技炫彩",
  };
};

const createDailyDoodle = (
  dayKey: string,
  theme: ThemeConfig,
  event?: SpecialEvent,
): DailyDoodle => {
  const seed = hashSeed(`${dayKey}-${event?.label ?? ""}`);
  const rand = mulberry32(seed);
  const palette =
    event?.palette
    ?? DOODLE_PALETTES[seed % DOODLE_PALETTES.length]
    ?? DOODLE_PALETTES[0]!;
  const variant =
    event?.variant
    ?? DOODLE_VARIANTS[seed % DOODLE_VARIANTS.length]
    ?? DOODLE_VARIANTS[0]!;
  const colors = [theme.accent, ...palette.colors];
  const colorAt = (index: number) =>
    colors[index % colors.length] ?? theme.accent;

  const dots: DoodleDot[] = Array.from({ length: 9 }, (_, index) => ({
    cx: 10 + rand() * 180,
    cy: 8 + rand() * 64,
    r: 1.8 + rand() * 3.6,
    fill: colorAt(index),
    opacity: 0.45 + rand() * 0.35,
  }));

  const bars: DoodleShape[] = Array.from({ length: 4 }, (_, index) => ({
    x: 12 + rand() * 150,
    y: 10 + rand() * 52,
    width: 18 + rand() * 34,
    height: 5 + rand() * 8,
    radius: 3 + rand() * 4,
    fill: colorAt(index + 1),
    opacity: 0.14 + rand() * 0.2,
  }));

  return {
    name: event ? `${event.label} · ${event.doodleName}` : `${palette.name} · ${variant.name}`,
    palette,
    variant,
    dots,
    bars,
    colors,
    strokeWidth: 1.6 + rand() * 1.2,
    thinStroke: 0.9 + rand() * 0.8,
    dash: `${Math.round(8 + rand() * 8)} ${Math.round(10 + rand() * 12)}`,
    offsetX: (rand() - 0.5) * 8,
    offsetY: (rand() - 0.5) * 6,
    gradientId: `doodle-grad-${seed}`,
  };
};

const getDailyImage = (dayKey: string, event?: SpecialEvent) => {
  if (event?.imageUrl) {
    return event.imageUrl;
  }
  const index = hashSeed(dayKey) % TECH_IMAGE_POOL.length;
  return TECH_IMAGE_POOL[index]?.url ?? EVENT_IMAGES.forest;
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [themeImage, setThemeImage] = useState<ThemeImageMeta | null>(null);
  const [themeImageLoading, setThemeImageLoading] = useState(false);
  const [showGrid] = useState(true);
  const [visualMode, setVisualMode] = useState<VisualMode>(getInitialVisualMode);
  const [imageRequestVersion, setImageRequestVersion] = useState(0);
  const forceRefreshImageRef = useRef(false);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [serviceStatus, setServiceStatus] = useState<"checking" | "ok" | "down">(
    "checking",
  );

  const today = useMemo(() => new Date(), []);
  const dayKey = useMemo(() => getDayKey(today), [today]);
  const dayLabel = useMemo(() => dayKey.replace(/-/g, "."), [dayKey]);
  const specialEvent = useMemo(() => getSpecialEvent(today), [today]);
  const baseTheme = useMemo(() => getTheme(today), [today]);
  const theme = useMemo(
    () => applyVisualModeToTheme(baseTheme, visualMode),
    [baseTheme, visualMode],
  );
  const modeConfig = VISUAL_MODES[visualMode];
  const doodle = useMemo(
    () => createDailyDoodle(dayKey, theme, specialEvent),
    [dayKey, theme, specialEvent],
  );
  const fallbackDailyImageUrl = useMemo(
    () => getDailyImage(dayKey, specialEvent),
    [dayKey, specialEvent],
  );
  const dailyImageUrl = themeImage?.imageUrl ?? fallbackDailyImageUrl;
  const themeBadgePrefix = specialEvent ? "节日主题" : "今日主题";
  const themeBadgeName = specialEvent ? specialEvent.label : theme.name;
  const doodleBadgePrefix = specialEvent ? "节日涂鸦" : "今日涂鸦";
  const isGeminiMode = visualMode === "gemini";
  const isLightMode = visualMode !== "tech";
  const badgeClass = isGeminiMode
    ? "border-slate-200/80 bg-white/90 text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
    : isLightMode
      ? "border-slate-200/90 bg-white/76 text-slate-700"
      : "border-cyan-200/20 bg-white/10 text-slate-200";
  const badgeStrongTextClass = isLightMode ? "text-slate-900" : "text-white";
  const surfaceTextClass = isLightMode ? "text-slate-700" : "text-slate-200";
  const mutedTextClass = isLightMode ? "text-slate-500" : "text-slate-400";
  const panelSurfaceClass = isGeminiMode
    ? "border-slate-200/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(246,249,255,0.88))]"
    : isLightMode
      ? "border-slate-200/90 bg-white/82"
      : "border-cyan-200/25 bg-slate-900/66";
  const frameShadow = isGeminiMode
    ? "0 24px 74px rgba(37,99,235,0.14), 0 8px 30px rgba(15,23,42,0.09)"
    : `0 26px 80px rgba(15,23,42,0.16), 0 0 50px ${theme.accentSoft}`;
  const cardInsetShadow = isGeminiMode
    ? `inset 0 0 0 1px rgba(255,255,255,0.72), inset 0 18px 60px rgba(219,234,254,0.48)`
    : `inset 0 0 0 1px ${theme.accentSoft}, inset 0 24px 90px rgba(11,18,36,0.42)`;
  const layoutScale = useMemo(() => {
    const baseHeight = 920;
    const scaled = (viewportHeight - 18) / baseHeight;
    return Math.max(0.8, Math.min(1, scaled));
  }, [viewportHeight]);
  const shouldScaleLayout = layoutScale < 0.995;

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOGIN_THEME_MODE_STORAGE_KEY, visualMode);
  }, [visualMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  useEffect(() => {
    let mounted = true;
    void requestJSON<{ status: string }>("/api/health", {
      timeoutMs: 5000,
      retries: 0,
    })
      .then(() => {
        if (mounted) setServiceStatus("ok");
      })
      .catch(() => {
        if (mounted) setServiceStatus("down");
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const forceRefresh = forceRefreshImageRef.current;
    forceRefreshImageRef.current = false;
    const imageCacheKey = `${THEME_IMAGE_CACHE_PREFIX}:${dayKey}:${specialEvent?.label ?? "daily"}:${visualMode}`;
    if (!forceRefresh && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(imageCacheKey);
        if (cached) {
          const payload = JSON.parse(cached) as ThemeImageMeta;
          if (payload?.imageUrl) {
            setThemeImage(payload);
            setThemeImageLoading(false);
            return () => {
              alive = false;
              controller.abort();
            };
          }
        }
      } catch {
        localStorage.removeItem(imageCacheKey);
      }

      // 默认不自动拉取在线图片，避免页面首屏慢和“自动刷新感”。
      // 仅在用户主动点击“换图”时发起在线检索。
      setThemeImage(null);
      setThemeImageLoading(false);
      return () => {
        alive = false;
        controller.abort();
      };
    }

    const query = new URLSearchParams({
      date: dayKey,
      event: specialEvent?.label ?? "",
      mode: visualMode,
      keywords: `${theme.name},${modeConfig.label},festival,doodle,illustration,high resolution`,
      nonce: String(imageRequestVersion),
    });
    if (forceRefresh) {
      query.set("refresh", "1");
    }

    setThemeImageLoading(true);
    const requestThemeImage = async () => {
      const urls = [
        `/theme-image?${query.toString()}`,
        `/api/theme-image?${query.toString()}`,
      ];
      for (const url of urls) {
        const response = await fetch(url, {
          method: "GET",
          cache: forceRefresh ? "no-store" : "force-cache",
          signal: controller.signal,
        });
        if (!response.ok) continue;
        return (await response.json()) as ThemeImageMeta;
      }
      return null;
    };

    requestThemeImage()
      .then((payload) => {
        if (!alive || !payload?.imageUrl) return;
        const preload = new Image();
        preload.decoding = "async";
        preload.src = payload.imageUrl;
        setThemeImage(payload);
        if (typeof window !== "undefined") {
          localStorage.setItem(imageCacheKey, JSON.stringify(payload));
        }
      })
      .catch(() => {
        // Ignore network errors and fall back to built-in assets.
      })
      .finally(() => {
        if (alive) setThemeImageLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [
    dayKey,
    specialEvent?.label,
    theme.name,
    modeConfig.label,
    visualMode,
    imageRequestVersion,
  ]);

  const handleRefreshThemeImage = () => {
    forceRefreshImageRef.current = true;
    setImageRequestVersion((current) => current + 1);
  };

  const handleCycleVisualMode = () => {
    setVisualMode((current) => {
      const index = VISUAL_MODE_ORDER.indexOf(current);
      const next = VISUAL_MODE_ORDER[(index + 1) % VISUAL_MODE_ORDER.length];
      return next ?? "tech";
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      const data = await requestJSON<LoginResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        timeoutMs: 12000,
        retries: 0,
      });
      setAuth(data.access_token, data.user);
      window.location.href = "/workspace";
    } catch (error) {
      if (error instanceof HTTPError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("连接失败：浏览器无法触达后端服务");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative h-screen overflow-hidden px-3 py-3 sm:px-5 sm:py-4",
        modeConfig.containerClass,
      )}
      style={{ backgroundImage: theme.background }}
    >
      <div className="pointer-events-none absolute inset-0">
        <img
          src={dailyImageUrl}
          alt="login-theme-backdrop"
          className="h-full w-full scale-[1.03] object-cover"
          loading="eager"
          decoding="async"
        />
        <div
          className={cn(
            "absolute inset-0",
            isLightMode
              ? "bg-[linear-gradient(180deg,rgba(246,246,243,0.76),rgba(246,246,243,0.9)_42%,rgba(246,246,243,0.95))]"
              : "bg-[linear-gradient(180deg,rgba(2,6,23,0.65),rgba(2,6,23,0.84))]",
          )}
        />
      </div>
      <div className="absolute inset-0" style={{ backgroundImage: modeConfig.heroTint }} />
      {showGrid && (
        <FlickeringGrid
          className="absolute inset-0 opacity-[0.08]"
          color={theme.grid}
          squareSize={3}
          gridGap={13}
          maxOpacity={0.16}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f022_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f022_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_76%_62%_at_50%_0%,#000_66%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:100%_12px] opacity-[0.14]" />

      <div
        className="relative z-20 mx-auto w-full max-w-6xl"
        style={
          shouldScaleLayout
            ? { transform: `scale(${layoutScale})`, transformOrigin: "top center" }
            : undefined
        }
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="inline-flex items-center gap-2.5">
            <AlexMark compact className="h-8 w-8 rounded-lg" accent={theme.accent} />
            <span className="text-[1.6rem] leading-none font-semibold tracking-tight text-slate-900">
              Alex
            </span>
          </div>
          <button
            type="button"
            onClick={handleCycleVisualMode}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/86 px-3 py-1.5 text-xs text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Palette className="h-3.5 w-3.5" />
            {modeConfig.label}
          </button>
        </div>

        <div className="mx-auto mt-4 w-full max-w-4xl text-center">
          <h1 className="text-pretty text-3xl leading-tight font-semibold tracking-tight text-slate-900 md:text-5xl">
            智能中枢登录
          </h1>
          <p className="mt-2 text-base text-slate-700 md:text-xl">
            基于deer-flow的数据流处理平台
          </p>
          <p className="mt-1 text-xs text-slate-500">
            继续进入你的专属智能空间
          </p>
        </div>

        <div
          className="mx-auto mt-4 w-full max-w-4xl"
          style={
            {
              "--accent": theme.accent,
              "--accent-strong": theme.accentStrong,
              "--accent-soft": theme.accentSoft,
            } as React.CSSProperties
          }
        >
        <div
          className="absolute -top-28 -left-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: theme.orbA }}
        />
        <div
          className="absolute -bottom-32 -right-16 h-64 w-64 rounded-full blur-3xl"
          style={{ background: theme.orbB }}
        />

        <div
          className="relative rounded-[38px] border border-white/70 bg-white/82 p-1 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl"
          style={{
            boxShadow: frameShadow,
          }}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-[34px] p-6 backdrop-blur-2xl md:p-7",
              modeConfig.cardClass,
            )}
            style={{
              boxShadow: cardInsetShadow,
            }}
          >
          <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
            <img
              src={dailyImageUrl}
              alt="theme-backdrop"
              className="h-full w-full scale-110 object-cover"
              loading="eager"
              decoding="async"
            />
            <div
              className={cn(
                "absolute inset-0",
                isLightMode
                  ? "bg-[linear-gradient(180deg,rgba(248,250,252,0.35),rgba(241,245,249,0.86)_45%,rgba(241,245,249,0.93))]"
                  : "bg-[linear-gradient(180deg,rgba(3,9,23,0.35),rgba(6,20,43,0.86)_42%,rgba(6,20,43,0.95))]",
              )}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.28),transparent_48%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.24),transparent_46%)]" />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-[0.1] bg-[linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.2)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div
            className="absolute inset-x-0 top-0 h-20"
            style={{ backgroundImage: theme.hero }}
          />
          <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_70%)]" />

          <div className="relative">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AlexMark
                    accent={theme.accent}
                    className={cn(
                      "h-12 w-12",
                      isLightMode && "border-slate-200 bg-white/88",
                    )}
                  />
                  <div
                    className={cn(
                      "absolute -bottom-2 -right-2 grid h-6 w-6 place-items-center rounded-full border",
                      isLightMode
                        ? "border-slate-200 bg-white/90"
                        : "border-cyan-200/30 bg-slate-900/70",
                    )}
                    style={{ color: theme.accent }}
                  >
                    <Sparkles className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <p className={cn("text-[10px] uppercase tracking-[0.3em]", mutedTextClass)}>
                    Alex Core
                  </p>
                  <p className={cn("text-[1.35rem] leading-tight font-semibold", badgeStrongTextClass)}>
                    基于deer-flow的数据流处理平台
                  </p>
                  <p className={cn("mt-1 text-xs", surfaceTextClass)}>
                    智能中枢登录 · 继续进入你的专属智能空间
                  </p>
                </div>
              </div>

              <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] shadow-sm", badgeClass)}>
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: theme.accentSoft, color: theme.accent }}
                >
                  {specialEvent?.icon ?? theme.icon}
                </span>
                <span>{themeBadgePrefix}</span>
                <span className={cn("font-semibold", badgeStrongTextClass)}>
                  {themeBadgeName}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]", badgeClass)}>
                  <BadgeCheck className="h-3 w-3" />
                  网关状态：
                  {serviceStatus === "checking" && "检查中"}
                  {serviceStatus === "ok" && "可用"}
                  {serviceStatus === "down" && "不可用"}
                </span>
                <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]", badgeClass)}>
                  主题调性：{theme.subtitle}
                </span>
                <button
                  type="button"
                  onClick={handleCycleVisualMode}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition hover:brightness-105",
                    badgeClass,
                  )}
                >
                  <Palette className="h-3 w-3" />
                  风格：{modeConfig.label}
                </button>
              </div>

              <div className={cn("relative overflow-hidden rounded-2xl border px-3.5 py-2.5 shadow-[0_14px_30px_rgba(15,23,42,0.14)]", panelSurfaceClass)}>
                <div
                  className="absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl"
                  style={{ background: theme.accentSoft }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
                <div className={cn("relative flex items-center justify-between text-[11px]", surfaceTextClass)}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: theme.accentSoft, color: theme.accent }}
                    >
                      {specialEvent?.icon ?? <Sparkles className="h-3 w-3" />}
                    </span>
                    {doodleBadgePrefix} · {doodle.name}
                  </span>
                  <span className="text-slate-400">{dayLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshThemeImage}
                  className="relative mt-2 block h-28 w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white/70 text-left transition hover:scale-[1.005] md:h-32"
                  title="点击刷新主题图片（在线更新）"
                >
                  <img
                    src={dailyImageUrl}
                    alt={`${doodleBadgePrefix}-${doodle.name}`}
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  {themeImageLoading && (
                    <div
                      className={cn(
                        "absolute inset-0 grid place-items-center text-[10px]",
                        isLightMode
                          ? "bg-white/60 text-slate-700"
                          : "bg-slate-900/40 text-slate-200",
                      )}
                    >
                      正在在线更新高清图...
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.5),transparent_45%,rgba(0,0,0,0.25))] mix-blend-screen" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,194,255,0.35),transparent_55%)] mix-blend-screen" />
                  <div className="absolute inset-0 ring-1 ring-white/60" />
                  <div className="absolute right-3 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
                    <RefreshCw className="h-3 w-3" />
                    在线换图
                  </div>
                </button>
                <div className={cn("mt-2 flex items-center justify-between text-[10px]", mutedTextClass)}>
                  <span>
                    素材源：{themeImage?.provider ?? "本地高清图池"}
                  </span>
                  <span>{themeImage?.from === "fallback" ? "本地秒开" : "在线检索"}</span>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            className="mt-5 space-y-4 rounded-[26px] border border-slate-200/80 bg-white/82 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className={cn("ml-1 text-[11px] font-semibold", surfaceTextClass)}>
                  管理员账号
                </label>
                <div className="relative">
                  <User className={cn("absolute left-3 top-3.5 h-4 w-4", mutedTextClass)} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={cn(
                      "w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]",
                      modeConfig.fieldClass,
                    )}
                    placeholder="请输入你的管理工号"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={cn("ml-1 text-[11px] font-semibold", surfaceTextClass)}>
                  访问密钥
                </label>
                <div className="relative">
                  <Lock className={cn("absolute left-3 top-3.5 h-4 w-4", mutedTextClass)} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]",
                      modeConfig.fieldClass,
                    )}
                    placeholder="请输入安全访问密钥"
                    required
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              disabled={loading || !username.trim() || !password.trim()}
              className="relative w-full overflow-hidden rounded-full bg-[linear-gradient(120deg,var(--accent),var(--accent-strong))] py-3 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ boxShadow: `0 12px 30px ${theme.accentSoft}` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:200%_200%] animate-shimmer" />
              <div className="relative flex items-center justify-center gap-2">
                <div
                  className={`h-4 w-4 rounded-full border-2 border-white/40 border-t-white ${loading ? "animate-spin" : ""}`}
                />
                <span className="tracking-[0.2em]">
                  {loading ? "验证中..." : "继续"}
                </span>
              </div>
            </button>
          </form>

          <div className="mt-4 border-t border-slate-200/70 pt-4 text-center">
            <p className={cn("text-[11px]", mutedTextClass)}>
              沈阳大学 · 智能科学与信息工程学院
            </p>
            <p className={cn("mt-1 text-[11px] font-medium tracking-[0.14em]", surfaceTextClass)}>
              22大数据1班R22790128
            </p>
            <p className={cn("mt-2 text-[9px]", mutedTextClass)}>
              © PROJECT FOR GRADUATION THESIS (SYU_BI_2022_B1)
            </p>
          </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
