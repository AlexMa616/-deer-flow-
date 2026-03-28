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
import { formatDescriptionByMode, formatNameByMode } from "./description-translate";
import { SettingsSection } from "./settings-section";

export function ToolSettingsPage() {
  useI18n();
  const { config, isLoading, error } = useMCPConfig();
  const [viewMode, setViewMode] = useBilingualViewMode("both");
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

  return (
    <div className="flex w-full flex-col gap-4">
      {Object.entries(servers).map(([name, config]) => (
        <Item className="w-full" variant="outline" key={name}>
          <ItemContent>
            <ItemTitle>
                <div className="flex items-center gap-2">
                <div>{formatNameByMode(viewMode, name)}</div>
              </div>
            </ItemTitle>
            <ItemDescription className="whitespace-pre-line text-slate-600">
              {formatDescriptionByMode(viewMode, config.description ?? "")}
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
