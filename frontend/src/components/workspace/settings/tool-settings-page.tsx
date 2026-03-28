"use client";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/core/i18n/hooks";
import { enUS } from "@/core/i18n/locales/en-US";
import { zhCN } from "@/core/i18n/locales/zh-CN";
import { useMCPConfig, useEnableMCPServer } from "@/core/mcp/hooks";
import type { MCPServerConfig } from "@/core/mcp/types";
import { env } from "@/env";

import {
  BilingualViewToggle,
  formatBilingualText,
  type BilingualViewMode,
  useBilingualViewMode,
} from "./bilingual-view";
import { SettingsSection } from "./settings-section";

export function ToolSettingsPage() {
  const { locale } = useI18n();
  const { config, isLoading, error } = useMCPConfig();
  const [viewMode, setViewMode] = useBilingualViewMode(
    locale === "zh-CN" ? "zh" : "en",
  );
  const title = formatBilingualText(
    viewMode,
    zhCN.settings.tools.title,
    enUS.settings.tools.title,
  );
  const description = formatBilingualText(
    viewMode,
    zhCN.settings.tools.description,
    enUS.settings.tools.description,
  );

  return (
    <SettingsSection
      title={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{title}</span>
          <BilingualViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      }
      description={description}
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
        config && <MCPServerList servers={config.mcp_servers} viewMode={viewMode} />
      )}
    </SettingsSection>
  );
}

function MCPServerList({
  servers,
  viewMode,
}: {
  servers: Record<string, MCPServerConfig>;
  viewMode: BilingualViewMode;
}) {
  const { mutate: enableMCPServer } = useEnableMCPServer();
  const extraHint = formatBilingualText(
    viewMode,
    "原始说明由服务端提供，如未翻译将保留英文。",
    "Descriptions come from server metadata and may remain in English.",
  );

  return (
    <div className="flex w-full flex-col gap-4">
      {Object.entries(servers).map(([name, config]) => (
        <Item className="w-full" variant="outline" key={name}>
          <ItemContent>
            <ItemTitle>
              <div className="flex items-center gap-2">
                <div>{name}</div>
              </div>
            </ItemTitle>
            <ItemDescription className="line-clamp-4">
              <div>{config.description}</div>
              {viewMode !== "en" ? (
                <div className="mt-1 text-[11px] text-slate-500">{extraHint}</div>
              ) : null}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Switch
              checked={config.enabled}
              disabled={env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true"}
              onCheckedChange={(checked) =>
                enableMCPServer({ serverName: name, enabled: checked })
              }
            />
          </ItemActions>
        </Item>
      ))}
    </div>
  );
}
