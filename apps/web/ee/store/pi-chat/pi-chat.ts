import set from "lodash/set";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { PI_BASE_URL } from "@plane/constants";
// plane web imports
import { WorkspaceService } from "@/plane-web/services";
import { PiChatService } from "@/plane-web/services/pi-chat.service";
import { RootStore } from "@/plane-web/store/root.store";
import {
  EFeedback,
  ESource,
  IFormattedValue,
  TAiModels,
  TChatHistory,
  TDialogue,
  TExecuteActionResponse,
  TFocus,
  TInitPayload,
  TQuery,
  TTemplate,
  TUserThreads,
} from "@/plane-web/types";

export interface IPiChatStore {
  isNewChat: boolean;
  activeChatId: string;
  activeChat: TChatHistory;
  chatMap: Record<string, TChatHistory>; // chat_id -> chat
  isLoadingThreads: boolean;
  piThreads: string[];
  projectThreads: string[];
  activeModel: TAiModels | undefined;
  models: TAiModels[];
  isAuthorized: boolean;
  favoriteChats: string[];
  isLoading: boolean;
  isPiTyping: boolean;
  isLoadingFavoriteChats: boolean;
  isPiChatDrawerOpen: boolean;
  // computed fn
  geUserThreads: () => TUserThreads[];
  geUserThreadsByWorkspaceId: (workspaceId: string | undefined) => TUserThreads[];
  geFavoriteChats: () => TUserThreads[];
  getChatById: (chatId: string) => TChatHistory;
  getChatFocus: (chatId: string) => TFocus | undefined;
  // actions
  initPiChat: (chatId?: string) => void;
  fetchChatById: (chatId: string, workspaceId: string | undefined) => void;
  getAnswer: (
    chatId: string,
    query: string,
    focus: TFocus,
    isProjectChat: boolean,
    workspaceSlug: string,
    workspaceId: string | undefined
  ) => Promise<void>;
  getTemplates: (workspaceId: string | undefined) => Promise<TTemplate[]>;
  fetchUserThreads: (workspaceId: string | undefined, isProjectChat: boolean) => void;
  searchCallback: (workspace: string, query: string, focus: TFocus) => Promise<IFormattedValue>;
  sendFeedback: (
    chatId: string,
    message_index: number,
    feedback: EFeedback,
    workspaceId?: string,
    feedbackMessage?: string
  ) => Promise<void>;
  executeAction: (workspaceId: string, chatId: string, actionId: string) => Promise<TExecuteActionResponse | undefined>;
  fetchModels: (workspaceId?: string) => Promise<void>;
  setActiveModel: (model: TAiModels) => void;
  createNewChat: (focus: TFocus, isProjectChat: boolean, workspaceId: string | undefined) => Promise<string>;
  renameChat: (chatId: string, title: string, workspaceId: string | undefined) => Promise<void>;
  deleteChat: (chatId: string, workspaceSlug: string) => Promise<void>;
  favoriteChat: (chatId: string, workspaceId: string | undefined) => Promise<void>;
  unfavoriteChat: (chatId: string, workspaceId: string | undefined) => Promise<void>;
  fetchRecentChats: (workspaceId: string | undefined, isProjectChat: boolean) => Promise<void>;
  fetchFavoriteChats: (workspaceId: string | undefined) => Promise<void>;
  togglePiChatDrawer: (value?: boolean) => void;
  regenerateAnswer: (chatId: string, token: string, workspaceId: string | undefined) => Promise<void>;
}

export class PiChatStore implements IPiChatStore {
  activeChatId = "";
  isNewChat: boolean = false;
  isLoadingThreads: boolean = false;
  isLoadingFavoriteChats: boolean = false;
  models: TAiModels[] = [];
  activeModel: TAiModels | undefined = undefined;
  isAuthorized = true;
  chatMap: Record<string, TChatHistory> = {};
  piThreads: string[] = [];
  projectThreads: string[] = [];
  isPiTypingMap: Record<string, boolean> = {};
  isLoadingMap: Record<string, boolean> = {};
  favoriteChats: string[] = [];
  isPiChatDrawerOpen: boolean = false;
  //services
  userStore;
  rootStore;
  piChatService;
  workspaceService;

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
      isLoadingThreads: observable,
      isLoadingFavoriteChats: observable,
      favoriteChats: observable,
      isPiChatDrawerOpen: observable.ref,
      // computed
      activeChat: computed,
      isPiTyping: computed,
      isLoading: computed,
      // actions
      initPiChat: action,
      getAnswer: action,
      getTemplates: action,
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
      togglePiChatDrawer: action,
      executeAction: action,
    });

    //services
    this.rootStore = store;
    this.userStore = store.user;
    this.piChatService = new PiChatService();
    this.workspaceService = new WorkspaceService();
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

  setActiveModel = (model: TAiModels) => {
    this.activeModel = model;
  };

  // computed
  geUserThreads = computedFn(() => this.piThreads.map((chatId) => this.chatMap[chatId]) || []);

  geUserThreadsByWorkspaceId = computedFn((workspaceId: string | undefined) => {
    if (!workspaceId) return [];
    return (
      this.projectThreads
        .filter((chatId) => this.chatMap[chatId].workspace_id === workspaceId)
        .map((chatId) => this.chatMap[chatId]) || []
    );
  });

  geFavoriteChats = computedFn(() => {
    if (!this.favoriteChats) return [];
    return this.favoriteChats?.map((chatId) => this.chatMap[chatId]);
  });

  getChatById = computedFn((chatId: string) => this.chatMap[chatId]);

  getChatFocus = computedFn((chatId: string) => {
    const chat = this.chatMap[chatId];
    if (!chat) return;
    return {
      isInWorkspaceContext: chat.is_focus_enabled,
      entityType: chat.focus_project_id ? "project_id" : "workspace_id",
      entityIdentifier: chat.focus_project_id || chat.focus_workspace_id,
    };
  });

  // actions
  initPiChat = async (chatId?: string | undefined) => {
    // Existing chat
    if (chatId) {
      this.activeChatId = chatId;
      this.isNewChat = false;
    } else {
      this.activeChatId = "";
    }
    this.isAuthorized = true;
  };

  createNewChat = async (focus: TFocus, isProjectChat: boolean = false, workspaceId: string | undefined) => {
    this.isNewChat = true;
    let payload: TInitPayload = {
      workspace_in_context: focus.isInWorkspaceContext,
      is_project_chat: isProjectChat,
      workspace_id: workspaceId,
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

    this.chatMap[newChatId] = {
      chat_id: newChatId,
      dialogue: [],
      dialogueMap: {},
      title: "New Chat",
      last_modified: new Date().toISOString(),
      is_favorite: false,
      is_focus_enabled: focus.isInWorkspaceContext,
      focus_workspace_id: focus.entityType === "workspace_id" ? focus.entityIdentifier : "",
      focus_project_id: focus.entityType === "project_id" ? focus.entityIdentifier : "",
      workspace_id: workspaceId,
    };

    if (isProjectChat) {
      this.projectThreads = [newChatId, ...this.projectThreads];
    } else {
      this.piThreads = [newChatId, ...this.piThreads];
    }

    return newChatId;
  };

  buildPayload = (
    chatId: string,
    query: string,
    focus: TFocus,
    isProjectChat: boolean = false,
    workspaceSlug: string,
    workspaceId: string | undefined
  ) => {
    let payload: TQuery = {
      chat_id: chatId,
      query,
      is_new: this.chatMap[chatId]?.dialogue.length === 0,
      is_temp: false,
      workspace_in_context: focus.isInWorkspaceContext,
      source: ESource.WEB,
      llm: this.activeModel?.id || "gpt-4.1",
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
    };
    if (focus.isInWorkspaceContext) {
      payload = { ...payload, [focus.entityType]: focus.entityIdentifier };
    }
    return payload;
  };

  getTemplates = async (workspaceId: string | undefined) => {
    const response = await this.piChatService.listTemplates(workspaceId);
    return response?.templates;
  };

  getStreamingAnswer = async (
    token: string,
    isNewChat: boolean,
    chatId: string,
    workspaceId: string | undefined,
    newDialogue: TDialogue
  ) => {
    const url = `${PI_BASE_URL}/api/v1/chat/stream-answer/${token}`;

    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    // 🔹 Handles `delta` chunks
    eventSource.addEventListener("delta", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (newDialogue.isPiThinking) newDialogue.isPiThinking = false;
        newDialogue.answer += data.chunk;
        this.updateDialogue(chatId, token, newDialogue);
      } catch (e) {
        console.error("Delta parse error", e);
      }
    });

    // 🔹 Handles reasoning events
    eventSource.addEventListener("reasoning", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        newDialogue.reasoning += data.reasoning;
        this.updateDialogue(chatId, token, newDialogue);
      } catch (e) {
        console.error("Reasoning parse error", e);
      }
    });

    // 🔹 Handles action event
    eventSource.addEventListener("actions", () => {
      try {
        newDialogue.execution_status = {
          actions_count: (newDialogue.execution_status?.actions_count ?? 0) + 1,
          status: "pending",
        };
        this.updateDialogue(chatId, token, newDialogue);
      } catch (e) {
        console.error("Action parse error", e);
      }
    });

    // 🔹 Handles done event
    eventSource.addEventListener("done", async () => {
      eventSource.close();
      if (newDialogue.isPiThinking) newDialogue.isPiThinking = false;
      this.isPiTypingMap[chatId] = false;
      // Call the title api if its a new chat
      if (isNewChat) {
        const title = await this.piChatService.retrieveTitle(chatId, workspaceId);
        runInAction(() => {
          this.isNewChat = false;
          update(this.chatMap, chatId, (chat) => {
            chat.title = title.title;
            chat.last_modified = new Date().toISOString();
            return chat; // same reference, mutated
          });
        });
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      newDialogue.isPiThinking = false;
      newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
      this.updateDialogue(chatId, token, newDialogue);
      eventSource.close();
    };
  };

  getAnswer = async (
    chatId: string,
    query: string,
    focus: TFocus,
    isProjectChat: boolean = false,
    workspaceSlug: string,
    workspaceId: string | undefined
  ) => {
    if (!chatId) {
      throw new Error("Chat not initialized");
    }
    const isNewChat = this.chatMap[chatId]?.dialogue.length === 0;
    const dialogueHistory = this.chatMap[chatId]?.dialogue || [];
    const newDialogue: TDialogue = {
      query,
      llm: this.activeModel?.id,
      answer: "",
      reasoning: "",
      isPiThinking: true,
      execution_status: {
        actions_count: 0,
      },
    };

    // Optimistically update conversation with user query
    runInAction(() => {
      this.isPiTypingMap[chatId] = true;
      update(this.chatMap, chatId, (chat) => {
        chat.dialogue = [...dialogueHistory, "latest"];
        chat.dialogueMap["latest"] = newDialogue;
        return chat; // same reference, mutated
      });
    });

    // Api call here
    const payload = this.buildPayload(chatId, query, focus, isProjectChat, workspaceSlug, workspaceId);
    const token = await this.piChatService.retrieveToken(payload);
    runInAction(() => {
      update(this.chatMap, chatId, (chat) => {
        chat.dialogue = [...dialogueHistory, token];
        newDialogue.query_id = token;
        chat.dialogueMap[token] = newDialogue;
        return chat;
      });
    });
    try {
      this.getStreamingAnswer(token, isNewChat, chatId, workspaceId, newDialogue);
    } catch (e) {
      console.log(e);
      runInAction(() => {
        newDialogue.isPiThinking = false;
        newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
        this.updateDialogue(chatId, token, newDialogue);
        this.isPiTypingMap[chatId] = false;
      });
    }
  };

  regenerateAnswer = async (chatId: string, token: string, workspaceId: string | undefined) => {
    // Optimistically update conversation with user query
    const newDialogue: TDialogue = {
      query: this.chatMap[chatId]?.dialogueMap[token]?.query,
      llm: this.activeModel?.id,
      answer: "",
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
  };

  updateDialogue = (chatId: string, token: string, newDialogue: TDialogue) => {
    runInAction(() => {
      update(this.chatMap, chatId, (chat) => {
        if (!chat) return;
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
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          ...response.results,
          dialogue: response.results.dialogue.map((d) => d.query_id),
          dialogueMap: response.results.dialogue.reduce(
            (acc, d) => {
              if (!d.query_id) return acc;
              acc[d.query_id] = d;
              return acc;
            },
            {} as Record<string, TDialogue>
          ),
        }));
        this.isLoadingMap[chatId] = false;
      });
    } catch (e: any) {
      runInAction(() => {
        if (e?.status === 403) {
          this.isAuthorized = false;
        } else {
          this.isNewChat = true;
        }
        this.isLoadingMap[chatId] = false;
      });
    }
  };

  fetchUserThreads = async (workspaceId: string | undefined, isProjectChat: boolean = false) => {
    const threads = isProjectChat ? this.projectThreads : this.piThreads;
    try {
      runInAction(() => {
        this.isLoadingThreads = true;
      });
      const response = await this.piChatService.listUserThreads(workspaceId, isProjectChat);
      runInAction(() => {
        response.results.forEach((chat) => {
          update(this.chatMap, chat.chat_id, (prev) => ({
            ...prev,
            chat_id: chat.chat_id,
            title: chat.title,
            last_modified: chat.last_modified,
            is_favorite: chat.is_favorite,
            workspace_id: chat.workspace_id,
          }));
        });
        threads.push(...response.results.map((chat) => chat.chat_id));
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
          update(this.chatMap, chat.chat_id, (prev) => ({
            ...prev,
            chat_id: chat.chat_id,
            title: chat.title,
            last_modified: chat.last_modified,
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
        response.models.forEach((model) => {
          if (model.is_default) {
            this.activeModel = model;
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  };

  searchCallback = async (workspace: string, search: string, focus: TFocus): Promise<IFormattedValue> => {
    const filteredProjectId = focus.entityType === "project_id" ? focus.entityIdentifier : undefined;
    let params: { search: string; projectId?: string } = { search };
    if (filteredProjectId) {
      params = {
        ...params,
        projectId: filteredProjectId,
      };
    }
    const response = await this.workspaceService.searchAcrossWorkspace(workspace, params);

    return response.results;
  };

  sendFeedback = async (
    chatId: string,
    message_index: number,
    feedback: EFeedback,
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

  fetchFavoriteChats = async (workspaceId: string | undefined) => {
    this.isLoadingFavoriteChats = true;
    const response = await this.piChatService.listFavoriteChats(workspaceId);
    runInAction(() => {
      response.forEach((chat) => {
        update(this.chatMap, chat.chat_id, (prev) => ({
          ...prev,
          chat_id: chat.chat_id,
          title: chat.title,
          is_favorite: true,
        }));
      });
      this.favoriteChats = response.map((chat) => chat.chat_id);
      this.isLoadingFavoriteChats = false;
    });
  };

  favoriteChat = async (chatId: string, workspaceId: string | undefined) => {
    const favoriteChats = this.favoriteChats;
    try {
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => {
          chat.is_favorite = true;
          return chat; // same reference, mutated
        });
        this.favoriteChats = [...this.favoriteChats, chatId];
      });
      await this.piChatService.favoriteChat(chatId, workspaceId);
    } catch (e) {
      console.error(e);
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => {
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
        update(this.chatMap, chatId, (chat) => {
          chat.is_favorite = false;
          return chat; // same reference, mutated
        });
        this.favoriteChats = favoriteChats.filter((id) => id !== chatId);
      });
      await this.piChatService.unfavoriteChat(chatId, workspaceId);
    } catch (e) {
      console.error(e);
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => {
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
        update(this.chatMap, chatId, (chat) => {
          chat.title = title;
          return chat; // same reference, mutated
        });
      });
      await this.piChatService.renameChat(chatId, title, workspaceId);
    } catch (e) {
      console.error(e);
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => {
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

  togglePiChatDrawer = (value?: boolean) => {
    this.isPiChatDrawerOpen = value ?? !this.isPiChatDrawerOpen;
  };

  executeAction = async (
    workspaceId: string,
    chatId: string,
    actionId: string
  ): Promise<TExecuteActionResponse | undefined> => {
    try {
      const response = await this.piChatService.executeAction({
        workspace_id: workspaceId,
        chat_id: chatId,
        message_id: actionId,
      });
      const newDialogue = {
        ...this.chatMap[chatId].dialogueMap[actionId],
        execution_status: {
          actions_count: response.actions.length,
          execution_status: "completed",
        },
      };
      this.updateDialogue(chatId, actionId, newDialogue);

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
}
