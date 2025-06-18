import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { PI_BASE_URL  } from "@plane/constants";
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
  TQuery,
  TTemplate,
  TUserThreads,
} from "@/plane-web/types";

export interface IPiChatStore {
  isInWorkspaceContext: boolean;
  isNewChat: boolean;
  isLoading: boolean;
  activeChatId: string;
  activeChat: TChatHistory;
  chatMap: Record<string, TChatHistory>; // chat_id -> chat
  focus: Record<string, TFocus>;
  isPiThinking: boolean;
  isPiTyping: boolean;
  isUserTyping: boolean;
  threads: Record<string, string[]>; // user -> chat_ids
  activeModel: TAiModels | undefined;
  models: TAiModels[];
  isAuthorized: boolean;
  // computed fn
  geUserThreads: (userId: string) => TUserThreads[];
  currentFocus: TFocus;
  // actions
  initPiChat: (chatId?: string) => string;
  fetchChatById: (chatId: string) => void;
  getAnswer: (chatId: string, query: string, user_id: string) => Promise<string | undefined>;
  getTemplates: () => Promise<TTemplate[]>;
  fetchUserThreads: (userId: string, workspaceId: string) => void;
  searchCallback: (workspace: string, query: string) => Promise<IFormattedValue>;
  sendFeedback: (chatId: string, message_index: number, feedback: EFeedback, feedbackMessage?: string) => Promise<void>;
  setFocus: (chatId: string, entityType: string, entityIdentifier: string) => void;
  fetchModels: () => Promise<void>;
  setActiveModel: (model: TAiModels) => void;
  setIsInWorkspaceContext: (value: boolean) => void;
}

export class PiChatStore implements IPiChatStore {
  activeChatId = "";
  isInWorkspaceContext = true;
  isNewChat: boolean = true;
  models: TAiModels[] = [];
  activeModel: TAiModels | undefined = undefined;
  isAuthorized = true;
  chatMap: Record<string, TChatHistory> = {};
  focus: Record<string, TFocus> = {};
  threads: Record<string, string[]> = {};
  isPiThinkingMap: Record<string, boolean> = {};
  isPiTypingMap: Record<string, boolean> = {};
  isUserTypingMap: Record<string, boolean> = {};
  isLoadingMap: Record<string, boolean> = {};
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
      focus: observable,
      threads: observable,
      models: observable,
      activeModel: observable,
      isInWorkspaceContext: observable,
      isPiThinkingMap: observable,
      isPiTypingMap: observable,
      isUserTypingMap: observable,
      isLoadingMap: observable,
      isAuthorized: observable,
      // computed
      currentFocus: computed,
      activeChat: computed,
      isPiThinking: computed,
      isPiTyping: computed,
      isUserTyping: computed,
      isLoading: computed,
      // actions
      initPiChat: action,
      getAnswer: action,
      getTemplates: action,
      fetchUserThreads: action,
      searchCallback: action,
      sendFeedback: action,
      setFocus: action,
      fetchModels: action,
      setActiveModel: action,
      setIsInWorkspaceContext: action,
    });

    //services
    this.rootStore = store;
    this.userStore = store.user;
    this.piChatService = new PiChatService();
    this.workspaceService = new WorkspaceService();
  }

  get currentFocus() {
    return this.focus[this.activeChatId];
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

  get isUserTyping() {
    return this.isUserTypingMap[this.activeChatId] ?? false;
  }

  get isLoading() {
    return this.isLoadingMap[this.activeChatId] ?? false;
  }

  setLocalStorage = (chatId: string, key: string, value: string | boolean) => {
    const existingData = JSON.parse(localStorage.getItem(`chat-focus-${chatId}`) || "{}");
    localStorage.setItem(`chat-focus-${chatId}`, JSON.stringify({ ...existingData, [key]: value }));
  };

  setFocus = (chatId: string, entityType: string, entityIdentifier: string) => {
    set(this.focus, [chatId], { entityType, entityIdentifier });
    this.setLocalStorage(chatId, "entityType", entityType);
    this.setLocalStorage(chatId, "entityIdentifier", entityIdentifier);
  };

  setActiveModel = (model: TAiModels) => {
    this.activeModel = model;
  };

  setIsInWorkspaceContext = (value: boolean) => {
    this.isInWorkspaceContext = value;
    this.setLocalStorage(this.activeChatId, "isInWorkspaceContext", value);
    if (isEmpty(this.currentFocus) && this.rootStore.workspaceRoot.currentWorkspace?.id) {
      this.setFocus(this.activeChatId, "workspace_id", this.rootStore.workspaceRoot.currentWorkspace?.id);
    }
  };

  // computed
  geUserThreads = computedFn((userId: string) => {
    if (!userId || !this.threads[userId]) return [];
    return this.threads[userId]?.map((chatId) => this.chatMap[chatId]);
  });

  // actions
  initPiChat = (chatId?: string) => {
    // Existing chat
    if (chatId) {
      this.activeChatId = chatId;
      this.isNewChat = false;
    }
    // New Chat
    else {
      // Generate new chat
      const id = uuidv4();
      this.activeChatId = id;
      this.isNewChat = true;
      this.isLoadingMap[id] = false;
      this.chatMap[id] = {
        chat_id: id,
        dialogue: [],
        title: "",
        last_modified: new Date().toISOString(),
      };
    }
    this.isAuthorized = true;
    // Set Focus
    const existingFocus = JSON.parse(localStorage.getItem(`chat-focus-${this.activeChatId}`) || "{}");
    set(this.focus, [this.activeChatId], {
      entityType: existingFocus.entityType || "workspace_id",
      entityIdentifier: existingFocus.entityIdentifier || this.rootStore.workspaceRoot.currentWorkspace?.id,
    });
    this.isInWorkspaceContext = existingFocus.isInWorkspaceContext ?? true;

    return this.activeChatId;
  };

  getTemplates = async () => {
    const response = await this.piChatService.getTemplate();
    return response?.templates;
  };

  getAnswer = async (chatId: string, query: string, userId: string) => {
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
        this.isNewChat = false;
        this.isPiThinkingMap[chatId] = true;
        this.isPiTypingMap[chatId] = true;
        update(this.chatMap, chatId, (chat) => ({
          ...chat,
          dialogue: [...dialogueHistory, newDialogue],
        }));
        this.isUserTypingMap[chatId] = false;
        if (isNewChat) {
          update(this.threads, userId, (threads) => [chatId, ...(threads || [])]);
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
        user_id: userId,
        is_temp: false,
        workspace_in_context: this.isInWorkspaceContext,
        source: ESource.WEB,
        llm: this.activeModel?.id,
        context: this.userStore.data
          ? {
              first_name: this.userStore.data.first_name,
              last_name: this.userStore.data.last_name,
              email: this.userStore.data.email,
            }
          : {},
      };
      if (this.currentFocus)
        payload = { ...payload, [this.currentFocus.entityType]: this.currentFocus.entityIdentifier };

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
        const title = await this.piChatService.getTitle(chatId);
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
        this.isUserTypingMap[chatId] = false;
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
      const response = await this.piChatService.getChatById(chatId);
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

  fetchUserThreads = async (userId: string, workspaceId: string) => {
    const response = await this.piChatService.getUserThreads(userId, workspaceId);
    runInAction(() => {
      response.results.forEach((chat) => {
        update(this.chatMap, chat.chat_id, (prev) => ({
          ...prev,
          chat_id: chat.chat_id,
          title: chat.title,
          last_modified: chat.last_modified,
        }));
      });
      set(
        this.threads,
        userId,
        response.results.map((chat) => chat.chat_id)
      );
    });
  };

  fetchModels = async () => {
    try {
      const response = await this.piChatService.getAiModels();
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

  searchCallback = async (workspace: string, search: string): Promise<IFormattedValue> => {
    const filteredProjectId =
      this.currentFocus?.entityType === "project_id" ? this.currentFocus?.entityIdentifier : undefined;
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
}
