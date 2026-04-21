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

import { update, set, isEmpty } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { PI_URL } from "@plane/constants";
// plane web imports
import { WorkspaceService } from "@/services/workspace.service";
import { PiChatService } from "@/services/pi-chat.service";
import type { RootStore } from "@/plane-web/store/root.store";
import type {
  TAiModels,
  TChatHistory,
  TDialogue,
  TFocus,
  TInitPayload,
  TQuery,
  TUserThreads,
  TArtifact,
  TUpdatedArtifact,
  TFollowUpResponse,
  TInstanceResponse,
  TSSEDeltaEvent,
  TSSEReasoningEvent,
  TSSETodosEvent,
  TSSEActionsEvent,
  TSSETitleResponse,
  TTemplate,
} from "@/types";
import { ESource, EExecutionStatus } from "@/types";
import { ArtifactsStore } from "./artifacts";
import { PiChatAttachmentStore } from "./attachment.store";
import type { TSearchResults, EAiFeedback } from "@plane/types";

export interface IPiChatStore {
  isNewChat: boolean;
  activeChatId: string;
  activeChat: TChatHistory;
  chatMap: Record<string, TChatHistory>; // chat_id -> chat
  isLoadingThreads: boolean;
  piThreads: string[];
  projectThreads: string[];
  activeModel: string | undefined;
  models: TAiModels[];

  isAuthorized: boolean;
  isWorkspaceAuthorized: boolean;
  favoriteChats: string[];
  isLoading: boolean;
  isPiTyping: boolean;
  isPiArtifactsDrawerOpen: string | undefined;
  artifactsStore: ArtifactsStore;
  attachmentStore: PiChatAttachmentStore;
  // computed fn
  getDefaultLLM: () => string;
  geUserThreads: () => TUserThreads[];
  geUserThreadsByWorkspaceId: (workspaceId: string | undefined) => TUserThreads[];
  geFavoriteChats: (isProjectChat: boolean) => TUserThreads[];
  getChatById: (chatId: string) => TChatHistory;
  getChatFocus: (chatId: string | undefined) => TFocus | undefined;
  getChatMode: (chatId: string) => string;
  getChatWebSearch: (chatId: string) => boolean;
  getModelById: (modelId: string) => TAiModels | undefined;
  getLatestMessageId: (chatId: string) => string;
  // actions
  initPiChat: (chatId?: string) => void;
  fetchChatById: (chatId: string, workspaceId: string | undefined) => Promise<void>;
  getAnswer: (
    chatId: string,
    query: string,
    focus: TFocus,
    isProjectChat: boolean,
    workspaceSlug: string,
    workspaceId: string | undefined,
    callbackUrl: string,
    attachmentIds: string[],
    aiMode: string,
    is_websearch_enabled: boolean,
    toggledConnectors: string[]
  ) => void;
  getInstance: (workspaceSlug: string) => Promise<TInstanceResponse | void>;
  fetchUserThreads: (workspaceId: string | undefined, isProjectChat: boolean) => Promise<void>;
  searchCallback: (workspace: string, query: string, focus: TFocus) => Promise<TSearchResults>;
  sendFeedback: (
    chatId: string,
    message_index: number,
    feedback: EAiFeedback,
    workspaceId?: string,
    feedbackMessage?: string
  ) => Promise<void>;
  executeAction: (workspaceId: string, chatId: string, actionId: string) => Promise<string[] | undefined>;
  fetchModels: (workspaceId?: string) => Promise<void>;
  abortStream: (chatId: string) => void;
  setActiveModel: (chatId: string, model: string) => void;
  createNewChat: (
    focus: TFocus,
    mode: string,
    isProjectChat: boolean,
    workspaceId: string | undefined,
    is_websearch_enabled: boolean,
    toggledConnectors: string[]
  ) => Promise<string>;
  renameChat: (chatId: string, title: string, workspaceId: string | undefined) => Promise<void>;
  deleteChat: (chatId: string, workspaceSlug: string) => Promise<void>;
  favoriteChat: (chatId: string, workspaceId: string | undefined) => Promise<void>;
  unfavoriteChat: (chatId: string, workspaceId: string | undefined) => Promise<void>;
  fetchRecentChats: (workspaceId: string | undefined, isProjectChat: boolean) => Promise<void>;
  fetchFavoriteChats: (workspaceId: string | undefined, isProjectChat: boolean) => Promise<void>;
  togglePiArtifactsDrawer: (value?: string) => void;
  regenerateAnswer: (chatId: string, token: string, workspaceId: string | undefined) => Promise<void>;
  getGroupedArtifactsByDialogue: (
    chatId: string,
    messageId: string
  ) => {
    successful: TArtifact[];
    failed: TArtifact[];
  };
  followUp: (
    artifactId: string,
    query: string,
    messageId: string,
    projectId: string | undefined,
    workspace_id: string,
    chat_id: string,
    entity_type: string,
    artifactData: TUpdatedArtifact
  ) => Promise<TFollowUpResponse>;
  convertToPage: (
    description: string,
    workspaceSlug: string,
    projectId: string | undefined,
    chatId: string
  ) => Promise<{
    page_url: string;
  }>;
  fetchPrompts: (
    workspaceId: string,
    mode: string,
    projectId: string | undefined,
    entityId: string | undefined,
    entityType: string | undefined
  ) => Promise<{ templates: TTemplate[] }>;
}

export class PiChatStore implements IPiChatStore {
  activeChatId = "";
  isNewChat: boolean = false;
  isLoadingThreads: boolean = false;
  models: TAiModels[] = [];
  activeModel: string | undefined = undefined;
  isAuthorized = false;
  isWorkspaceAuthorized = false;
  chatMap: Record<string, TChatHistory> = {};
  piThreads: string[] = [];
  projectThreads: string[] = [];
  isPiTypingMap: Record<string, boolean> = {};
  isLoadingMap: Record<string, boolean> = {};
  favoriteChats: string[] = [];
  isPiArtifactsDrawerOpen: string | undefined = undefined;
  eventSources: Record<string, EventSource> = {};
  //services
  userStore;
  rootStore;
  piChatService;
  workspaceService;
  // store
  artifactsStore;

  attachmentStore: PiChatAttachmentStore;
  constructor(public store: RootStore) {
    makeObservable(this, {
      //observables
      isNewChat: observable,
      activeChatId: observable,
      chatMap: observable,
      piThreads: observable,
      projectThreads: observable,
      models: observable,
      activeModel: observable,
      isPiTypingMap: observable,
      isLoadingMap: observable,
      isAuthorized: observable,
      isWorkspaceAuthorized: observable,
      isLoadingThreads: observable,
      favoriteChats: observable,
      isPiArtifactsDrawerOpen: observable.ref,
      eventSources: observable,
      // computed
      activeChat: computed,
      isPiTyping: computed,
      isLoading: computed,
      // actions
      initPiChat: action,
      getAnswer: action,
      getInstance: action,
      fetchUserThreads: action,
      searchCallback: action,
      sendFeedback: action,
      fetchModels: action,
      setActiveModel: action,
      createNewChat: action,
      renameChat: action,
      deleteChat: action,
      favoriteChat: action,
      unfavoriteChat: action,
      fetchRecentChats: action,
      fetchFavoriteChats: action,
      togglePiArtifactsDrawer: action,
      executeAction: action,
      followUp: action,
      convertToPage: action,
      abortStream: action,
      fetchPrompts: action,
    });

    //services
    this.rootStore = store;
    this.userStore = store.user;
    this.attachmentStore = new PiChatAttachmentStore(this);
    this.piChatService = new PiChatService();
    this.workspaceService = new WorkspaceService();
    this.artifactsStore = new ArtifactsStore();
  }

  get activeChat() {
    return this.chatMap[this.activeChatId];
  }

  get isPiTyping() {
    return this.isPiTypingMap[this.activeChatId] ?? false;
  }

  get isLoading() {
    return this.isLoadingMap[this.activeChatId] ?? false;
  }

  setActiveModel = (chatId: string, model: string) => {
    this.activeModel = model;
    if (!chatId) return;
    update(this.chatMap, chatId, (chat: TChatHistory) => {
      chat.llm = model;
      return chat;
    });
  };

  // computed
  getDefaultLLM = computedFn(() => this.models.find((model) => model.is_default)?.id || "gpt-5.2");

  geUserThreads = computedFn(() => this.piThreads.map((chatId) => this.chatMap[chatId]) || []);

  geUserThreadsByWorkspaceId = computedFn((workspaceId: string | undefined) => {
    if (!workspaceId) return [];
    return (
      this.projectThreads
        .filter((chatId) => this.chatMap[chatId]?.workspace_id === workspaceId)
        .map((chatId) => this.chatMap[chatId]) || []
    );
  });

  geFavoriteChats = computedFn((isProjectChat: boolean = false) => {
    if (!this.favoriteChats) return [];
    const chatIds = isProjectChat
      ? this.favoriteChats.filter((chatId) => this.projectThreads.includes(chatId))
      : this.favoriteChats.filter((chatId) => this.piThreads.includes(chatId));
    return chatIds?.map((chatId) => this.chatMap[chatId]) || [];
  });

  getChatById = computedFn((chatId: string) => this.chatMap[chatId]);

  getChatFocus = computedFn((chatId: string | undefined) => {
    const chat = chatId && this.chatMap[chatId];
    if (chat) {
      return {
        isInWorkspaceContext: chat.is_focus_enabled,
        entityType: chat.focus_project_id ? "project_id" : "workspace_id",
        entityIdentifier: chat.focus_project_id || chat.focus_workspace_id,
      };
    }
  });

  getChatMode = computedFn((chatId: string) => {
    const chat = this.chatMap[chatId];
    if (chat) {
      return chat.mode || "ask";
    }
    return "ask";
  });

  getModelById = computedFn((modelId: string) => this.models.find((model) => model.id === modelId));

  getChatWebSearch = computedFn((chatId: string) => {
    const chat = this.chatMap[chatId];
    if (chat) {
      return chat.is_websearch_enabled || false;
    }
    return false;
  });

  getGroupedArtifactsByDialogue = computedFn((chatId: string, messageId: string) => {
    const dialogue = this.chatMap[chatId]?.dialogueMap[messageId];
    const response: {
      successful: TArtifact[];
      failed: TArtifact[];
    } = {
      successful: [],
      failed: [],
    };
    if (!dialogue || !dialogue.actions) return response;
    dialogue.actions.forEach((action) => {
      const artifact = this.artifactsStore.getArtifact(action.artifact_id);
      if (!artifact) return;

      // Pull in error/message/entity info from the action as a backup.
      // This way, users still see why an action failed even after a page refresh.
      const mergedArtifact: TArtifact = {
        ...artifact,
        action: artifact.action || action.action,
        artifact_type: artifact.artifact_type || action.artifact_type,
        entity_name: artifact.entity_name || action.entity?.entity_name,
        entity_url: artifact.entity_url || action.entity?.entity_url,
        // If we have live artifact error/message, use that; otherwise, fall back
        // to the error/message that came back with the chat history.
        error: artifact.error ?? action.error,
        message: artifact.message ?? action.message,
      };

      if (action.success) {
        response.successful.push(mergedArtifact);
      } else {
        response.failed.push(mergedArtifact);
      }
    });
    return response;
  });

  getLatestMessageId = computedFn((chatId: string) => {
    const chat = this.chatMap[chatId];
    if (chat && chat.dialogue?.length > 0) {
      return chat.dialogue[chat.dialogue.length - 1];
    }
    return "";
  });

  // actions
  initPiChat = (chatId?: string) => {
    if (chatId) {
      this.activeChatId = chatId;
      this.isNewChat = false;
      this.rootStore.theme.updateSidecarChatId(chatId);
    } else {
      this.activeChatId = "";
      this.isNewChat = true;
      this.rootStore.theme.updateSidecarChatId("");
    }
    this.isAuthorized = true;
    this.isPiArtifactsDrawerOpen = undefined;
  };

  createNewChat = async (
    focus: TFocus,
    mode: string,
    isProjectChat: boolean = false,
    workspaceId: string | undefined,
    is_websearch_enabled: boolean,
    toggledConnectors: string[]
  ) => {
    this.isNewChat = true;
    let payload: TInitPayload = {
      workspace_in_context: focus.isInWorkspaceContext,
      is_project_chat: isProjectChat,
      workspace_id: workspaceId,
      mcp_connector_ids: toggledConnectors,
    };
    if (focus.isInWorkspaceContext) {
      payload = {
        ...payload,
        [focus.entityType]: focus.entityIdentifier,
        workspace_id: workspaceId,
      };
    }

    const newChatId = await this.piChatService.createChat(payload);
    this.activeChatId = newChatId;
    this.rootStore.theme.updateSidecarChatId(newChatId);

    this.chatMap[newChatId] = {
      chat_id: newChatId,
      dialogue: [],
      dialogueMap: {},
      title: "New Chat",
      llm: this.activeModel,
      last_modified: new Date().toISOString(),
      is_favorite: false,
      is_focus_enabled: focus.isInWorkspaceContext,
      focus_workspace_id: focus.entityType === "workspace_id" ? focus.entityIdentifier : "",
      focus_project_id: focus.entityType === "project_id" ? focus.entityIdentifier : "",
      workspace_id: workspaceId,
      mode,
      is_websearch_enabled,
      mcp_connector_ids: toggledConnectors,
    };

    if (isProjectChat) {
      this.projectThreads = [newChatId, ...this.projectThreads];
    } else {
      this.piThreads = [newChatId, ...this.piThreads];
    }

    const workspaceSlug = this.rootStore.router.workspaceSlug;

    // Auto-complete getting started checklist
    if (workspaceSlug) {
      void this.rootStore.preferencesRoot.workspace.updateChecklistIfNotDoneAlready(
        workspaceSlug.toString(),
        "ai_chat_tried"
      );
    }

    return newChatId;
  };

  buildPayload = (
    chatId: string,
    query: string,
    focus: TFocus,
    isProjectChat: boolean = false,
    workspaceSlug: string,
    workspaceId: string | undefined,
    callbackUrl: string | undefined,
    attachmentIds: string[],
    isNewChat: boolean,
    mode: string,
    is_websearch_enabled: boolean,
    toggledConnectors: string[]
  ) => {
    let payload: TQuery = {
      chat_id: chatId,
      query,
      is_new: isNewChat,
      is_temp: false,
      workspace_in_context: focus.isInWorkspaceContext,
      source: ESource.WEB,
      llm: this.activeModel || this.getDefaultLLM(),
      context: this.userStore.data
        ? {
            first_name: this.userStore.data.first_name,
            last_name: this.userStore.data.last_name,
            email: this.userStore.data.email,
          }
        : {},
      is_project_chat: isProjectChat,
      workspace_slug: workspaceSlug,
      workspace_id: workspaceId,
      attachment_ids: attachmentIds,
      mode,
      is_websearch_enabled,
      mcp_connector_ids: toggledConnectors,
    };
    if (focus.isInWorkspaceContext) {
      payload = { ...payload, [focus.entityType]: focus.entityIdentifier };
    }
    const isPiChatSidecarOpen = this.rootStore.theme.activeSidecar === "pi-chat";
    if (isPiChatSidecarOpen && callbackUrl) {
      payload = { ...payload, pi_sidebar_open: isPiChatSidecarOpen, sidebar_open_url: callbackUrl };
    }
    return payload;
  };

  getInstance = async (workspaceSlug: string): Promise<TInstanceResponse | void> => {
    try {
      const response = await this.piChatService.getInstance(workspaceSlug);
      this.isWorkspaceAuthorized = response.is_authorized;
      return response;
    } catch (e) {
      console.error("Failed to get instance information:", e);
      this.isWorkspaceAuthorized = false;
    }
  };

  fetchPrompts = async (
    workspaceId: string,
    mode: string,
    projectId: string | undefined,
    entityId: string | undefined,
    entityType: string | undefined
  ): Promise<{ templates: TTemplate[] }> => {
    const response = await this.piChatService.fetchPrompts({
      workspace_id: workspaceId,
      mode: mode,
      project_id: projectId,
      entity_id: entityId,
      entity_type: entityType,
    });
    return response;
  };

  getStreamingAnswer = (
    token: string,
    isNewChat: boolean,
    chatId: string,
    workspaceId: string | undefined,
    newDialogue: TDialogue
  ) => {
    const url = `${PI_URL}/api/v1/chat/stream-answer/${token}`;

    const eventSource = new EventSource(url, {
      withCredentials: true,
    });
    this.eventSources[chatId] = eventSource;

    const parseSSEData = <T>(data: string): T => JSON.parse(data) as T;

    // 🔹 Handles `delta` chunks
    eventSource.addEventListener("delta", (event: MessageEvent<string>) => {
      try {
        const data = parseSSEData<TSSEDeltaEvent>(event.data);
        if (newDialogue.isPiThinking) newDialogue.isPiThinking = false;
        newDialogue.answer += data.chunk;
        this.updateDialogue(chatId, token, newDialogue);
      } catch (e) {
        console.error("Delta parse error", e);
      }
    });

    // 🔹 Handles reasoning events
    eventSource.addEventListener("reasoning", (event: MessageEvent<string>) => {
      try {
        const data = parseSSEData<TSSEReasoningEvent>(event.data);
        const header = data.header ?? "";
        const content = data.content ?? "";
        // Allow content-only reasoning updates (used for streaming LLM reasoning chunks without repeating the header)
        if (!header && !content) return;
        if (header) {
          newDialogue.current_tick = header;
          newDialogue.reasoning = newDialogue.reasoning + header;
        }
        if (content) {
          newDialogue.reasoning = newDialogue.reasoning + content;
        }
        this.updateDialogue(chatId, token, newDialogue);
      } catch (e) {
        console.error("Reasoning parse error", e);
      }
    });

    // 🔹 Handles todos events — replaces the pinned todo list in the reasoning block
    eventSource.addEventListener("todos", (event: MessageEvent<string>) => {
      try {
        const data = parseSSEData<TSSETodosEvent>(event.data);
        newDialogue.todos = data.todos;
        this.updateDialogue(chatId, token, newDialogue);
      } catch (e) {
        console.error("Todos parse error", e);
      }
    });

    // 🔹 Handles action event
    eventSource.addEventListener("actions", (event: MessageEvent<string>) => {
      try {
        const data = parseSSEData<TSSEActionsEvent>(event.data);
        const artifactId = data.artifact_id;
        if (artifactId) {
          void this.artifactsStore.initArtifacts(chatId, artifactId, { ...data, is_editable: true });
        }
        newDialogue.execution_status = EExecutionStatus.PENDING;
        newDialogue.actions = [...(newDialogue.actions || []), data];
        this.updateDialogue(chatId, token, newDialogue);
      } catch (e) {
        console.error("Action parse error", e);
      }
    });

    // 🔹 Handles done event
    eventSource.addEventListener("done", () => {
      eventSource.close();
      delete this.eventSources[chatId];
      if (newDialogue.isPiThinking) newDialogue.isPiThinking = false;
      this.isPiTypingMap[chatId] = false;
      // Call the title api if its a new chat
      if (isNewChat) {
        this.piChatService
          .retrieveTitle(chatId, workspaceId)
          .then((title: TSSETitleResponse) => {
            runInAction(() => {
              update(this.chatMap, chatId, (chat: TChatHistory) => {
                chat.title = title.title;
                chat.last_modified = new Date().toISOString();
                return chat; // same reference, mutated
              });
            });
            return undefined;
          })
          .catch((e) => console.error("Failed to retrieve title:", e));
      }
    });

    eventSource.addEventListener("error", (event: MessageEvent) => {
      console.error("SSE error:", event);
      newDialogue.isPiThinking = false;
      this.isPiTypingMap[chatId] = false;
      newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
      this.updateDialogue(chatId, token, newDialogue);
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      newDialogue.isPiThinking = false;
      this.isPiTypingMap[chatId] = false;
      newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
      this.updateDialogue(chatId, token, newDialogue);
      eventSource.close();
      delete this.eventSources[chatId];
    };
  };

  getAnswer = (
    chatId: string,
    query: string,
    focus: TFocus,
    isProjectChat: boolean = false,
    workspaceSlug: string,
    workspaceId: string | undefined,
    callbackUrl: string,
    attachmentIds: string[],
    aiMode: string,
    is_websearch_enabled: boolean,
    toggledConnectors: string[]
  ) => {
    if (!chatId) {
      throw new Error("Chat not initialized");
    }
    const isNewChat = this.chatMap[chatId]?.dialogue.length === 0;
    const dialogueHistory = this.chatMap[chatId]?.dialogue || [];
    const newDialogue: TDialogue = {
      query,
      llm: this.activeModel,
      answer: "",
      current_tick: "",
      reasoning: "",
      isPiThinking: true,
      actions: [],
      attachment_ids: attachmentIds,
    };

    // Optimistically update conversation with user query
    runInAction(() => {
      this.isPiTypingMap[chatId] = true;
      this.isNewChat = false;
      update(this.chatMap, chatId, (chat: TChatHistory) => {
        if (!chat) {
          chat = {
            chat_id: chatId,
            dialogue: [],
            dialogueMap: {},
            title: "",
            last_modified: new Date().toISOString(),
            is_favorite: false,
            is_focus_enabled: false,
            focus_workspace_id: "",
            focus_project_id: "",
            is_websearch_enabled,
          };
        }
        chat.dialogue = [...dialogueHistory, "latest"];
        chat.dialogueMap["latest"] = newDialogue;
        return chat; // same reference, mutated
      });
    });

    // Api call here
    const payload = this.buildPayload(
      chatId,
      query,
      focus,
      isProjectChat,
      workspaceSlug,
      workspaceId,
      callbackUrl,
      attachmentIds,
      isNewChat,
      aiMode,
      is_websearch_enabled,
      toggledConnectors
    );
    this.piChatService
      .retrieveToken(payload)
      .then((token) => {
        runInAction(() => {
          update(this.chatMap, chatId, (chat: TChatHistory) => {
            chat.dialogue = [...dialogueHistory, token];
            newDialogue.query_id = token;
            chat.dialogueMap[token] = newDialogue;
            return chat;
          });
        });
        try {
          this.getStreamingAnswer(token, isNewChat, chatId, workspaceId, newDialogue);
          return;
        } catch (e) {
          console.log(e);
          throw e;
        }
      })
      .catch((e) => {
        console.log(e);
        runInAction(() => {
          newDialogue.isPiThinking = false;
          newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
          this.updateDialogue(chatId, "latest", newDialogue);
          this.isPiTypingMap[chatId] = false;
        });
      });
  };

  abortStream = (chatId: string) => {
    const eventSource = this.eventSources[chatId];
    const dialogues = this.chatMap[chatId]?.dialogue;
    if (eventSource && dialogues?.length > 0) {
      eventSource.close();
      delete this.eventSources[chatId];
      console.warn(`SSE stream for chat ${chatId} aborted`);
      runInAction(() => {
        this.isPiTypingMap[chatId] = false;
        this.chatMap[chatId].dialogueMap[dialogues[dialogues.length - 1]].isPiThinking = false;
      });
    }
  };

  regenerateAnswer = (chatId: string, token: string, workspaceId: string | undefined): Promise<void> => {
    // Optimistically update conversation with user query
    const newDialogue: TDialogue = {
      query: this.chatMap[chatId]?.dialogueMap?.[token]?.query,
      llm: this.activeModel,
      answer: "",
      current_tick: "",
      reasoning: "",
      isPiThinking: true,
      query_id: token,
    };
    this.updateDialogue(chatId, token, newDialogue);
    this.isPiTypingMap[chatId] = true;

    try {
      this.getStreamingAnswer(token, false, chatId, workspaceId, newDialogue);
    } catch (e) {
      console.log(e);
      runInAction(() => {
        newDialogue.isPiThinking = false;
        newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
        this.updateDialogue(chatId, token, newDialogue);
        this.isPiTypingMap[chatId] = false;
      });
    }
    return Promise.resolve();
  };

  updateDialogue = (chatId: string, token: string, newDialogue: TDialogue) => {
    runInAction(() => {
      update(this.chatMap, chatId, (chat: TChatHistory | undefined) => {
        if (!chat) return chat;
        chat.dialogueMap[token] = newDialogue;
        return chat; // same reference, mutated
      });
    });
  };

  fetchChatById = async (chatId: string, workspaceId: string | undefined) => {
    if (this.isNewChat) return;
    try {
      // Call api here
      runInAction(() => {
        this.isLoadingMap[chatId] = true;
      });
      const response = await this.piChatService.retrieveChat(chatId, workspaceId);
      runInAction(() => {
        this.isAuthorized = true;
        update(this.chatMap, chatId, (chat) => ({
          ...response.results,
          dialogue: response.results.dialogue.map((d) => d.query_id),
          dialogueMap: response.results.dialogue.reduce(
            (acc, d) => {
              if (!d.query_id) return acc;
              acc[d.query_id] = { ...d, actions: d.actions?.map((action) => ({ ...action })) };
              return acc;
            },
            {} as Record<string, TDialogue>
          ),
          ...chat,
          llm: response.results.llm ?? chat?.llm,
        }));
        if (chatId === this.activeChatId && this.models.length > 0) {
          this.activeModel =
            response?.results?.llm && this.models.find((model) => model.id === response?.results?.llm)
              ? response?.results?.llm
              : this.getDefaultLLM() || undefined;
        }
        this.isLoadingMap[chatId] = false;
      });
    } catch (e: unknown) {
      runInAction(() => {
        if ((e as { status?: number })?.status === 403) {
          this.isAuthorized = false;
        } else {
          this.isNewChat = true;
        }
        this.isLoadingMap[chatId] = false;
      });
    }
  };

  fetchUserThreads = async (workspaceId: string | undefined, isProjectChat: boolean = false) => {
    try {
      runInAction(() => {
        this.isLoadingThreads = true;
      });
      const response = await this.piChatService.listUserThreads(workspaceId, isProjectChat);
      runInAction(() => {
        response.results.forEach((chat) => {
          update(this.chatMap, chat.chat_id, (prev: TChatHistory | undefined) => ({
            ...prev,
            chat_id: chat.chat_id,
            title: chat.title,
            last_modified: chat.last_modified,
            is_favorite: chat.is_favorite,
            workspace_id: chat.workspace_id,
            llm: chat.llm,
          }));
        });
        if (isProjectChat) {
          this.projectThreads = response.results.map((chat) => chat.chat_id);
        } else {
          this.piThreads = response.results.map((chat) => chat.chat_id);
        }
        this.isLoadingThreads = false;
      });
    } catch (error) {
      console.error(error);
      runInAction(() => {
        this.isLoadingThreads = false;
      });
    }
  };

  fetchRecentChats = async (workspaceId: string | undefined, isProjectChat: boolean = false) => {
    try {
      const threads = isProjectChat ? this.projectThreads : this.piThreads;
      runInAction(() => {
        this.isLoadingThreads = true;
      });
      const response = await this.piChatService.listRecentChats(workspaceId);
      runInAction(() => {
        response.results.forEach((chat) => {
          update(this.chatMap, chat.chat_id, (prev: TChatHistory | undefined) => ({
            ...prev,
            chat_id: chat.chat_id,
            title: chat.title,
            last_modified: chat.last_modified,
            llm: chat.llm,
          }));
        });
        threads.push(...response.results.map((chat) => chat.chat_id));
        this.isLoadingThreads = false;
      });
    } catch (e) {
      console.error(e);
      runInAction(() => {
        this.isLoadingThreads = false;
      });
    }
  };

  fetchModels = async (workspaceId: string | undefined) => {
    try {
      const response = await this.piChatService.listAiModels(workspaceId);
      runInAction(() => {
        this.models = response.models;
        if (!this.activeModel) {
          const activeChatLlm = this.activeChat?.llm;
          this.activeModel =
            response.models.find((model) => model.id === activeChatLlm)?.id ||
            response.models?.find((model) => model.is_default)?.id;
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  searchCallback = async (workspace: string, search: string, focus: TFocus): Promise<TSearchResults> => {
    const filteredProjectId = focus.entityType === "project_id" ? focus.entityIdentifier : undefined;
    let params: { search: string; project_id?: string } = { search };
    if (filteredProjectId) {
      params = {
        ...params,
        project_id: filteredProjectId,
      };
    }
    const response = await this.workspaceService.searchAcrossWorkspace(workspace, params);

    return response.results;
  };

  sendFeedback = async (
    chatId: string,
    message_index: number,
    feedback: EAiFeedback,
    workspaceId?: string,
    feedbackMessage?: string
  ) => {
    const queryId = this.chatMap[chatId]?.dialogue?.[message_index];
    const initialState = this.chatMap[chatId]?.dialogueMap?.[queryId]?.feedback;
    runInAction(() => {
      runInAction(() => {
        if (queryId) {
          set(this.chatMap[chatId].dialogueMap[queryId], "feedback", feedback);
        }
      });
    });
    try {
      const response = await this.piChatService.postFeedback({
        message_index,
        chat_id: chatId,
        feedback,
        feedback_message: feedbackMessage,
        ...(workspaceId && { workspace_id: workspaceId }),
      });
      return response;
    } catch (e) {
      runInAction(() => {
        if (queryId) {
          set(this.chatMap[chatId].dialogueMap[queryId], "feedback", initialState);
        }
      });
      throw e;
    }
  };

  fetchFavoriteChats = async (workspaceId: string | undefined, isProjectChat: boolean = false) => {
    const response = await this.piChatService.listFavoriteChats(workspaceId, isProjectChat);
    runInAction(() => {
      response.forEach((chat) => {
        update(this.chatMap, chat.chat_id, (prev: TChatHistory | undefined) => ({
          ...prev,
          chat_id: chat.chat_id,
          title: chat.title,
          is_favorite: true,
        }));
      });
      this.favoriteChats = response.map((chat) => chat.chat_id);
    });
  };

  favoriteChat = async (chatId: string, workspaceId: string | undefined) => {
    const favoriteChats = this.favoriteChats;
    try {
      runInAction(() => {
        update(this.chatMap, chatId, (chat: TChatHistory) => {
          chat.is_favorite = true;
          return chat; // same reference, mutated
        });
        this.favoriteChats = [...this.favoriteChats, chatId];
      });
      await this.piChatService.favoriteChat(chatId, workspaceId);
    } catch (e) {
      console.error(e);
      runInAction(() => {
        update(this.chatMap, chatId, (chat: TChatHistory) => {
          chat.is_favorite = false;
          return chat; // same reference, mutated
        });
        this.favoriteChats = favoriteChats;
      });
    }
  };

  unfavoriteChat = async (chatId: string, workspaceId: string | undefined) => {
    const favoriteChats = this.favoriteChats;
    try {
      runInAction(() => {
        update(this.chatMap, chatId, (chat: TChatHistory) => {
          chat.is_favorite = false;
          return chat; // same reference, mutated
        });
        this.favoriteChats = favoriteChats.filter((id) => id !== chatId);
      });
      await this.piChatService.unfavoriteChat(chatId, workspaceId);
    } catch (e) {
      console.error(e);
      runInAction(() => {
        update(this.chatMap, chatId, (chat: TChatHistory) => {
          chat.is_favorite = true;
          return chat; // same reference, mutated
        });
        this.favoriteChats = favoriteChats;
      });
    }
  };

  renameChat = async (chatId: string, title: string, workspaceId: string | undefined) => {
    const initialState = this.chatMap[chatId]?.title;
    try {
      runInAction(() => {
        update(this.chatMap, chatId, (chat: TChatHistory) => {
          chat.title = title;
          return chat; // same reference, mutated
        });
      });
      await this.piChatService.renameChat(chatId, title, workspaceId);
    } catch (e) {
      console.error(e);
      runInAction(() => {
        update(this.chatMap, chatId, (chat: TChatHistory) => {
          chat.title = initialState;
          return chat; // same reference, mutated
        });
      });
    }
  };

  deleteChat = async (chatId: string, workspaceSlug: string, isProjectChat: boolean = false) => {
    const initialState = isProjectChat ? this.projectThreads : this.piThreads;
    try {
      runInAction(() => {
        if (isProjectChat) {
          this.projectThreads = this.projectThreads.filter((thread: string) => thread !== chatId);
        } else {
          this.piThreads = this.piThreads.filter((thread: string) => thread !== chatId);
        }
        this.favoriteChats = this.favoriteChats.filter((id: string) => id !== chatId);
        delete this.chatMap[chatId];
      });
      await this.piChatService.destroyChat(chatId, workspaceSlug);
    } catch (e) {
      console.error(e);
      runInAction(() => {
        if (isProjectChat) {
          this.projectThreads = initialState;
        } else {
          this.piThreads = initialState;
        }
      });
    }
  };

  togglePiArtifactsDrawer = (value?: string) => {
    this.isPiArtifactsDrawerOpen = value;
  };

  executeAction = async (workspaceId: string, chatId: string, actionId: string): Promise<string[] | undefined> => {
    const dialogue = {
      ...this.chatMap[chatId].dialogueMap[actionId],
    };
    try {
      dialogue.execution_status = EExecutionStatus.EXECUTING;
      dialogue.action_error = undefined;

      this.updateDialogue(chatId, actionId, dialogue);
      // process artifact edits
      const artifactData: {
        artifact_id: string;
        is_edited: boolean;
        action_data?: TUpdatedArtifact;
      }[] = [];
      dialogue.actions?.forEach((action) => {
        const updatedArtifact = this.artifactsStore.getArtifactByVersion(action.artifact_id, "updated");
        if (isEmpty(updatedArtifact)) {
          artifactData.push({
            artifact_id: action.artifact_id,
            is_edited: false,
          });
        } else {
          artifactData.push({
            artifact_id: action.artifact_id,
            is_edited: true,
            action_data: updatedArtifact,
          });
        }
      });
      const response = await this.piChatService.executeAction({
        workspace_id: workspaceId,
        chat_id: chatId,
        message_id: actionId,
        artifact_data: artifactData,
      });
      // update artifacts
      const actionableEntities: string[] = [];
      response.actions?.forEach((action) => {
        this.artifactsStore.updateArtifact(action.artifact_id, "original", {
          entity_id: action.entity?.entity_id,
          entity_url: action.entity?.entity_url,
          entity_name: action.entity?.entity_name,
          entity_type: action.entity?.entity_type,
          issue_identifier: action.entity?.issue_identifier,
          is_executed: true,
          success: action.success,
          error: action.error,
          message: action.message,
          is_editable: false,
        });
        if (action.success) {
          actionableEntities.push(action.artifact_type);
        }
      });
      // update dialogue
      dialogue.execution_status = EExecutionStatus.COMPLETED;
      dialogue.action_error = undefined;
      dialogue.action_summary = { ...response.action_summary, is_editable: false, is_executed: true };
      dialogue.actions = response.actions;
      this.updateDialogue(chatId, actionId, dialogue);

      return actionableEntities;
    } catch (error) {
      console.error(error);
      dialogue.execution_status = EExecutionStatus.COMPLETED;
      const err = error as { error?: string; detail?: string; message?: string } | undefined;
      dialogue.action_error = err?.error ?? err?.detail ?? err?.message ?? "Unable to execute action.";
      dialogue.action_summary = undefined;
      this.updateDialogue(chatId, actionId, dialogue);
      throw error;
    }
  };

  followUp = async (
    artifactId: string,
    query: string,
    messageId: string,
    projectId: string | undefined,
    workspace_id: string,
    chat_id: string,
    entity_type: string,
    artifactData: TUpdatedArtifact
  ) => {
    try {
      const response = await this.piChatService.followUp(
        query,
        workspace_id,
        chat_id,
        artifactId,
        artifactData,
        messageId,
        entity_type,
        projectId
      );
      if (response.success) {
        this.artifactsStore.updateArtifact(artifactId, "updated", response.artifact_data);
      } else {
        throw new Error("Failed to follow up");
      }
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  convertToPage = async (description: string, workspaceSlug: string, projectId: string | undefined, chatId: string) => {
    const payload = {
      description_html: description,
      workspace_slug: workspaceSlug,
      page_type: projectId ? "project" : "workspace",
      project_id: projectId,
      chat_id: chatId,
    };
    try {
      const response = await this.piChatService.convertToPage(payload);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
}
