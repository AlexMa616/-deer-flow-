import type { Message } from "@langchain/langgraph-sdk";
import {
  AlertTriangleIcon,
  BanIcon,
  CheckCircleIcon,
  CircleIcon,
  FileIcon,
  Loader2Icon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { memo, useMemo, type ImgHTMLAttributes } from "react";
import rehypeKatex from "rehype-katex";

import {
  Message as AIElementMessage,
  MessageContent as AIElementMessageContent,
  MessageResponse as AIElementMessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import { AlexMark } from "@/components/brand/alex-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { resolveArtifactURL } from "@/core/artifacts/utils";
import {
  extractContentFromMessage,
  extractReasoningContentFromMessage,
  parseUploadedFiles,
  type UploadedFile,
} from "@/core/messages/utils";
import { useRehypeSplitWordsIntoSpans } from "@/core/rehype";
import { humanMessagePlugins } from "@/core/streamdown";
import {
  useCancelUploadJob,
  useRetryUploadJob,
  useUploadStatus,
} from "@/core/uploads/hooks";
import { formatTimeAgo } from "@/core/utils/datetime";
import { cn } from "@/lib/utils";

import { CopyButton } from "../copy-button";

import { MarkdownContent } from "./markdown-content";

export function MessageListItem({
  className,
  message,
  isLoading,
}: {
  className?: string;
  message: Message;
  isLoading?: boolean;
}) {
  const isHuman = message.type === "human";
  return (
    <AIElementMessage
      className={cn("group/conversation-message relative w-full py-1", className)}
      from={isHuman ? "user" : "assistant"}
    >
      <div
        className={cn(
          "flex items-start gap-2.5 md:gap-3.5",
          isHuman ? "justify-end pl-12" : "justify-start pr-12",
        )}
      >
        {!isHuman && <MessageAvatar role="assistant" />}
        <div className="min-w-0 max-w-full space-y-1">
          <div
            className={cn(
              "text-[12px] font-medium tracking-[0.02em] text-slate-500",
              isHuman ? "text-right" : "text-left",
            )}
          >
            {isHuman ? "你" : "Alex"}
          </div>
          <MessageContent
            className={isHuman ? "w-fit" : "w-full"}
            message={message}
            isLoading={isLoading}
          />
        </div>
        {isHuman && <MessageAvatar role="user" />}
      </div>
      <MessageToolbar
        className={cn(
          isHuman ? "-bottom-9 justify-end" : "-bottom-8",
          "absolute right-0 left-0 z-20 opacity-0 transition-opacity delay-200 duration-300 group-hover/conversation-message:opacity-100",
        )}
      >
        <div className="flex gap-1">
          <CopyButton
            clipboardData={
              extractContentFromMessage(message) ??
              extractReasoningContentFromMessage(message) ??
              ""
            }
          />
        </div>
      </MessageToolbar>
    </AIElementMessage>
  );
}

function MessageAvatar({ role }: { role: "user" | "assistant" }) {
  const isUser = role === "user";
  if (!isUser) {
    return (
      <AlexMark
        compact
        accent="#4285f4"
        className="mt-1 size-8 shrink-0 rounded-xl border-slate-200 bg-white"
      />
    );
  }
  return (
    <div
      className={cn(
        "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold shadow-sm",
        "border-slate-200/80 bg-white text-slate-600",
      )}
    >
      你
    </div>
  );
}

/**
 * Custom image component that handles artifact URLs
 */
function MessageImage({
  src,
  alt,
  threadId,
  maxWidth = "90%",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  threadId: string;
  maxWidth?: string;
}) {
  if (!src) return null;

  const imgClassName = cn("overflow-hidden rounded-lg", `max-w-[${maxWidth}]`);

  if (typeof src !== "string") {
    return <img className={imgClassName} src={src} alt={alt} {...props} />;
  }

  const url = src.startsWith("/mnt/") ? resolveArtifactURL(src, threadId) : src;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img className={imgClassName} src={url} alt={alt} {...props} />
    </a>
  );
}

function MessageContent_({
  className,
  message,
  isLoading = false,
}: {
  className?: string;
  message: Message;
  isLoading?: boolean;
}) {
  const rehypePlugins = useRehypeSplitWordsIntoSpans(isLoading);
  const isHuman = message.type === "human";
  const { thread_id } = useParams<{ thread_id: string }>();
  const components = useMemo(
    () => ({
      img: (props: ImgHTMLAttributes<HTMLImageElement>) => (
        <MessageImage {...props} threadId={thread_id} maxWidth="90%" />
      ),
    }),
    [thread_id],
  );

  const rawContent = extractContentFromMessage(message);
  const reasoningContent = extractReasoningContentFromMessage(message);
  const { contentToParse, uploadedFiles } = useMemo(() => {
    if (!isLoading && reasoningContent && !rawContent) {
      return {
        contentToParse: reasoningContent,
        uploadedFiles: [] as UploadedFile[],
      };
    }
    if (isHuman && rawContent) {
      const { files, cleanContent: contentWithoutFiles } =
        parseUploadedFiles(rawContent);
      return { contentToParse: contentWithoutFiles, uploadedFiles: files };
    }
    return {
      contentToParse: rawContent ?? "",
      uploadedFiles: [] as UploadedFile[],
    };
  }, [isLoading, rawContent, reasoningContent, isHuman]);

  const filesList =
    uploadedFiles.length > 0 && thread_id ? (
      <UploadedFilesList files={uploadedFiles} threadId={thread_id} />
    ) : null;

  if (isHuman) {
    const messageResponse = contentToParse ? (
      <AIElementMessageResponse
        remarkPlugins={humanMessagePlugins.remarkPlugins}
        rehypePlugins={humanMessagePlugins.rehypePlugins}
        components={components}
      >
        {contentToParse}
      </AIElementMessageResponse>
    ) : null;
    return (
      <div className={cn("ml-auto flex flex-col gap-2", className)}>
        {filesList}
        {messageResponse && (
          <AIElementMessageContent className="w-fit">
            {messageResponse}
          </AIElementMessageContent>
        )}
      </div>
    );
  }

  return (
    <AIElementMessageContent className={className}>
      {filesList}
      <MarkdownContent
        content={contentToParse}
        isLoading={isLoading}
        rehypePlugins={[...rehypePlugins, [rehypeKatex, { output: "html" }]]}
        className="my-3"
        components={components}
      />
    </AIElementMessageContent>
  );
}

/**
 * Get file extension and check helpers
 */
const getFileExt = (filename: string) =>
  filename.split(".").pop()?.toLowerCase() ?? "";

const FILE_TYPE_MAP: Record<string, string> = {
  json: "JSON",
  csv: "CSV",
  txt: "TXT",
  md: "Markdown",
  py: "Python",
  js: "JavaScript",
  ts: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  html: "HTML",
  css: "CSS",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  pdf: "PDF",
  png: "PNG",
  jpg: "JPG",
  jpeg: "JPEG",
  gif: "GIF",
  svg: "SVG",
  zip: "ZIP",
  tar: "TAR",
  gz: "GZ",
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];

function getFileTypeLabel(filename: string): string {
  const ext = getFileExt(filename);
  return FILE_TYPE_MAP[ext] ?? (ext.toUpperCase() || "FILE");
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(getFileExt(filename));
}

/**
 * Uploaded files list component
 */
function UploadedFilesList({
  files,
  threadId,
}: {
  files: UploadedFile[];
  threadId: string;
}) {
  if (files.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap justify-end gap-2">
      {files.map((file, index) => (
        <UploadedFileCard
          key={`${file.path}-${index}`}
          file={file}
          threadId={threadId}
        />
      ))}
    </div>
  );
}

/**
 * Single uploaded file card component
 */
function UploadedFileCard({
  file,
  threadId,
}: {
  file: UploadedFile;
  threadId: string;
}) {
  const { data: status } = useUploadStatus(threadId, file.filename);
  const cancelMutation = useCancelUploadJob(threadId, file.filename);
  const retryMutation = useRetryUploadJob(threadId, file.filename);
  const isImage = isImageFile(file.filename);
  const fileUrl = resolveArtifactURL(file.path, threadId);
  const progress =
    status?.status === "completed"
      ? 100
      : status?.progress ?? (status ? 10 : 0);
  const statusLabelMap: Record<string, string> = {
    queued: "排队中",
    processing: "处理中",
    completed: "已完成",
    failed: "失败",
    cancelled: "已取消",
  };
  const statusLabel = statusLabelMap[status?.status ?? "queued"] ?? "排队中";
  const progressTone =
    status?.status === "failed"
      ? "bg-rose-500"
      : status?.status === "completed"
        ? "bg-emerald-500"
        : status?.status === "cancelled"
          ? "bg-amber-400"
          : "bg-sky-500";

  if (isImage) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group border-border/40 relative block overflow-hidden rounded-lg border"
      >
        <img
          src={fileUrl}
          alt={file.filename}
          className="h-32 w-auto max-w-[240px] object-cover transition-transform group-hover:scale-105"
        />
      </a>
    );
  }

  const steps = status?.steps ?? {};
  const stepItems = [
    { key: "convert", label: "格式转换" },
    { key: "analyze", label: "内容分析" },
    { key: "index", label: "向量索引" },
  ].map((item) => ({
    ...item,
    state: steps[item.key] ?? "pending",
  }));
  const events = status?.events ?? [];
  const canCancel = status?.status === "queued" || status?.status === "processing";
  const canRetry = status?.status === "failed" || status?.status === "cancelled";
  const statusBadgeTone =
    status?.status === "failed"
      ? "bg-rose-500/10 text-rose-600 border-rose-500/40"
      : status?.status === "completed"
        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/40"
        : status?.status === "cancelled"
          ? "bg-amber-500/10 text-amber-600 border-amber-500/40"
          : "bg-sky-500/10 text-sky-600 border-sky-500/40";

  const renderStepIcon = (state: string) => {
    if (state === "completed") {
      return <CheckCircleIcon className="size-3 text-emerald-500" />;
    }
    if (state === "running") {
      return <Loader2Icon className="size-3 animate-spin text-sky-500" />;
    }
    if (state === "failed") {
      return <XCircleIcon className="size-3 text-rose-500" />;
    }
    if (state === "cancelled") {
      return <BanIcon className="size-3 text-amber-500" />;
    }
    if (state === "skipped") {
      return <CircleIcon className="size-3 text-muted-foreground/50" />;
    }
    return <CircleIcon className="size-3 text-muted-foreground/30" />;
  };

  return (
    <div className="bg-background border-border/40 flex max-w-[360px] min-w-[220px] flex-col gap-2 rounded-lg border p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <FileIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            <span
              className="text-foreground truncate text-sm font-medium"
              title={file.filename}
            >
              {file.filename}
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded px-1.5 py-0.5 text-[10px] font-normal"
              >
                {getFileTypeLabel(file.filename)}
              </Badge>
              <span className="text-muted-foreground text-[10px]">
                {file.size}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", statusBadgeTone)}>
          {statusLabel}
        </Badge>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-[10px]">
        <span className="uppercase tracking-wide">进度</span>
        <span>{progress}%</span>
      </div>
      <div className="bg-muted/40 h-1 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", progressTone)}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-md border border-border/40 bg-muted/30 p-2 text-[10px] text-muted-foreground">
        {stepItems.map((step) => (
          <div key={step.key} className="flex items-center gap-1">
            {renderStepIcon(step.state)}
            <span className="truncate">{step.label}</span>
          </div>
        ))}
      </div>
      {status?.summary ? (
        <p className="text-muted-foreground line-clamp-2 text-[11px] leading-snug">
          {status.summary}
        </p>
      ) : null}
      {status?.language || (status?.keywords && status.keywords.length > 0) ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {status?.language ? (
            <Badge
              variant="secondary"
              className="text-[9px] font-normal text-muted-foreground"
            >
              {status.language}
            </Badge>
          ) : null}
          {status?.keywords?.slice(0, 4).map((keyword) => (
            <Badge
              key={keyword}
              variant="outline"
              className="border-border/60 text-[9px]"
            >
              {keyword}
            </Badge>
          ))}
        </div>
      ) : null}
      {status?.highlights && status.highlights.length > 0 ? (
        <div className="space-y-1 text-[10px] text-muted-foreground">
          {status.highlights.slice(0, 2).map((highlight) => (
            <div key={highlight} className="flex items-start gap-1">
              <span className="text-sky-500">•</span>
              <span className="line-clamp-1">{highlight}</span>
            </div>
          ))}
        </div>
      ) : null}
      {status?.status === "failed" && status?.error ? (
        <div className="flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-600">
          <AlertTriangleIcon className="size-3" />
          <span className="line-clamp-2">{status.error}</span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="h-7 px-2 text-[10px]"
          disabled={!canCancel || cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
        >
          <BanIcon className="size-3" />
          取消
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="h-7 px-2 text-[10px]"
          disabled={!canRetry || retryMutation.isPending}
          onClick={() => retryMutation.mutate()}
        >
          <RefreshCwIcon className="size-3" />
          重试
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="h-7 px-2 text-[10px]"
          asChild
        >
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            查看文件
          </a>
        </Button>
      </div>
      {events.length > 0 ? (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground flex items-center gap-1 text-[10px]"
            >
              阶段日志
              <span className="text-[10px]">({events.length})</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <ScrollArea className="max-h-28 rounded-md border border-border/40 bg-muted/20 px-2 py-1">
              <div className="space-y-1 py-1 text-[10px]">
                {events.slice(-8).map((event, index) => (
                  <div
                    key={`${event.time}-${index}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-muted-foreground/80">
                      {formatTimeAgo(event.time)}
                    </span>
                    <span
                      className={cn(
                        "flex-1 truncate text-right",
                        event.level === "error" && "text-rose-500",
                        event.level === "warning" && "text-amber-500",
                      )}
                    >
                      {event.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

const MessageContent = memo(MessageContent_);
