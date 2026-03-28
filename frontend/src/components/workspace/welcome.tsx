"use client";

import { SparklesIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AlexMark } from "@/components/brand/alex-mark";
import { useI18n } from "@/core/i18n/hooks";
import { cn } from "@/lib/utils";

export function Welcome({
  className,
}: {
  className?: string;
  mode?: "ultra" | "pro" | "thinking" | "flash";
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const isSkillMode = searchParams.get("mode") === "skill";
  const isChinese = /[\u4e00-\u9fff]/.test(t.welcome.greeting);

  const heroGreeting = isChinese ? "Alex，欢迎回来" : "Welcome back, Alex";
  const heroQuestion = isChinese ? "需要我为你做些什么？" : t.inputBox.placeholder;
  const heroDescription = isChinese
    ? "我可以帮你搜索信息、分析文档、生成图片和视频，也可以协助写作、学习与创作。"
    : "I can search the web, analyze files, generate images and videos, and assist with writing and study.";

  if (isSkillMode) {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-3 px-6 py-4 text-center",
          className,
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/88 px-3 py-1.5 text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.06)] backdrop-blur">
          <SparklesIcon className="size-4 text-sky-500" />
          <span className="text-sm font-medium tracking-wide">
            {t.welcome.createYourOwnSkill}
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          {t.welcome.createYourOwnSkillDescription.replaceAll("\n", " ")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-3 px-6 py-4 text-center",
        className,
      )}
    >
      <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/86 px-3 py-2 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur">
        <SparklesIcon className="size-4 text-indigo-500" />
        <AlexMark compact className="h-8 w-8 rounded-lg" />
        <span className="text-lg font-medium tracking-tight">{heroGreeting}</span>
      </div>
      <h1 className="text-[1.2rem] leading-[1.25] font-black tracking-tight text-slate-900 md:text-[1.35rem]">
        {heroQuestion}
      </h1>
      <p className="max-w-3xl text-sm leading-6 text-slate-500">
        {heroDescription}
      </p>
    </div>
  );
}
