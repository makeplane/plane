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
  isPiThinking: boolean;
  isPiTyping: boolean;
  isLoadingFavoriteChats: boolean;
  isPiChatDrawerOpen: boolean;
  // computed fn
  geUserThreads: () => TUserThreads[];
  geUserThreadsByWorkspaceId: (workspaceId: string) => TUserThreads[];
  geFavoriteChats: () => TUserThreads[];
  getChatById: (chatId: string) => TChatHistory;
  // actions
  initPiChat: (chatId?: string) => void;
  fetchChatById: (chatId: string) => void;
  getAnswer: (chatId: string, query: string, focus: TFocus, isProjectChat: boolean) => Promise<string | undefined>;
  getTemplates: () => Promise<TTemplate[]>;
  fetchUserThreads: (workspaceId: string, isProjectChat: boolean) => void;
  searchCallback: (workspace: string, query: string, focus: TFocus) => Promise<IFormattedValue>;
  sendFeedback: (chatId: string, message_index: number, feedback: EFeedback, feedbackMessage?: string) => Promise<void>;
  fetchModels: () => Promise<void>;
  setActiveModel: (model: TAiModels) => void;
  createNewChat: (focus: TFocus, isProjectChat: boolean, workspaceId: string) => Promise<string>;
  renameChat: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string, workspaceSlug: string) => Promise<void>;
  favoriteChat: (chatId: string) => Promise<void>;
  unfavoriteChat: (chatId: string) => Promise<void>;
  fetchRecentChats: (isProjectChat: boolean) => Promise<void>;
  fetchFavoriteChats: (workspaceId: string) => Promise<void>;
  togglePiChatDrawer: (value?: boolean) => void;
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
  isPiThinkingMap: Record<string, boolean> = {};
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
      isPiThinkingMap: observable,
      isPiTypingMap: observable,
      isLoadingMap: observable,
      isAuthorized: observable,
      isLoadingThreads: observable,
      isLoadingFavoriteChats: observable,
      favoriteChats: observable,
      isPiChatDrawerOpen: observable.ref,
      // computed
      activeChat: computed,
      isPiThinking: computed,
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

  get isPiThinking() {
    return this.isPiThinkingMap[this.activeChatId] ?? false;
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

  geUserThreadsByWorkspaceId = computedFn((workspaceId: string) => {
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

  // actions
  initPiChat = async (chatId?: string | undefined) => {
    // Existing chat
    if (chatId) {
      this.activeChatId = chatId;
    } else {
      this.activeChatId = "";
    }
    this.isAuthorized = true;
  };

  createNewChat = async (focus: TFocus, isProjectChat: boolean = false, workspaceId: string) => {
    this.isNewChat = true;
    let payload: TInitPayload = {
      workspace_in_context: focus.isInWorkspaceContext,
      is_project_chat: isProjectChat,
    };
    if (focus.isInWorkspaceContext) {
      payload = {
        ...payload,
        [focus.entityType]: focus.entityIdentifier,
      };
    }

    const newChatId = await this.piChatService.createChat(payload);
    this.activeChatId = newChatId;

    this.chatMap[newChatId] = {
      chat_id: newChatId,
      dialogue: [],
      title: "",
      last_modified: new Date().toISOString(),
      is_favorite: false,
      is_focus_enabled: focus.isInWorkspaceContext,
      focus_workspace_id: focus.entityType === "workspace_id" ? focus.entityIdentifier : "",
      focus_project_id: focus.entityType === "project_id" ? focus.entityIdentifier : "",
      workspace_id: workspaceId,
    };
    return newChatId;
  };

  getTemplates = async () => {
    const response = await this.piChatService.listTemplates();
    return response?.templates;
  };

  getAnswer = async (chatId: string, query: string, focus: TFocus, isProjectChat: boolean = false) => {
    if (!chatId) {
      throw new Error("Chat not initialized");
    }
    const isNewChat = this.chatMap[chatId]?.dialogue.length === 0;
    const dialogueHistory = this.chatMap[chatId]?.dialogue || [];
    const newDialogue: TDialogue = {
      query,
      llm: this.activeModel?.id,
    };

    try {
      // Optimistically update conversation with user query
      runInAction(() => {
        this.isPiThinkingMap[chatId] = true;
        this.isPiTypingMap[chatId] = true;
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          dialogue: [...dialogueHistory, newDialogue],
        }));
        if (isNewChat) {
          if (isProjectChat) {
            this.projectThreads = [chatId, ...this.projectThreads];
          } else {
            this.piThreads = [chatId, ...this.piThreads];
          }
          update(this.chatMap, chatId, (chat) => ({
            ...chat,
            title: "New Chat",
            last_modified: new Date().toISOString(),
          }));
        }
      });

      let payload: TQuery = {
        chat_id: chatId,
        query,
        is_new: isNewChat,
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
      };
      if (focus.isInWorkspaceContext) {
        payload = { ...payload, [focus.entityType]: focus.entityIdentifier };
      }

      // Api call here
      const response = await fetch(`${PI_BASE_URL}/api/v1/chat/get-answer/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // Parse code for a streaming response
      if (!response.ok) throw new Error(await response.text());
      const reader = response?.body?.pipeThrough(new TextDecoderStream()).getReader();

      let latestAiMessage = "";
      let latestAiReasoning = "";
      let isReasoning = false;

      while (true) {
        const { done, value } = await (reader?.read() as Promise<ReadableStreamReadResult<string>>);
        if (this.isPiThinkingMap[chatId]) this.isPiThinkingMap[chatId] = false;
        if (done) break;
        if (value.startsWith("title: ")) continue; // Use this title value and remove the api call to get title in the future
        if (value.startsWith("reasoning: ")) isReasoning = true;
        if (value.startsWith("data: ")) isReasoning = false;
        if (isReasoning) {
          latestAiReasoning += value.replaceAll("reasoning: ", "");
          newDialogue.reasoning = latestAiReasoning;
        } else {
          latestAiMessage += value.replaceAll("data: ", "");
          newDialogue.answer = latestAiMessage;
        }
        // Update the store with the latest ai message
        runInAction(() => {
          update(this.chatMap, chatId, (chat) => ({
            ...chat,
            dialogue: [...dialogueHistory, newDialogue],
          }));
        });
      }

      this.isPiTypingMap[chatId] = false;
      // Call the title api if its a new chat
      if (isNewChat) {
        const title = await this.piChatService.retrieveTitle(chatId);
        runInAction(() => {
          this.isNewChat = false;
          update(this.chatMap, chatId, (chat) => ({
            ...chat,
            title: title.title,
            last_modified: new Date().toISOString(),
          }));
        });
      }
      // Todo: Optimistically update the chat history
      return latestAiMessage;
    } catch (e) {
      console.log(e);
      runInAction(() => {
        newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          dialogue: [...dialogueHistory, newDialogue],
        }));
        this.isPiThinkingMap[chatId] = false;
        this.isPiTypingMap[chatId] = false;
      });
    }
  };

  fetchChatById = async (chatId: string) => {
    if (this.isNewChat) return;
    try {
      // Call api here
      runInAction(() => {
        this.isLoadingMap[chatId] = true;
      });
      const response = await this.piChatService.retrieveChat(chatId);
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          ...response.results,
        }));
        this.isLoadingMap[chatId] = false;
        this.isNewChat = response.results.dialogue.length === 0;
      });
    } catch (e: any) {
      runInAction(() => {
        if (e?.status === 403) {
          this.isAuthorized = false;
          this.isNewChat = false;
        } else {
          this.isNewChat = true;
        }
        this.isLoadingMap[chatId] = false;
      });
    }
  };

  fetchUserThreads = async (workspaceId: string, isProjectChat: boolean = false) => {
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
      runInAction(() => {
        this.isLoadingThreads = false;
      });
    }
  };

  fetchRecentChats = async (isProjectChat: boolean = false) => {
    try {
      const threads = isProjectChat ? this.projectThreads : this.piThreads;
      runInAction(() => {
        this.isLoadingThreads = true;
      });
      const response = await this.piChatService.listRecentChats();
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

  fetchModels = async () => {
    try {
      const response = await this.piChatService.listAiModels();
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

  sendFeedback = async (chatId: string, message_index: number, feedback: EFeedback, feedbackMessage?: string) => {
    const initialState = this.chatMap[chatId]?.dialogue?.[message_index]?.feedback;
    runInAction(() => {
      runInAction(() => {
        if (this.chatMap[chatId]?.dialogue?.[message_index]) {
          set(this.chatMap[chatId].dialogue[message_index], "feedback", feedback);
        }
      });
    });
    try {
      const response = await this.piChatService.postFeedback({
        message_index,
        chat_id: chatId,
        feedback,
        feedback_message: feedbackMessage,
      });
      return response;
    } catch (e) {
      runInAction(() => {
        if (this.chatMap[chatId]?.dialogue?.[message_index]) {
          set(this.chatMap[chatId].dialogue[message_index], "feedback", initialState);
        }
      });
      throw e;
    }
  };

  fetchFavoriteChats = async (workspaceId: string) => {
    this.isLoadingFavoriteChats = true;
    const response = await this.piChatService.listFavoriteChats(workspaceId);
    runInAction(() => {
      response.forEach((chat) => {
        update(this.chatMap, chat.chat_id, (prev) => ({
          ...prev,
          title: chat.title,
          is_favorite: true,
        }));
      });
      this.favoriteChats = response.map((chat) => chat.chat_id);
      this.isLoadingFavoriteChats = false;
    });
  };

  favoriteChat = async (chatId: string) => {
    const favoriteChats = this.favoriteChats;
    try {
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          is_favorite: true,
        }));
        this.favoriteChats = [...this.favoriteChats, chatId];
      });
      await this.piChatService.favoriteChat(chatId);
    } catch (e) {
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          is_favorite: false,
        }));
        this.favoriteChats = favoriteChats;
      });
    }
  };

  unfavoriteChat = async (chatId: string) => {
    const favoriteChats = this.favoriteChats;
    try {
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          is_favorite: false,
        }));
        this.favoriteChats = favoriteChats.filter((id) => id !== chatId);
      });
      await this.piChatService.unfavoriteChat(chatId);
    } catch (e) {
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          is_favorite: true,
        }));
        this.favoriteChats = favoriteChats;
      });
    }
  };

  renameChat = async (chatId: string, title: string) => {
    const initialState = this.chatMap[chatId]?.title;
    try {
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          title,
        }));
      });
      await this.piChatService.renameChat(chatId, title);
    } catch (e) {
      runInAction(() => {
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          title: initialState,
        }));
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
}
