"use client";

import {
  BrainIcon,
  ChevronDownIcon,
  FileTextIcon,
  FilterIcon,
  LinkIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  CopyIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { usePromptInputController } from "@/components/ai-elements/prompt-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBackendBaseURL } from "@/core/config";
import type {
  SemanticSearchResult,
  SemanticSourceFilter,
} from "@/core/semantic/api";
import { useSemanticReindex, useSemanticSearch } from "@/core/semantic/hooks";
import { cn } from "@/lib/utils";

type SemanticPanelProps = {
  threadId: string;
  className?: string;
};

const SOURCE_OPTIONS: { value: SemanticSourceFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "upload", label: "文件" },
  { value: "memory", label: "记忆" },
];

export function SemanticSearchPanel({ threadId, className }: SemanticPanelProps) {
  const { textInput } = usePromptInputController();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SemanticSourceFilter>("all");
  const [scope, setScope] = useState<"thread" | "global">("thread");
  const [topK, setTopK] = useState(5);
  const [minScore, setMinScore] = useState(0.2);
  const [filterText, setFilterText] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  const searchMutation = useSemanticSearch();
  const reindexMutation = useSemanticReindex();

  const filteredResults = useMemo(() => {
    const results = searchMutation.data?.results ?? [];
    const lowerFilter = filterText.trim().toLowerCase();
    return results.filter((result) => {
      if (result.score < minScore) return false;
      if (!lowerFilter) return true;
      const haystack = [
        result.filename,
        result.excerpt,
        JSON.stringify(result.metadata ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(lowerFilter);
    });
  }, [filterText, minScore, searchMutation.data?.results]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setLastQuery(trimmed);
    await searchMutation.mutateAsync({
      query: trimmed,
      threadId: scope === "thread" ? threadId : undefined,
      source,
      topK,
    });
  }, [query, scope, source, topK, threadId, searchMutation]);

  const handleReindex = useCallback(async () => {
    await reindexMutation.mutateAsync({
      source: source === "all" ? "all" : source,
      thread_id: scope === "thread" ? threadId : undefined,
    });
  }, [reindexMutation, scope, source, threadId]);

  const insertText = useCallback(
    (text: string) => {
      const current = textInput.value ?? "";
      const next = current ? `${current}\n${text}` : text;
      textInput.setInput(next);
      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }
    },
    [textInput],
  );

  const buildCitation = useCallback((result: SemanticSearchResult) => {
    const citation = result.citation;
    const metadata = result.metadata;
    const artifactUrl =
      (citation?.artifact_url as string | undefined) ??
      (metadata?.artifact_url as string | undefined);
    const backendBase = getBackendBaseURL();
    const resolvedUrl =
      artifactUrl && /^https?:\/\//.test(artifactUrl)
        ? artifactUrl
        : artifactUrl
          ? `${backendBase}${artifactUrl}`
          : undefined;

    const label =
      result.source === "memory"
        ? `记忆:${(metadata?.section as string) ?? (metadata?.category as string) ?? "条目"}`
        : `${result.filename}#${result.chunk_index + 1}`;

    const markdown = resolvedUrl
      ? `[citation:${label}](${resolvedUrl})`
      : `【记忆引用:${label}】`;

    return { label, markdown, resolvedUrl };
  }, []);

  return (
    <div className={cn("w-full max-w-[420px]", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            className="border-slate-200/90 bg-white text-slate-700 shadow-sm backdrop-blur hover:bg-slate-50"
            size="sm"
            variant="outline"
            type="button"
          >
            <SparklesIcon className="size-4" />
            语义检索
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div
            className="relative overflow-hidden rounded-2xl border border-slate-200/85 bg-[#f8fbff]/98 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur"
            style={{
              padding: "1rem",
            }}
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <BrainIcon className="size-4 text-sky-500" />
                  语义检索面板
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-100"
                  onClick={handleReindex}
                  disabled={reindexMutation.isPending}
                >
                  <RefreshCwIcon
                    className={cn(
                      "size-3",
                      reindexMutation.isPending && "animate-spin",
                    )}
                  />
                  重建索引
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="输入你的问题，回车或点击检索"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleSearch();
                      }
                    }}
                    className="h-9 border-slate-200/90 bg-white text-slate-700 placeholder:text-slate-400"
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => void handleSearch()}
                    disabled={searchMutation.isPending || query.trim().length < 2}
                    className="h-9 border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                  >
                    <SearchIcon className="size-4" />
                    检索
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="gap-1 text-[11px]">
                    <FilterIcon className="size-3" />
                    筛选
                  </Badge>
                  <Select
                    value={source}
                    onValueChange={(value) =>
                      setSource(value as SemanticSourceFilter)
                    }
                  >
                    <SelectTrigger className="h-7 w-[92px] border-slate-200/90 bg-white text-xs text-slate-700">
                      <SelectValue placeholder="来源" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-700">
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={scope}
                    onValueChange={(value) =>
                      setScope(value as "thread" | "global")
                    }
                  >
                    <SelectTrigger className="h-7 w-[108px] border-slate-200/90 bg-white text-xs text-slate-700">
                      <SelectValue placeholder="范围" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-700">
                      <SelectItem value="thread">当前会话</SelectItem>
                      <SelectItem value="global">全局</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(topK)}
                    onValueChange={(value) => setTopK(Number(value))}
                  >
                    <SelectTrigger className="h-7 w-[72px] border-slate-200/90 bg-white text-xs text-slate-700">
                      <SelectValue placeholder="TopK" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-700">
                      {[5, 8, 12, 20].map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          Top {count}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={filterText}
                    onChange={(event) => setFilterText(event.target.value)}
                    placeholder="结果过滤"
                    className="h-7 w-[120px] border-slate-200/90 bg-white text-xs text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>置信阈值</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={minScore}
                    onChange={(event) =>
                      setMinScore(Number(event.target.value))
                    }
                    className="h-2 w-full accent-sky-500"
                  />
                  <span className="w-10 text-right">
                    {(minScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {searchMutation.isPending
                      ? "正在检索..."
                      : lastQuery
                        ? `检索结果：${lastQuery}`
                        : "等待你的问题"}
                  </span>
                  <span>{filteredResults.length} 条</span>
                </div>
                {searchMutation.error ? (
                  <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-600">
                    检索失败：{searchMutation.error.message}
                  </div>
                ) : null}
                <ScrollArea className="h-[240px] rounded-xl border border-slate-200/80 bg-[#fbfdff] p-2">
                  {searchMutation.isPending ? (
                    <div className="p-3 text-xs text-slate-500">
                      正在扫描向量空间...
                    </div>
                  ) : filteredResults.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500">
                      {lastQuery ? "暂无匹配结果" : "请输入关键词开始检索"}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredResults.map((result, index) => {
                        const { markdown, resolvedUrl } = buildCitation(result);
                        const score = Math.max(
                          0,
                          Math.min(result.score, 1),
                        );
                        const sourceLabel =
                          result.source === "memory" ? "记忆" : "文件";
                        const displayName =
                          result.source === "memory" ? "记忆片段" : result.filename;
                        const metadata = result.metadata;
                        const memoryTag =
                          result.source === "memory"
                            ? (metadata.section as string) ||
                              (metadata.category as string) ||
                              (metadata.fact_id as string) ||
                              null
                            : null;
                        return (
                          <div
                            key={`${result.filename}-${result.chunk_index}-${index}`}
                            className="group relative rounded-lg border border-slate-200/75 bg-slate-50/72 p-3 text-xs shadow-sm transition hover:border-sky-300/70 hover:bg-white"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {result.source === "memory" ? (
                                  <BrainIcon className="size-3 text-amber-500" />
                                ) : (
                                  <FileTextIcon className="size-3 text-sky-500" />
                                )}
                                <span className="font-semibold">
                                  {displayName}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {sourceLabel}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px]">
                                  片段 {result.chunk_index + 1}
                                </Badge>
                                {memoryTag ? (
                                  <Badge variant="outline" className="text-[10px]">
                                    {memoryTag}
                                  </Badge>
                                ) : null}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {(score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={score * 100} className="mt-2 h-1" />
                            <p className="mt-2 line-clamp-3 text-[11px] text-slate-600">
                              {result.excerpt}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                className="h-7 px-2 text-[10px]"
                                onClick={() => insertText(markdown)}
                              >
                                <LinkIcon className="size-3" />
                                插入引用
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                className="h-7 px-2 text-[10px]"
                                onClick={() =>
                                  insertText(`> ${result.excerpt}`)
                                }
                              >
                                <SparklesIcon className="size-3" />
                                插入片段
                              </Button>
                              {resolvedUrl ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  type="button"
                                  className="h-7 px-2 text-[10px]"
                                  asChild
                                >
                                  <a
                                    href={resolvedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <LinkIcon className="size-3" />
                                    打开文件
                                  </a>
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                className="h-7 px-2 text-[10px]"
                                onClick={() =>
                                  navigator.clipboard?.writeText(markdown)
                                }
                              >
                                <CopyIcon className="size-3" />
                                复制引用
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
