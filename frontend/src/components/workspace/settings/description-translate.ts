"use client";

import type { BilingualViewMode } from "./bilingual-view";

const NAME_TRANSLATIONS: Record<string, string> = {
  filesystem: "文件系统",
  github: "GitHub 仓库操作",
  postgres: "PostgreSQL 数据库",
  "my-sse-server": "SSE 服务",
  "my-http-server": "HTTP 服务",
  "consulting-analysis": "咨询级分析报告",
  "data-analysis": "数据分析",
  "deep-research": "深度研究",
  "find-skills": "技能发现",
  "frontend-design": "前端设计",
  "github-deep-research": "GitHub 深度研究",
  "image-generation": "图像生成",
  "podcast-generation": "播客生成",
  "ppt-generation": "PPT 生成",
  "skill-creator": "技能创建",
  "surprise-me": "惊喜模式",
  "vercel-deploy": "Vercel 部署",
  "video-generation": "视频生成",
  "web-design-guidelines": "网页设计规范审查",
  "chart-visualization": "图表可视化",
};

const EXACT_TRANSLATIONS: Record<string, string> = {
  "Provides filesystem access within allowed directories":
    "在允许目录范围内提供文件系统访问能力。",
  "GitHub MCP server for repository operations":
    "用于仓库操作的 GitHub MCP 服务。",
  "PostgreSQL database access":
    "PostgreSQL 数据库访问。",
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
  "Complete terms in LICENSE.txt":
    "许可证条款详见 LICENSE.txt。",
  "Use this skill instead of WebSearch for ANY question requiring web research. Trigger on queries like \"what is X\", \"explain X\", \"compare X and Y\", \"research X\", or before content generation tasks. Provides systematic multi-angle research methodology instead of single superficial searches. Use this proactively when the user's question needs online information.":
    "凡是需要联网研究的问题都应优先使用该技能，而不是 WebSearch。它适用于“什么是X”“解释X”“比较X和Y”“研究X”等请求，也适用于内容生成前置调研。该技能提供系统化、多角度的研究方法，而非单次浅层检索。",
};

const PHRASE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/This skill should be used when/gi, "该技能适用于"],
  [/Use this skill when/gi, "当以下场景请使用该技能："],
  [/Use this skill instead of WebSearch/gi, "该技能应替代 WebSearch 使用"],
  [/Trigger on queries like/gi, "触发示例："],
  [/Provides systematic multi-angle research methodology/gi, "提供系统化、多角度研究方法"],
  [/Use this proactively/gi, "请主动使用该技能"],
  [/including but not limited to/gi, "包括但不限于"],
  [/professional research reports/gi, "专业研究报告"],
  [/consulting-grade analytical report/gi, "咨询级分析报告"],
  [/This skill operates in two phases/gi, "该技能分为两个阶段运行"],
  [/structured analysis framework/gi, "结构化分析框架"],
  [/chapter skeleton/gi, "章节骨架"],
  [/data query requirements/gi, "数据查询需求"],
  [/analysis logic/gi, "分析逻辑"],
  [/final consulting-grade report/gi, "最终咨询级报告"],
  [/embedded charts/gi, "嵌入图表"],
  [/strategic insights/gi, "战略洞察"],
  [/uploads Excel \(\.xlsx\/\.xls\) or CSV files/gi, "上传 Excel（.xlsx/.xls）或 CSV 文件"],
  [/perform data analysis/gi, "进行数据分析"],
  [/generate statistics/gi, "生成统计结果"],
  [/create summaries/gi, "生成摘要"],
  [/pivot tables/gi, "数据透视表"],
  [/SQL queries/gi, "SQL 查询"],
  [/structured data exploration/gi, "结构化数据探索"],
  [/Supports multi-sheet Excel workbooks/gi, "支持多工作表 Excel 工作簿"],
  [/aggregation/gi, "聚合"],
  [/filtering/gi, "筛选"],
  [/joins/gi, "关联（Join）"],
  [/exporting results to CSV\/JSON\/Markdown/gi, "结果可导出为 CSV/JSON/Markdown"],
  [/Helps users discover and install agent skills/gi, "帮助用户发现并安装智能体技能"],
  [/how do I do X/gi, "“如何做 X”"],
  [/find a skill for X/gi, "“找一个实现 X 的技能”"],
  [/is there a skill that can/gi, "“有没有某个技能可以…”"],
  [/extending capabilities/gi, "扩展能力"],
  [/Create distinctive, production-grade frontend interfaces/gi, "创建有辨识度、可生产落地的前端界面"],
  [/high design quality/gi, "高设计质量"],
  [/build web components, pages, artifacts, posters, or applications/gi, "构建组件、页面、作品、海报或应用"],
  [/Generates creative, polished code and UI design that avoids generic AI aesthetics/gi, "生成有创意、打磨完整、避免同质化 AI 风格的代码与界面设计"],
  [/Conduct multi-round deep research on any GitHub Repo/gi, "对任意 GitHub 仓库开展多轮深度研究"],
  [/executive summaries/gi, "高管摘要"],
  [/chronological timelines/gi, "时间线复盘"],
  [/metrics analysis/gi, "指标分析"],
  [/Mermaid diagrams/gi, "Mermaid 图示"],
  [/generate, create, imagine, or visualize images/gi, "生成、创作、构想或可视化图片"],
  [/Supports structured prompts and reference images for guided generation/gi, "支持结构化提示词与参考图引导生成"],
  [/generate, create, or produce podcasts from text content/gi, "把文本内容生成播客"],
  [/Converts written content into a two-host conversational podcast audio format with natural dialogue/gi, "将书面内容转换为双主持自然对话播客音频"],
  [/generate, create, or make presentations \(PPT\/PPTX\)/gi, "生成演示文稿（PPT/PPTX）"],
  [/Creates visually rich slides by generating images for each slide and composing them into a PowerPoint file/gi, "通过为每页生成图片并自动排版，产出视觉丰富的 PowerPoint"],
  [/Guide for creating effective skills/gi, "用于创建高质量技能的指南"],
  [/extends Claude's capabilities/gi, "扩展智能体能力"],
  [/specialized knowledge/gi, "专项知识"],
  [/workflows/gi, "工作流"],
  [/tool integrations/gi, "工具集成"],
  [/Create a delightful, unexpected \"wow\" experience for the user/gi, "为用户创造惊喜且出彩的体验"],
  [/dynamically discovering and creatively combining other enabled skills/gi, "动态发现并创意组合其他已启用技能"],
  [/Deploy applications and websites to Vercel/gi, "将应用或网站部署到 Vercel"],
  [/No authentication required - returns preview URL and claimable deployment link/gi, "无需认证，直接返回预览地址与可认领链接"],
  [/generate, create, or imagine videos/gi, "生成、创作或构想视频"],
  [/Supports structured prompts and reference image for guided generation/gi, "支持结构化提示词与参考图引导生成"],
  [/Review UI code for Web Interface Guidelines compliance/gi, "按 Web Interface Guidelines 审查 UI 代码"],
  [/check accessibility/gi, "检查可访问性"],
  [/audit design/gi, "审计设计质量"],
  [/review UX/gi, "评审用户体验"],
  [/check my site against best practices/gi, "按最佳实践检查站点"],
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

export function translateNameToZh(rawName: string): string {
  const name = rawName.trim();
  return NAME_TRANSLATIONS[name] ?? rawName;
}

export function translateLicenseToZh(rawLicense: string): string {
  const normalized = normalizeText(rawLicense);
  return EXACT_TRANSLATIONS[normalized] ?? rawLicense;
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

export function formatNameByMode(mode: BilingualViewMode, rawName: string) {
  const zhName = translateNameToZh(rawName);
  if (mode === "en") return rawName;
  if (mode === "zh") return zhName;
  if (zhName === rawName) return rawName;
  return `${zhName} / ${rawName}`;
}

export function formatLicenseByMode(
  mode: BilingualViewMode,
  rawLicense: string,
) {
  const zhLicense = translateLicenseToZh(rawLicense);
  if (mode === "en") return rawLicense;
  if (mode === "zh") return zhLicense;
  if (zhLicense === rawLicense) return rawLicense;
  return `${zhLicense} / ${rawLicense}`;
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
