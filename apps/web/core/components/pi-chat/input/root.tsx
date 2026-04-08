/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { ArrowUp, Disc, Globe, GlobeOff, Square } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";

import { PiChatEditorWithRef } from "@plane/editor";
import type { TPiChatEditorRefApi } from "@plane/editor";
import { cn, isCommentEmpty, joinUrlPath } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import useEvent from "@/plane-web/hooks/use-event";
import type { TChatContextData, TFocus, TPiAttachment, TPiLoaders } from "@/types";
// local imports
import { Tooltip } from "@plane/propel/tooltip";
import AudioRecorder, { SPEECH_LOADERS } from "../converse/voice-input";
import { formatSearchQuery } from "../helper";
import { InputPreviewUploads } from "../uploads/input-preview-uploads";
import { DndWrapper } from "./dnd-wrapper";
import { FocusFilter } from "./focus-filter";
import { AiMode } from "./mode";
import { ContextualTemplates } from "../conversation/contextual-templates";
import { WithAiFeatureFlagHOC } from "@/components/feature-flags/with-ai-feature-flag-hoc";
import { QuickActions } from "./quick-actions";
import { ConnectorsPill } from "@/components/marketplace/connectors/connectors-pill";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";

type TEditCommands = {
  getHTML: () => string;
  clear: () => void;
};
type TProps = {
  isFullScreen: boolean;
  className?: string;
  activeChatId?: string;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
  showProgress?: boolean;
  contextData?: TChatContextData;
  onlyInput?: boolean;
};

export const InputBox = observer(function InputBox(props: TProps) {
  const {
    className,
    activeChatId,
    shouldRedirect = true,
    isProjectLevel = false,
    showProgress = false,
    isFullScreen = false,
    contextData,
    onlyInput = false,
  } = props;

  // store hooks
  const {
    isPiTyping,
    isLoading: isChatLoading,
    isNewChat,
    initPiChat,
    getAnswer,
    searchCallback,
    createNewChat,
    getChatFocus,
    fetchModels,
    abortStream,
    getChatMode,
    getChatWebSearch,
    activeModel,
    getModelById,
    activeChat,
    attachmentStore: { getAttachmentsUploadStatusByChatId },
  } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // router
  const { workspaceSlug, projectId, workItem, chatId: routeChatId } = useParams();
  const router = useRouter();
  const { getProjectByIdentifier } = useProject();
  const routerWithProgress = useAppRouter();
  const pathname = usePathname();
  const { fetchMostUsedConnectors } = useConnectors();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString() || "")?.id;
  const [projectIdentifier] = workItem?.split("-") ?? [];
  const projectDetails = getProjectByIdentifier(projectIdentifier);
  const projectIdToUse = projectDetails?.id || projectId;
  const chatFocus = getChatFocus(activeChatId);
  const chatMode = getChatMode(activeChatId || "");
  const chatWebSearch = getChatWebSearch(activeChatId || "");
  const attachmentsUploadStatus = getAttachmentsUploadStatusByChatId(activeChatId || "");
  const activeModelSupportsWebSearch = getModelById(activeModel ?? "")?.supports_web_search ?? false;
  const chatConnectors = activeChat?.mcp_connector_ids || [];
  // state
  const [focus, setFocus] = useState<TFocus>(
    chatFocus || {
      isInWorkspaceContext: true,
      entityType: projectIdToUse ? "project_id" : "workspace_id",
      entityIdentifier: projectIdToUse?.toString() || workspaceId?.toString() || "",
    }
  );
  const [loader, setLoader] = useState<TPiLoaders>("");
  const [attachments, setAttachments] = useState<TPiAttachment[]>([]);
  const [aiMode, setAiMode] = useState<string>(chatMode);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isWebSerachEnabled, setIsWebSerachEnabled] = useState(chatWebSearch);
  const [toggledConnectors, setToggledConnectors] = useState<string[]>([]);
  //ref
  const editorCommands = useRef<TEditCommands | null>(null);
  const editorRef = useRef<TPiChatEditorRefApi>(null);
  const lastKeyRef = useRef<string>("");
  const timeoutRef = useRef<number | null>(null);
  const isConnectorsDisabled = !focus.isInWorkspaceContext || aiMode !== "build";

  useSWR(`PI_MODELS`, () => fetchModels(workspaceId), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });

  useSWR(`MOST_USED_CONNECTORS_${workspaceSlug}`, () => fetchMostUsedConnectors(workspaceSlug), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!activeModelSupportsWebSearch && isWebSerachEnabled) {
      setIsWebSerachEnabled(false);
    }
  }, [activeModelSupportsWebSearch, isWebSerachEnabled]);

  const setEditorCommands = (command: TEditCommands) => {
    editorCommands.current = command;
  };

  const addContext = useCallback(
    (trailingText?: string): void => {
      if (!contextData) {
        editorRef.current?.clearEditor();
        return;
      }

      editorRef.current?.addChatContext(
        {
          id: uuidv4(),
          label: contextData.subTitle || contextData.title || "",
          entity_identifier: contextData.id,
          target: contextData.type,
        },
        trailingText
      );
    },
    [contextData?.id]
  );

  const handleUseTemplate = useCallback(
    (query: string) => {
      if (contextData) {
        addContext(query);
        setTimeout(() => {
          void handleSubmit();
        }, 0);
      } else {
        const formattedQuery = `<p>${query}</p>`;
        editorRef.current?.clearEditor();
        editorRef.current?.setEditorValue(formattedQuery);
        void handleSubmit(undefined, formattedQuery);
      }
    },
    [contextData?.id]
  );

  const handleSubmit = useEvent(async (e?: React.FormEvent, queryArg?: string) => {
    e?.preventDefault();
    const query = queryArg || editorCommands.current?.getHTML();
    if (
      isPiTyping ||
      loader === "submitting" ||
      ((!query || isCommentEmpty(query)) && !attachments.length) ||
      !workspaceId
    )
      return;
    let chatIdToUse = activeChatId;
    setLoader("submitting");
    if (!chatIdToUse) {
      chatIdToUse = await createNewChat(
        focus,
        aiMode,
        isProjectLevel,
        workspaceId,
        isWebSerachEnabled,
        toggledConnectors
      );
    }
    // Don't redirect if we are in the floating chat window
    if (shouldRedirect && !routeChatId)
      (showProgress ? routerWithProgress : router).push(
        joinUrlPath(workspaceSlug?.toString(), isProjectLevel ? "projects" : "", "ai-chat", chatIdToUse)
      );
    const attachmentIds = attachments.map((attachment) => attachment.id);
    void getAnswer(
      chatIdToUse || "",
      query || "",
      focus,
      isProjectLevel,
      workspaceSlug?.toString(),
      workspaceId,
      pathname,
      attachmentIds,
      aiMode,
      isWebSerachEnabled,
      toggledConnectors
    );
    editorCommands.current?.clear();
    addContext();
    setLoader("");
    setAttachments([]);
  });

  const handleAbortStream = (e?: React.FormEvent) => {
    e?.preventDefault();
    abortStream(activeChatId || "");
  };

  const getMentionSuggestions = useEvent(async (query: string) => {
    const response = await searchCallback(workspaceSlug?.toString() || "", query, focus);
    return formatSearchQuery(response);
  });

  const handleConnectorToggle = (connectorId: string) => {
    if (toggledConnectors.includes(connectorId)) {
      setToggledConnectors(toggledConnectors.filter((id) => id !== connectorId));
    } else {
      setToggledConnectors([...toggledConnectors, connectorId]);
    }
  };

  const templateProps = {
    isFullScreen,
    mode: aiMode,
    projectId: projectIdToUse,
    entityId: contextData?.id,
    entityType: contextData?.type,
    onClick: handleUseTemplate,
  };

  useEffect(() => {
    if (chatFocus) {
      const presentFocus = {
        isInWorkspaceContext: chatFocus.isInWorkspaceContext,
        entityType: chatFocus.entityType,
        entityIdentifier: chatFocus.entityIdentifier,
      };
      setFocus(presentFocus);
    }
    if (chatMode) {
      setAiMode(chatMode);
    }
    if (chatWebSearch !== undefined) {
      setIsWebSerachEnabled(chatWebSearch);
    }
    setToggledConnectors(chatConnectors);
  }, [isChatLoading, chatFocus, chatMode, chatWebSearch]);

  // Adding context for the sidecar
  useEffect(() => {
    if (isEditorReady) {
      addContext();
    }
  }, [contextData?.id, isEditorReady, addContext]);

  useEffect(() => {
    const handleKeySequence = (e: KeyboardEvent) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      if (e.key === "Shift") {
        lastKeyRef.current = "Shift";
        // Reset after 1 second
        timeoutRef.current = window.setTimeout(() => {
          lastKeyRef.current = "";
        }, 1000);
        return;
      }

      if (lastKeyRef.current === "Shift" && (e.key === "a" || e.key === "b" || e.key === "n")) {
        e.preventDefault();
        if (e.key === "n") {
          if (isFullScreen) {
            router.push(joinUrlPath(workspaceSlug?.toString(), isProjectLevel ? "projects" : "", "ai-chat"));
          } else {
            void initPiChat();
          }
        } else {
          setAiMode(e.key === "a" ? "ask" : "build");
        }
        editorRef.current?.focus("end");
      }

      lastKeyRef.current = "";
    };

    document.addEventListener("keydown", handleKeySequence);
    return () => {
      document.removeEventListener("keydown", handleKeySequence);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [setAiMode, isFullScreen, isProjectLevel, router, initPiChat, workspaceSlug]);

  if (!workspaceId) return;

  return (
    <>
      {isNewChat && !onlyInput && !isFullScreen && (
        <div className="flex flex-col gap-4 mt-4 w-full">
          <div className={cn("text-start text-h4-regular text-primary")}>What can I do for you?</div>
          <ContextualTemplates {...templateProps} />
        </div>
      )}

      <form
        className={cn(
          "flex flex-col px-2 md:px-0 rounded-2xl w-full my-auto",
          {
            "absolute bottom-[32px] left-0": !onlyInput && (!isNewChat || !isFullScreen),
          },
          className
        )}
      >
        {isNewChat && !onlyInput && isFullScreen && (
          <div className="flex flex-col gap-2.5 mb-6">
            <div className={cn("text-center text-h3-medium text-primary")}>What can I do for you?</div>
          </div>
        )}
        <div
          className={cn("rounded-2xl transition-[max-height] duration-100", {
            "bg-layer-1": onlyInput,
          })}
        >
          {/* Audio Recorder Loader */}
          {SPEECH_LOADERS.includes(loader) && (
            <div className="flex gap-2 p-2 items-center">
              <Disc className="size-3 text-danger-primary" strokeWidth={3} />
              <span className="text-caption-md-medium text-secondary">Recording...</span>
            </div>
          )}
          {/* Input Box */}
          <DndWrapper
            workspaceSlug={workspaceSlug?.toString()}
            workspaceId={workspaceId}
            chatId={activeChatId}
            setAttachments={setAttachments}
            isProjectLevel={isProjectLevel}
            mode={aiMode}
            createNewChat={() =>
              createNewChat(focus, aiMode, isProjectLevel, workspaceId, isWebSerachEnabled, toggledConnectors)
            }
            focus={focus}
            showBg={isNewChat && !onlyInput && isFullScreen}
          >
            {(isUploading: boolean, open: () => void) => (
              <div
                className={cn(
                  "bg-layer-2 rounded-2xl p-3 flex flex-col gap-1 shadow-raised-100 border border-subtle-1 justify-between h-fit",
                  {
                    "min-h-[120px]": !SPEECH_LOADERS.includes(loader),
                  }
                )}
              >
                {/* file input view */}
                {((attachmentsUploadStatus && attachmentsUploadStatus.length > 0) || attachments?.length > 0) && (
                  <div className="mb-2">
                    <InputPreviewUploads
                      chatId={activeChatId}
                      attachments={attachments}
                      setAttachments={setAttachments}
                    />
                  </div>
                )}
                {/* Focus */}
                {!SPEECH_LOADERS.includes(loader) && (
                  <div className="mb-2 w-fit">
                    <FocusFilter
                      workspaceId={workspaceId}
                      projectId={projectIdToUse}
                      focus={focus}
                      setFocus={setFocus}
                      isLoading={isChatLoading && !!activeChatId}
                    />
                  </div>
                )}
                {/* editor view */}
                <PiChatEditorWithRef
                  setEditorCommand={(command: TEditCommands) => {
                    setEditorCommands({ ...command });
                  }}
                  handleSubmit={() => void handleSubmit()}
                  searchCallback={getMentionSuggestions}
                  className={cn("flex-1  max-h-[250px] min-h-[50px]", {
                    "absolute w-0": SPEECH_LOADERS.includes(loader),
                  })}
                  onEditorReady={() => setIsEditorReady(true)}
                  ref={editorRef}
                />
                <div className="flex items-center w-full gap-3 justify-between">
                  {/* Focus */}
                  {!SPEECH_LOADERS.includes(loader) && (
                    <QuickActions
                      workspaceSlug={workspaceSlug?.toString()}
                      open={open}
                      isUploading={isUploading}
                      toggledConnectors={toggledConnectors}
                      handleConnectorToggle={handleConnectorToggle}
                      mode={aiMode}
                      isConnectorsDisabled={isConnectorsDisabled}
                    />
                  )}
                  {!SPEECH_LOADERS.includes(loader) && <AiMode aiMode={aiMode} setAiMode={setAiMode} />}
                  {!SPEECH_LOADERS.includes(loader) && (
                    <Tooltip
                      tooltipContent={
                        activeModelSupportsWebSearch
                          ? isWebSerachEnabled
                            ? "Disable web search"
                            : "Enable web search"
                          : "Web search is not available for this model"
                      }
                      position="top"
                    >
                      <button
                        type="button"
                        className={cn(
                          "size-7 flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 text-secondary bg-layer-3 hover:bg-layer-1",
                          {
                            "text-icon-disabled": !isWebSerachEnabled || !activeModelSupportsWebSearch,
                            "cursor-not-allowed opacity-50": !activeModelSupportsWebSearch,
                          }
                        )}
                        color={isWebSerachEnabled ? "primary" : "secondary"}
                        onClick={() => activeModelSupportsWebSearch && setIsWebSerachEnabled(!isWebSerachEnabled)}
                      >
                        {isWebSerachEnabled ? <Globe className="size-4" /> : <GlobeOff className="size-4" />}
                      </button>
                    </Tooltip>
                  )}
                  <WithAiFeatureFlagHOC
                    flag="AI_MCP_CONNECTORS"
                    disabledFallback={<></>}
                    workspaceSlug={workspaceSlug?.toString() || ""}
                  >
                    {!SPEECH_LOADERS.includes(loader) && (
                      <ConnectorsPill
                        workspaceSlug={workspaceSlug?.toString()}
                        toggledConnectors={toggledConnectors}
                        handleConnectorToggle={handleConnectorToggle}
                        isDisabled={isConnectorsDisabled}
                      />
                    )}
                  </WithAiFeatureFlagHOC>
                  <div className="flex items-center w-full justify-end gap-2">
                    <div className="flex w-full justify-end">
                      {/* speech recorder */}
                      <WithAiFeatureFlagHOC
                        workspaceSlug={workspaceSlug?.toString()}
                        flag={E_FEATURE_FLAGS.AI_CONVERSE}
                      >
                        <AudioRecorder
                          workspaceId={workspaceId}
                          chatId={activeChatId}
                          editorRef={editorRef}
                          createNewChat={() =>
                            createNewChat(
                              focus,
                              aiMode,
                              isProjectLevel,
                              workspaceId,
                              isWebSerachEnabled,
                              toggledConnectors
                            )
                          }
                          loader={loader}
                          setLoader={setLoader}
                          isFullScreen={isFullScreen}
                        />
                      </WithAiFeatureFlagHOC>
                    </div>
                    {!SPEECH_LOADERS.includes(loader) && (
                      <button
                        className={cn(
                          "rounded-full bg-accent-primary text-on-color size-8 flex items-center justify-center flex-shrink-0 transition-all duration-300 disabled:bg-layer-1 disabled:text-icon-secondary",
                          {
                            "bg-layer-1 text-icon-secondary": isPiTyping || loader === "submitting",
                          }
                        )}
                        type="submit"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.preventDefault();
                          if (isPiTyping) {
                            void handleAbortStream();
                          } else {
                            void handleSubmit();
                          }
                        }}
                        disabled={loader === "submitting"}
                      >
                        {!isPiTyping || loader === "submitting" ? (
                          <ArrowUp size={16} />
                        ) : (
                          <Square
                            size={16}
                            className={cn("text-icon-secondary transition-all")}
                            fill="currentColor"
                            strokeWidth={0}
                          />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DndWrapper>
        </div>
        {isNewChat && !onlyInput && isFullScreen && <ContextualTemplates {...templateProps} />}
      </form>
      <div
        className={cn("w-full text-caption-sm-regular text-disabled pt-2 text-center bg-surface-1 h-[32px]", {
          "absolute bottom-0 left-[50%] translate-x-[-50%]": !onlyInput,
        })}
      >
        <div className="mx-auto max-w-[400px]">Plane AI can make mistakes, please double-check responses. </div>
      </div>
    </>
  );
});
