import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface OpenverseImage {
  url?: string;
  title?: string;
  provider?: string;
  creator?: string;
  license?: string;
  foreign_landing_url?: string;
  width?: number | null;
  height?: number | null;
}

interface OpenverseResponse {
  results?: OpenverseImage[];
}

interface ThemeImagePayload {
  imageUrl: string;
  title: string;
  provider: string;
  license: string;
  attribution: string;
  sourceUrl: string;
  query: string;
  from: "openverse" | "fallback";
}

type VisualMode = "tech" | "gemini" | "ocean";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const OPENVERSE_TIMEOUT_MS = 1800;
const themeImageCache = new Map<string, { expiresAt: number; payload: ThemeImagePayload }>();

const EVENT_QUERY_POOL: Record<string, string[]> = {
  "春节": [
    "lunar new year cartoon illustration",
    "spring festival china doodle art",
    "red lantern festive illustration",
  ],
  "元宵节": [
    "lantern festival chinese cartoon illustration",
    "yuanxiao night lights doodle",
    "festival lantern sky illustration",
  ],
  "清明节": [
    "qingming spring landscape illustration",
    "traditional chinese spring festival art",
    "soft green memorial festival illustration",
  ],
  "端午节": [
    "dragon boat festival cartoon illustration",
    "zongzi cute doodle illustration",
    "duanwu dragon boat race art",
  ],
  "七夕节": [
    "qixi festival romantic illustration",
    "chinese valentine doodle cartoon",
    "magpie bridge love story illustration",
  ],
  "中秋节": [
    "mid autumn festival mooncake illustration",
    "full moon night chinese festival cartoon",
    "jade rabbit moon festival doodle",
  ],
  "重阳节": [
    "double ninth festival autumn mountain illustration",
    "chongyang chrysanthemum festival art",
    "autumn hiking celebration illustration",
  ],
  "国庆节": [
    "national day china celebration illustration",
    "city fireworks festival poster art",
    "red gold festive skyline illustration",
  ],
  "元旦": [
    "new year celebration doodle illustration",
    "new year confetti cartoon art",
    "modern festive neon poster",
  ],
  "情人节": [
    "valentine day cartoon illustration",
    "heart themed doodle art",
    "romantic pink red poster illustration",
  ],
  "妇女节": [
    "international women's day illustration",
    "women power floral doodle",
    "purple celebration poster art",
  ],
  "劳动节": [
    "labor day workers celebration illustration",
    "worker themed poster art",
    "construction teamwork cartoon style",
  ],
  "青年节": [
    "youth day dynamic poster illustration",
    "young people festival cartoon art",
  ],
  "儿童节": [
    "children day cartoon illustration",
    "kids celebration doodle art",
    "cute mascot spring poster",
  ],
  "教师节": [
    "teacher day classroom illustration",
    "education themed doodle poster",
  ],
  "万圣节": [
    "halloween cartoon illustration",
    "pumpkin doodle spooky cute art",
    "orange purple festival poster",
  ],
  "圣诞节": [
    "christmas doodle illustration",
    "winter holiday festive cartoon",
    "snow tree gift illustration",
  ],
  "平安夜": [
    "christmas eve warm light illustration",
    "winter night festive doodle",
  ],
  "圣帕特里克节": [
    "saint patricks day shamrock illustration",
    "green clover cartoon festival",
  ],
  "愚人节": [
    "april fools day playful illustration",
    "funny doodle poster art",
  ],
  "地球日": [
    "earth day eco illustration",
    "green planet protection poster",
  ],
  "读书日": [
    "world book day illustration",
    "reading festival doodle art",
  ],
  "环境日": [
    "world environment day illustration",
    "eco nature protection poster",
  ],
  "旅游日": [
    "world tourism day illustration",
    "travel skyline poster art",
  ],
  "母亲节": [
    "mothers day floral illustration",
    "family warm greeting card art",
    "love and gratitude poster illustration",
  ],
  "父亲节": [
    "fathers day celebration illustration",
    "father child warm cartoon art",
  ],
  "春分": [
    "spring equinox blossom illustration",
    "spring balance nature poster art",
  ],
  "夏至": [
    "summer solstice sunshine illustration",
    "summer festival vibrant poster art",
  ],
  "秋分": [
    "autumn equinox harvest illustration",
    "autumn landscape festival art",
  ],
  "冬至": [
    "winter solstice warm festival illustration",
    "winter night celebration doodle",
  ],
  "建党节": [
    "china party founding day celebration illustration",
    "red themed commemorative poster art",
  ],
  "建军节": [
    "army day celebration illustration",
    "military commemorative poster art",
  ],
  "感恩节": [
    "thanksgiving festive illustration",
    "autumn family dinner cartoon art",
  ],
  "世界海洋日": [
    "world oceans day poster illustration",
    "marine protection campaign art",
  ],
  "国际护士节": [
    "international nurses day appreciation illustration",
    "medical care celebration poster art",
  ],
  "世界无烟日": [
    "world no tobacco day campaign poster",
    "health awareness illustration art",
  ],
  "开学季": [
    "back to school cheerful illustration",
    "campus learning poster design",
  ],
  "毕业季": [
    "graduation celebration illustration",
    "campus farewell memory poster",
  ],
};

const DAILY_QUERY_POOL = [
  "macos style cityscape wallpaper 4k",
  "apple style city skyline wallpaper",
  "mac wallpaper nature landscape 5k",
  "mac wallpaper underwater scene blue",
  "futuristic technology wallpaper high resolution",
  "digital neon interface artwork",
  "clean minimal gradient wallpaper",
  "ocean coastline aerial wallpaper 4k",
];

const MODE_QUERY_POOL: Record<VisualMode, string[]> = {
  tech: [
    "futuristic ui dashboard wallpaper",
    "cyberpunk neon technology wallpaper 4k",
    "mac style tech gradient wallpaper",
  ],
  gemini: [
    "macos cityscape wallpaper clean style",
    "apple style modern city night wallpaper",
    "minimal premium geometric wallpaper high resolution",
  ],
  ocean: [
    "mac wallpaper underwater ocean scene",
    "blue ocean beach aerial wallpaper 4k",
    "sea wave tropical coast wallpaper high resolution",
  ],
};

const FALLBACK_IMAGES: Record<VisualMode, Omit<ThemeImagePayload, "query" | "from">[]> = {
  tech: [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=82",
      title: "Mac Tech Glow",
      provider: "Unsplash",
      license: "Unsplash",
      attribution: "Luke Chesser",
      sourceUrl: "https://unsplash.com/photos/JKUTrJ4vK00",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1654832544261-d9639df991de?auto=format&fit=crop&w=2400&q=82",
      title: "Mac Night City",
      provider: "Unsplash",
      license: "Unsplash",
      attribution: "Andres Siimon",
      sourceUrl: "https://unsplash.com/photos/a-city-skyline-at-night-3Qzf-U0XfCE",
    },
  ],
  gemini: [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1754972722440-f7e7f366bc01?auto=format&fit=crop&w=2400&q=82",
      title: "Mac Urban Rooftop",
      provider: "Unsplash",
      license: "Unsplash",
      attribution: "Mantas Hesthaven",
      sourceUrl:
        "https://unsplash.com/photos/rooftops-of-houses-with-city-skyline-in-background-S21CrCFzsSc",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2400&q=82",
      title: "City Reflection",
      provider: "Unsplash",
      license: "Unsplash",
      attribution: "Denys Nevozhai",
      sourceUrl: "https://unsplash.com/photos/guNIjIuUcgY",
    },
  ],
  ocean: [
    {
      imageUrl:
        "https://images.unsplash.com/photo-1752934654942-38e8b54259b6?auto=format&fit=crop&w=2400&q=82",
      title: "Underwater Blue World",
      provider: "Unsplash",
      license: "Unsplash",
      attribution: "Natalia Blauth",
      sourceUrl:
        "https://unsplash.com/photos/a-vibrant-blue-fish-swims-gracefully-underwater-ggw69SgTlNM",
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1459743421941-c1caaf5a232f?auto=format&fit=crop&w=2400&q=82",
      title: "Deep Sea Fish",
      provider: "Unsplash",
      license: "Unsplash",
      attribution: "Francesco Ungaro",
      sourceUrl: "https://unsplash.com/photos/fishes-underwater-IjzFb5zEz68",
    },
  ],
};

const DEFAULT_FALLBACK_IMAGES: Omit<ThemeImagePayload, "query" | "from">[] = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1654832544261-d9639df991de?auto=format&fit=crop&w=2400&q=82",
    title: "Mac Night City",
    provider: "Unsplash",
    license: "Unsplash",
    attribution: "Andres Siimon",
    sourceUrl: "https://unsplash.com/photos/a-city-skyline-at-night-3Qzf-U0XfCE",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1754972722440-f7e7f366bc01?auto=format&fit=crop&w=2400&q=82",
    title: "Mac Urban Rooftop",
    provider: "Unsplash",
    license: "Unsplash",
    attribution: "Mantas Hesthaven",
    sourceUrl:
      "https://unsplash.com/photos/rooftops-of-houses-with-city-skyline-in-background-S21CrCFzsSc",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=82",
    title: "Mac Nature Landscape",
    provider: "Unsplash",
    license: "Unsplash",
    attribution: "Alejandro Escamilla",
    sourceUrl: "https://unsplash.com/photos/yC-Yzbqy7PY",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1752934654942-38e8b54259b6?auto=format&fit=crop&w=2400&q=82",
    title: "Mac Underwater Blue",
    provider: "Unsplash",
    license: "Unsplash",
    attribution: "Natalia Blauth",
    sourceUrl:
      "https://unsplash.com/photos/a-vibrant-blue-fish-swims-gracefully-underwater-ggw69SgTlNM",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1459743421941-c1caaf5a232f?auto=format&fit=crop&w=2400&q=82",
    title: "Mac Deep Sea Fish",
    provider: "Unsplash",
    license: "Unsplash",
    attribution: "Francesco Ungaro",
    sourceUrl: "https://unsplash.com/photos/fishes-underwater-IjzFb5zEz68",
  },
];

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function pickFromPool<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length]!;
}

function resolveQueries(
  eventName: string,
  extraKeywords: string,
  visualMode: VisualMode,
): string[] {
  const normalizedEvent = normalizeKey(eventName);
  const eventQueries = Object.entries(EVENT_QUERY_POOL)
    .filter(([label]) => {
      const normalizedLabel = normalizeKey(label);
      if (!normalizedEvent) return false;
      return (
        normalizedEvent.includes(normalizedLabel)
        || normalizedLabel.includes(normalizedEvent)
      );
    })
    .flatMap(([, queries]) => queries);
  const keywordTokens = extraKeywords
    .split(/[,，|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const keywordQueries = keywordTokens.flatMap((item) => [
    `${item} illustration`,
    `${item} cartoon doodle`,
  ]);
  const eventNameQueries = eventName.trim()
    ? [`${eventName} cartoon illustration`, `${eventName} festival doodle art`]
    : [];
  const modeQueries = MODE_QUERY_POOL[visualMode] ?? MODE_QUERY_POOL.tech;
  const merged = [...eventNameQueries, ...eventQueries, ...keywordQueries, ...modeQueries];
  const unique = Array.from(
    new Set(
      merged
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
  return unique.length > 0 ? unique : [...modeQueries, ...DAILY_QUERY_POOL];
}

function normalizeOpenverseUrl(url: string): string | null {
  if (!url || !/^https?:\/\//.test(url)) return null;
  const lowered = url.toLowerCase();
  if (lowered.endsWith(".svg")) return null;
  if (lowered.includes("images.unsplash.com")) {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    parsed.searchParams.set("w", "1280");
    parsed.searchParams.set("q", "78");
    return parsed.toString();
  }
  return url;
}

async function fetchFromOpenverse(query: string, seed: number): Promise<ThemeImagePayload | null> {
  const api = new URL("https://api.openverse.org/v1/images");
  api.searchParams.set("q", query);
  api.searchParams.set("page_size", "24");
  api.searchParams.set("mature", "false");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENVERSE_TIMEOUT_MS);
  const response = await fetch(api.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 6 },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) return null;

  const data = (await response.json()) as OpenverseResponse;
  const valid = (data.results ?? []).filter((item) => {
    const url = normalizeOpenverseUrl(item.url ?? "");
    if (!url) return false;
    if (typeof item.width === "number" && item.width > 0 && item.width < 900) return false;
    if (typeof item.height === "number" && item.height > 0 && item.height < 500) return false;
    return true;
  });

  if (valid.length === 0) return null;

  const picked = pickFromPool(valid, seed);
  const imageUrl = normalizeOpenverseUrl(picked.url ?? "");
  if (!imageUrl) return null;
  const normalizedTitle = picked.title?.trim();

  return {
    imageUrl,
    title: normalizedTitle && normalizedTitle.length > 0 ? normalizedTitle : "Daily Theme Image",
    provider: picked.provider ?? "Openverse",
    license: picked.license ?? "Unknown",
    attribution: picked.creator ?? "Openverse",
    sourceUrl: picked.foreign_landing_url ?? imageUrl,
    query,
    from: "openverse",
  };
}

function fallbackPayload(
  seed: number,
  query: string,
  visualMode: VisualMode,
): ThemeImagePayload {
  const modePool = FALLBACK_IMAGES[visualMode] ?? DEFAULT_FALLBACK_IMAGES;
  const base = pickFromPool(modePool, seed);
  return {
    ...base,
    query,
    from: "fallback",
  };
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "unknown";
  const eventName = request.nextUrl.searchParams.get("event") ?? "";
  const keywords = request.nextUrl.searchParams.get("keywords") ?? "";
  const visualModeParam = request.nextUrl.searchParams.get("mode");
  const visualMode: VisualMode =
    visualModeParam === "gemini" || visualModeParam === "ocean"
      ? visualModeParam
      : "tech";
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  const nonce = request.nextUrl.searchParams.get("nonce") ?? "";
  const cacheKey = `${date}::${eventName}::${keywords}::${visualMode}`;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = themeImageCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.payload, {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=21600" },
      });
    }
  }

  const seed = hashSeed(`${cacheKey}::${nonce}`);
  const queries = resolveQueries(eventName, keywords, visualMode);

  let payload: ThemeImagePayload | null = null;
  const attempts = forceRefresh ? 3 : 1;
  for (let i = 0; i < Math.min(queries.length, attempts); i += 1) {
    const query = queries[(seed + i) % queries.length]!;
    try {
      payload = await fetchFromOpenverse(query, seed + i * 17);
      if (payload) break;
    } catch {
      payload = null;
    }
  }

  payload ??= fallbackPayload(seed, queries[0] ?? "daily tech theme", visualMode);

  themeImageCache.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    payload,
  });

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=21600" },
  });
}
