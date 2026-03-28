"use client";

import type { Message } from "@langchain/langgraph-sdk";
import type { UseStream } from "@langchain/langgraph-sdk/react";
import { FilesIcon, XIcon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import { usePromptInputController } from "@/components/ai-elements/prompt-input";
import { AlexMark } from "@/components/brand/alex-mark";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
import {
  ArtifactFileDetail,
  ArtifactFileList,
  useArtifacts,
} from "@/components/workspace/artifacts";
import { InputBox } from "@/components/workspace/input-box";
import { MessageList } from "@/components/workspace/messages";
import { ThreadContext } from "@/components/workspace/messages/context";
import { SemanticSearchFloating } from "@/components/workspace/semantic";
import { ThreadTitle } from "@/components/workspace/thread-title";
import { TodoList } from "@/components/workspace/todo-list";
import { Tooltip } from "@/components/workspace/tooltip";
import { Welcome } from "@/components/workspace/welcome";
import { useI18n } from "@/core/i18n/hooks";
import { useNotification } from "@/core/notification/hooks";
import { useLocalSettings } from "@/core/settings";
import { type AgentThread, type AgentThreadState } from "@/core/threads";
import { useSubmitThread, useThreadStream } from "@/core/threads/hooks";
import {
  pathOfThread,
  textOfMessage,
  titleOfThread,
} from "@/core/threads/utils";
import { useUploadStatusStream } from "@/core/uploads/hooks";
import { uuid } from "@/core/utils/uuid";
import { env } from "@/env";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [settings, setSettings] = useLocalSettings();
  const { setOpen: setSidebarOpen } = useSidebar();
  const {
    artifacts,
    open: artifactsOpen,
    setOpen: setArtifactsOpen,
    setArtifacts,
    select: selectArtifact,
    selectedArtifact,
  } = useArtifacts();
  const { thread_id: threadIdFromPath } = useParams<{ thread_id: string }>();
  const searchParams = useSearchParams();
  const promptInputController = usePromptInputController();
  const inputInitialValue = useMemo(() => {
    if (threadIdFromPath !== "new" || searchParams.get("mode") !== "skill") {
      return undefined;
    }
    return t.inputBox.createSkillPrompt;
  }, [threadIdFromPath, searchParams, t.inputBox.createSkillPrompt]);
  const lastInitialValueRef = useRef<string | undefined>(undefined);
  const setInputRef = useRef(promptInputController.textInput.setInput);
  setInputRef.current = promptInputController.textInput.setInput;
  useEffect(() => {
    if (inputInitialValue && inputInitialValue !== lastInitialValueRef.current) {
      lastInitialValueRef.current = inputInitialValue;
      setTimeout(() => {
        setInputRef.current(inputInitialValue);
        const textarea = document.querySelector("textarea");
        if (textarea) {
          textarea.focus();
          textarea.selectionStart = textarea.value.length;
          textarea.selectionEnd = textarea.value.length;
        }
      }, 100);
    }
  }, [inputInitialValue]);
  const isNewThread = useMemo(
    () => threadIdFromPath === "new",
    [threadIdFromPath],
  );
  const [threadId, setThreadId] = useState<string | null>(null);
  useEffect(() => {
    if (threadIdFromPath !== "new") {
      setThreadId(threadIdFromPath);
    } else {
      setThreadId(uuid());
    }
  }, [threadIdFromPath]);
  useUploadStatusStream(threadId ?? "");

  const { showNotification } = useNotification();
  const [finalState, setFinalState] = useState<AgentThreadState | null>(null);
  const thread = useThreadStream({
    isNewThread,
    threadId,
    onFinish: (state) => {
      setFinalState(state);
      if (document.hidden || !document.hasFocus()) {
        let body = "Conversation finished";
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage) {
          const textContent = textOfMessage(lastMessage);
          if (textContent) {
            if (textContent.length > 200) {
              body = textContent.substring(0, 200) + "...";
            } else {
              body = textContent;
            }
          }
        }
        showNotification(state.title, {
          body,
        });
      }
    },
  }) as unknown as UseStream<AgentThreadState>;
  useEffect(() => {
    if (thread.isLoading) setFinalState(null);
  }, [thread.isLoading]);

  const title = useMemo(() => {
    let result = isNewThread
      ? ""
      : titleOfThread(thread as unknown as AgentThread);
    if (result === "Untitled") {
      result = "";
    }
    return result;
  }, [thread, isNewThread]);

  useEffect(() => {
    const pageTitle = isNewThread
      ? t.pages.newChat
      : thread.values?.title && thread.values.title !== "Untitled"
        ? thread.values.title
        : t.pages.untitled;
    if (thread.isThreadLoading) {
      document.title = `Loading... - ${t.pages.appName}`;
    } else {
      document.title = `${pageTitle} - ${t.pages.appName}`;
    }
  }, [
    isNewThread,
    t.pages.newChat,
    t.pages.untitled,
    t.pages.appName,
    thread.values.title,
    thread.isThreadLoading,
  ]);

  const [autoSelectFirstArtifact, setAutoSelectFirstArtifact] = useState(true);
  useEffect(() => {
    setArtifacts(thread.values.artifacts);
    if (
      env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true" &&
      autoSelectFirstArtifact
    ) {
      if (thread?.values?.artifacts?.length > 0) {
        setAutoSelectFirstArtifact(false);
        selectArtifact(thread.values.artifacts[0]!);
      }
    }
  }, [
    autoSelectFirstArtifact,
    selectArtifact,
    setArtifacts,
    thread.values.artifacts,
  ]);

  const artifactPanelOpen = useMemo(() => {
    if (env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true") {
      return artifactsOpen && artifacts?.length > 0;
    }
    return artifactsOpen;
  }, [artifactsOpen, artifacts]);

  const [todoListCollapsed, setTodoListCollapsed] = useState(true);
  const [semanticReady, setSemanticReady] = useState(false);
  const showWelcome = useMemo(() => {
    if (isNewThread) return true;
    return (thread.values.messages?.length ?? 0) === 0;
  }, [isNewThread, thread.values.messages?.length]);

  useEffect(() => {
    setSemanticReady(false);
    const timer = window.setTimeout(() => setSemanticReady(true), 420);
    return () => window.clearTimeout(timer);
  }, [threadId]);

  const handleSubmit = useSubmitThread({
    isNewThread,
    threadId,
    thread,
    threadContext: {
      ...settings.context,
      thinking_enabled: settings.context.mode !== "flash",
      is_plan_mode:
        settings.context.mode === "pro" || settings.context.mode === "ultra",
      subagent_enabled: settings.context.mode === "ultra",
    },
    afterSubmit() {
      router.push(pathOfThread(threadId!));
    },
  });
  const handleStop = useCallback(async () => {
    await thread.stop();
  }, [thread]);

  if (!threadId) {
    return null;
  }

  return (
    <ThreadContext.Provider value={{ threadId, thread }}>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          className="relative"
          defaultSize={artifactPanelOpen ? 46 : 100}
          minSize={artifactPanelOpen ? 30 : 100}
        >
          <div className="relative flex size-full min-h-0 justify-between overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_4%,rgba(34,211,238,0.22),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(129,140,248,0.2),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(45,212,191,0.12),transparent_48%),linear-gradient(180deg,#fbfdff,#eef4ff_56%,#f9fbff)]" />
              <div className="absolute -top-24 right-16 h-72 w-72 rounded-full bg-sky-200/45 blur-3xl" />
              <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />
            </div>
            <header
              className={cn(
                "absolute top-0 right-0 left-0 z-30 flex h-12 shrink-0 items-center px-4",
                isNewThread
                  ? "bg-background/0 backdrop-blur-none"
                  : "border-b border-slate-200/70 bg-white/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur",
              )}
            >
              {isNewThread ? (
                <div className="flex w-full items-center justify-between">
                  <div className="inline-flex items-center gap-2.5">
                    <AlexMark compact className="h-8 w-8 rounded-lg" />
                    <span className="text-2xl font-medium tracking-tight text-slate-800">
                      Alex
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-700">
                      PRO
                    </span>
                    <AlexMark compact className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex w-full items-center text-sm font-medium">
                    {title !== "Untitled" && (
                      <ThreadTitle threadId={threadId} threadTitle={title} />
                    )}
                  </div>
                  <div>
                    {artifacts?.length > 0 && !artifactsOpen && (
                      <Tooltip content="Show artifacts of this conversation">
                        <Button
                          className="text-muted-foreground hover:text-foreground"
                          variant="ghost"
                          onClick={() => {
                            setArtifactsOpen(true);
                            setSidebarOpen(false);
                          }}
                        >
                          <FilesIcon />
                          {t.common.artifacts}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </>
              )}
            </header>
            <main className="flex min-h-0 max-w-full grow flex-col">
              <div className="flex size-full justify-center">
                <MessageList
                  className={cn("size-full", !isNewThread && "pt-10")}
                  threadId={threadId}
                  thread={thread}
                  messagesOverride={
                    !thread.isLoading && finalState?.messages
                      ? (finalState.messages as Message[])
                      : undefined
                  }
                  paddingBottom={todoListCollapsed ? 160 : 280}
                />
              </div>
              {semanticReady && <SemanticSearchFloating threadId={threadId} />}
              <div className="absolute right-0 bottom-0 left-0 z-30 flex justify-center px-4">
                <div
                  className={cn(
                    "relative w-full",
                    isNewThread && "-translate-y-[calc(50vh-96px)]",
                    isNewThread
                      ? "max-w-(--container-width-sm)"
                      : "max-w-(--container-width-md)",
                  )}
                >
                  <div className="absolute -top-4 right-0 left-0 z-0">
                    <div className="absolute right-0 bottom-0 left-0">
                      <TodoList
                        className="border border-sky-200/70 bg-white/82 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur"
                        todos={thread.values.todos ?? []}
                        collapsed={todoListCollapsed}
                        hidden={
                          !thread.values.todos ||
                          thread.values.todos.length === 0
                        }
                        onToggle={() =>
                          setTodoListCollapsed(!todoListCollapsed)
                        }
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <InputBox
                      className={cn(
                        "w-full -translate-y-4 border border-slate-200/85 bg-white/92 text-slate-900 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl",
                      )}
                      isNewThread={showWelcome}
                      autoFocus={isNewThread}
                      status={thread.isLoading ? "streaming" : "ready"}
                      context={settings.context}
                      extraHeader={
                        showWelcome && <Welcome mode={settings.context.mode} />
                      }
                      disabled={env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true"}
                      onContextChange={(context) =>
                        setSettings("context", context)
                      }
                      onSubmit={handleSubmit}
                      onStop={handleStop}
                    />
                  </div>
                  {env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true" && (
                    <div className="text-muted-foreground/67 w-full translate-y-12 text-center text-xs">
                      {t.common.notAvailableInDemoMode}
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </ResizablePanel>
        <ResizableHandle
          className={cn(
            "opacity-33 hover:opacity-100",
            !artifactPanelOpen && "pointer-events-none opacity-0",
          )}
        />
        <ResizablePanel
          className={cn(
            "transition-all duration-300 ease-in-out",
            !artifactsOpen && "opacity-0",
          )}
          defaultSize={artifactPanelOpen ? 64 : 0}
          minSize={0}
          maxSize={artifactPanelOpen ? undefined : 0}
        >
          <div
            className={cn(
              "h-full p-4 transition-transform duration-300 ease-in-out",
              artifactPanelOpen ? "translate-x-0" : "translate-x-full",
            )}
          >
            {selectedArtifact ? (
              <ArtifactFileDetail
                className="size-full"
                filepath={selectedArtifact}
                threadId={threadId}
              />
            ) : (
              <div className="relative flex size-full justify-center">
                <div className="absolute top-1 right-1 z-30">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setArtifactsOpen(false);
                    }}
                  >
                    <XIcon />
                  </Button>
                </div>
                {thread.values.artifacts?.length === 0 ? (
                  <ConversationEmptyState
                    icon={<FilesIcon />}
                    title="No artifact selected"
                    description="Select an artifact to view its details"
                  />
                ) : (
                  <div className="flex size-full max-w-(--container-width-sm) flex-col justify-center p-4 pt-8">
                    <header className="shrink-0">
                      <h2 className="text-lg font-medium">Artifacts</h2>
                    </header>
                    <main className="min-h-0 grow">
                      <ArtifactFileList
                        className="max-w-(--container-width-sm) p-4 pt-12"
                        files={thread.values.artifacts ?? []}
                        threadId={threadId}
                      />
                    </main>
                  </div>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ThreadContext.Provider>
  );
}
