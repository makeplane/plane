import { set } from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
import { PI_BASE_URL } from "@/helpers/common.helper";
import { WorkspaceService } from "@/plane-web/services";
import { PiChatService } from "@/plane-web/services/pi-chat.service";
import { RootStore } from "@/plane-web/store/root.store";
import {
  EFeedback,
  TAiModels,
  TChatHistory,
  TDialogue,
  TFocus,
  TQuery,
  TTemplate,
  TUserThreads,
} from "@/plane-web/types";
import { formatSearchQuery, IFormattedValue } from "./helper";

export interface IPiChatStore {
  isNewChat: boolean;
  isLoading: boolean;
  activeChatId: string;
  activeChat: TChatHistory;
  focus: Record<string, TFocus>;
  isPiTyping: boolean;
  isUserTyping: boolean;
  threads: Record<string, TUserThreads[]>; // user -> threads
  activeModel: TAiModels | undefined;
  models: TAiModels[];
  // computed fn
  geUserThreads: (userId: string) => TUserThreads[];
  currentFocus: TFocus;
  // actions
  initPiChat: (chatId?: string) => string;
  fetchChatById: (chatId: string) => void;
  getAnswer: (query: string, user_id: string) => Promise<string | undefined>;
  getTemplates: () => Promise<TTemplate[]>;
  fetchUserThreads: (userId: string) => void;
  searchCallback: (workspace: string, query: string) => Promise<IFormattedValue>;
  sendFeedback: (feedback: EFeedback) => Promise<void>;
  setFocus: (chatId: string, entityType: string, entityIdentifier: string) => void;
  startChatWithTemplate: (template: TTemplate, userId: string) => Promise<void>;
  fetchModels: () => Promise<void>;
  setActiveModel: (model: TAiModels) => void;
}

export class PiChatStore implements IPiChatStore {
  activeChatId = "";
  isNewChat: boolean = true;
  isLoading: boolean = false;
  isPiTyping = false;
  isUserTyping = false;
  models: TAiModels[] = [];
  activeModel: TAiModels | undefined = undefined;
  activeChat: TChatHistory = {
    chat_id: "",
    dialogue: [],
    title: "",
  };
  focus: Record<string, TFocus> = {};
  threads: Record<string, TUserThreads[]> = {};

  //services
  piChatService;
  workspaceService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      //observables
      isLoading: observable,
      isNewChat: observable,
      isPiTyping: observable,
      isUserTyping: observable,
      activeChatId: observable,
      focus: observable,
      activeChat: observable,
      threads: observable,
      models: observable,
      activeModel: observable,
      // computed
      currentFocus: computed,
      // actions
      initPiChat: action,
      getAnswer: action,
      getTemplates: action,
      fetchUserThreads: action,
      searchCallback: action,
      sendFeedback: action,
      setFocus: action,
      startChatWithTemplate: action,
      fetchModels: action,
      setActiveModel: action,
    });

    //services
    this.piChatService = new PiChatService();
    this.workspaceService = new WorkspaceService();
  }

  get currentFocus() {
    return this.focus[this.activeChatId];
  }

  setFocus = (chatId: string, entityType: string, entityIdentifier: string) => {
    set(this.focus, [chatId], { entityType, entityIdentifier });
  };

  setActiveModel = (model: TAiModels) => {
    this.activeModel = model;
  };

  // computed
  geUserThreads = computedFn((userId: string) => {
    if (!userId) return [];
    return this.threads[userId];
  });

  // actions
  initPiChat = (chatId?: string) => {
    this.activeChat = {
      chat_id: "",
      dialogue: [],
      title: "",
    };

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
      this.isLoading = false;
    }
    return this.activeChatId;
  };

  getTemplates = async () => {
    const response = await this.piChatService.getTemplate();
    return response?.templates;
  };

  getAnswer = async (query: string, userId: string) => {
    if (!this.activeChatId) {
      throw new Error("Chat not initialized");
    }
    const isNewChat = this.activeChat.dialogue.length === 0;
    const userThreads = this.threads[userId];
    const dialogueHistory = this.activeChat.dialogue;
    const newDialogue: TDialogue = {
      query,
    };

    try {
      // Optimistically update conversation with user query
      runInAction(() => {
        this.isPiTyping = true;
        this.activeChat = {
          ...this.activeChat,
          dialogue: [...this.activeChat.dialogue, newDialogue],
        };
        this.isUserTyping = false;
        if (isNewChat && userThreads)
          set(this.threads, userId, [
            {
              chat_id: this.activeChatId,
              title: "New Chat",
              last_modified: new Date().toISOString(),
            },
            ...userThreads,
          ]);
      });

      let payload: TQuery = {
        chat_id: this.activeChatId,
        query,
        is_new: true,
        user_id: userId,
        is_temp: false,
        workspace_in_context: true,
      };
      payload = this.currentFocus
        ? { ...payload, [this.currentFocus.entityType]: this.currentFocus.entityIdentifier }
        : payload;

      if (isNewChat) {
        payload.llm = this.activeModel?.name;
        newDialogue.llm = this.activeModel?.name;
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

      while (true) {
        const { done, value } = await (reader?.read() as Promise<ReadableStreamReadResult<string>>);
        if (this.isPiTyping) this.isPiTyping = false;
        if (done) break;
        if (value.startsWith("title: ")) continue; // Use this title value and remove the api call to get title in the future

        latestAiMessage += value.replaceAll("data: ", "");
        newDialogue.answer = latestAiMessage;

        // Update the store with the latest ai message
        runInAction(() => {
          this.activeChat = {
            ...this.activeChat,
            dialogue: [...dialogueHistory, newDialogue],
          };
        });
      }

      // Call the title api if its a new chat
      if (isNewChat) {
        const title = await this.piChatService.getTitle(this.activeChatId);
        runInAction(() => {
          set(this.threads, userId, [
            {
              chat_id: this.activeChatId,
              title: title.title,
              last_modified: new Date().toISOString(),
            },
            ...userThreads,
          ]);
        });
      }

      // Todo: Optimistically update the chat history
      return latestAiMessage;
    } catch (e) {
      runInAction(() => {
        newDialogue.answer = "Sorry, I am unable to answer that right now. Please try again later.";
        this.activeChat = {
          ...this.activeChat,
          dialogue: [...dialogueHistory, newDialogue],
        };
        this.isPiTyping = false;
        this.isUserTyping = false;
      });
    }
  };

  startChatWithTemplate = async (template: TTemplate, userId: string) => {
    const placeholder = await this.piChatService.getPlaceHolder(template);
    runInAction(() => {
      this.isUserTyping = true;
    });

    await this.getAnswer(placeholder.placeholder, userId);
  };

  fetchChatById = async (chatId: string) => {
    if (this.isNewChat) return;
    try {
      // Call api here
      runInAction(() => {
        this.isLoading = true;
      });
      const response = await this.piChatService.getChatById(chatId);

      runInAction(() => {
        this.activeChat = response.results;
        this.isLoading = false;
        this.isNewChat = response.results.dialogue.length === 0;
      });
    } catch (e) {
      runInAction(() => {
        this.isLoading = false;
        this.isNewChat = true;
      });
    }
  };

  fetchUserThreads = async (userId: string) => {
    const response = await this.piChatService.getUserThreads(userId);
    runInAction(() => {
      set(this.threads, userId, response.results);
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
      this.focus[this.activeChatId]?.entityType === "project_id"
        ? this.focus[this.activeChatId]?.entityIdentifier
        : undefined;
    let params: { search: string; projectId?: string } = { search };
    if (filteredProjectId) {
      params = {
        ...params,
        projectId: filteredProjectId,
      };
    }
    const response = await this.workspaceService.searchAcrossWorkspace(workspace, params);

    return formatSearchQuery(response.results);
  };

  sendFeedback = async (feedback: EFeedback) => {
    const response = await this.piChatService.postFeedback({ chat_id: this.activeChatId, feedback });
    return response;
  };
}