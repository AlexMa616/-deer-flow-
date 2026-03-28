"use client";

import { SearchIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemTitle,
  ItemContent,
  ItemDescription,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/core/i18n/hooks";
import { enUS } from "@/core/i18n/locales/en-US";
import { zhCN } from "@/core/i18n/locales/zh-CN";
import { useEnableSkill, useSkills } from "@/core/skills/hooks";
import type { Skill } from "@/core/skills/type";
import { env } from "@/env";

import {
  BilingualViewToggle,
  formatBilingualText,
  type BilingualViewMode,
  useBilingualViewMode,
} from "./bilingual-view";
import { formatDescriptionByMode } from "./description-translate";
import { SettingsSection } from "./settings-section";

export function SkillSettingsPage({ onClose }: { onClose?: () => void } = {}) {
  const { locale } = useI18n();
  const { skills, isLoading, error } = useSkills();
  const [viewMode, setViewMode] = useBilingualViewMode(
    locale === "zh-CN" ? "zh" : "en",
  );

  return (
    <SettingsSection
      title={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {formatBilingualText(
              viewMode,
              zhCN.settings.skills.title,
              enUS.settings.skills.title,
            )}
          </span>
          <BilingualViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      }
      description={formatBilingualText(
        viewMode,
        zhCN.settings.skills.description,
        enUS.settings.skills.description,
      )}
    >
      {isLoading ? (
        <div className="text-muted-foreground text-sm">
          {formatBilingualText(viewMode, zhCN.common.loading, enUS.common.loading)}
        </div>
      ) : error ? (
        <div>
          {formatBilingualText(viewMode, "加载失败", "Load failed")}: {error.message}
        </div>
      ) : (
        <SkillSettingsList skills={skills} onClose={onClose} viewMode={viewMode} />
      )}
    </SettingsSection>
  );
}

function SkillSettingsList({
  skills,
  onClose,
  viewMode,
}: {
  skills: Skill[];
  onClose?: () => void;
  viewMode: BilingualViewMode;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("public");
  const [query, setQuery] = useState("");
  const { mutate: enableSkill } = useEnableSkill();
  const filteredSkills = useMemo(
    () =>
      skills.filter((skill) => {
        if (skill.category !== filter) return false;
        if (!query.trim()) return true;
        const needle = query.trim().toLowerCase();
        return (
          skill.name.toLowerCase().includes(needle) ||
          skill.description.toLowerCase().includes(needle)
        );
      }),
    [skills, filter, query],
  );
  const enabledCount = useMemo(
    () => filteredSkills.filter((skill) => skill.enabled).length,
    [filteredSkills],
  );
  const handleCreateSkill = () => {
    onClose?.();
    router.push("/workspace/chats/new?mode=skill");
  };
  return (
    <div className="flex w-full flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="public" onValueChange={setFilter}>
            <TabsList variant="line">
              <TabsTrigger value="public">
                {formatBilingualText(viewMode, zhCN.common.public, enUS.common.public)}
              </TabsTrigger>
              <TabsTrigger value="custom">
                {formatBilingualText(viewMode, zhCN.common.custom, enUS.common.custom)}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 rounded-full pl-9"
                placeholder={`${formatBilingualText(viewMode, zhCN.common.search, enUS.common.search)}${formatBilingualText(viewMode, zhCN.settings.skills.title, enUS.settings.skills.title)}...`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Badge variant="secondary" className="rounded-full text-xs">
              {viewMode === "en"
                ? `Enabled ${enabledCount}/${filteredSkills.length}`
                : viewMode === "zh"
                  ? `已启用 ${enabledCount}/${filteredSkills.length}`
                  : `已启用/Enabled ${enabledCount}/${filteredSkills.length}`}
            </Badge>
          </div>
        </div>
        <div>
          <Button size="sm" onClick={handleCreateSkill}>
            <SparklesIcon className="size-4" />
            {formatBilingualText(
              viewMode,
              zhCN.settings.skills.createSkill,
              enUS.settings.skills.createSkill,
            )}
          </Button>
        </div>
      </header>
      {filteredSkills.length === 0 && (
        <EmptySkill onCreateSkill={handleCreateSkill} viewMode={viewMode} />
      )}
      {filteredSkills.length > 0 &&
        filteredSkills.map((skill) => (
          <Item
            className="w-full rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm"
            variant="outline"
            key={skill.name}
          >
            <ItemContent>
              <ItemTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{skill.name}</span>
                  {skill.license && (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {skill.license}
                    </Badge>
                  )}
                </div>
              </ItemTitle>
              <ItemDescription className="whitespace-pre-line text-slate-600">
                {formatDescriptionByMode(viewMode, skill.description ?? "")}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch
                checked={skill.enabled}
                disabled={env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true"}
                onCheckedChange={(checked) =>
                  enableSkill({ skillName: skill.name, enabled: checked })
                }
              />
            </ItemActions>
          </Item>
        ))}
    </div>
  );
}

function EmptySkill({
  onCreateSkill,
  viewMode,
}: {
  onCreateSkill: () => void;
  viewMode: BilingualViewMode;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SparklesIcon />
        </EmptyMedia>
        <EmptyTitle>
          {formatBilingualText(
            viewMode,
            zhCN.settings.skills.emptyTitle,
            enUS.settings.skills.emptyTitle,
          )}
        </EmptyTitle>
        <EmptyDescription>
          {formatBilingualText(
            viewMode,
            zhCN.settings.skills.emptyDescription,
            enUS.settings.skills.emptyDescription,
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onCreateSkill}>
          {formatBilingualText(
            viewMode,
            zhCN.settings.skills.emptyButton,
            enUS.settings.skills.emptyButton,
          )}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
