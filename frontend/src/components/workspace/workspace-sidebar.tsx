"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { RecentChatList } from "./recent-chat-list";
import { SystemPulse } from "./system-pulse";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceNavChatList } from "./workspace-nav-chat-list";
import { WorkspaceNavMenu } from "./workspace-nav-menu";

export function WorkspaceSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { open: isSidebarOpen } = useSidebar();
  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon" {...props}>
        <div className="relative flex h-full flex-col">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.23),transparent_52%),radial-gradient(circle_at_bottom,rgba(129,140,248,0.2),transparent_58%),linear-gradient(180deg,#f9fbff,#eef4ff_65%,#f8fbff)]" />
            <div className="absolute -top-24 right-6 h-48 w-48 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="absolute -bottom-24 left-6 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl" />
          </div>
          <div className="relative z-10 flex h-full flex-col">
            <SidebarHeader className="py-2">
              <div className="rounded-2xl border border-sky-200/80 bg-white/78 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur">
                <WorkspaceHeader />
              </div>
            </SidebarHeader>
            <SidebarContent className="gap-3 overflow-x-hidden overflow-y-auto px-2 pb-3 [&>*]:shrink-0">
              {isSidebarOpen && <SystemPulse className="mb-0.5 shrink-0" />}
              <div className="shrink-0 rounded-2xl border border-sky-200/80 bg-white/78 p-1 shadow-[0_10px_22px_rgba(15,23,42,0.06)] backdrop-blur">
                <WorkspaceNavChatList />
              </div>
              {isSidebarOpen && (
                <div className="shrink-0 rounded-2xl border border-sky-200/80 bg-white/78 p-1 shadow-[0_10px_22px_rgba(15,23,42,0.06)] backdrop-blur">
                  <RecentChatList />
                </div>
              )}
            </SidebarContent>
            <SidebarFooter className="px-2 pb-3">
              <div className="shrink-0 rounded-2xl border border-sky-200/80 bg-white/78 p-1 shadow-[0_10px_22px_rgba(15,23,42,0.06)] backdrop-blur">
                <WorkspaceNavMenu />
              </div>
            </SidebarFooter>
          </div>
        </div>
        <SidebarRail className="z-20" />
      </Sidebar>
    </>
  );
}
