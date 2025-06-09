import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
import { PI_BASE_URL } from "@/helpers/common.helper";
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
  focus: Record<string, TFocus>;
  isPiThinking: boolean;
  isPiTyping: boolean;
  isUserTyping: boolean;
  threads: Record<string, TUserThreads[]>; // user -> threads
  activeModel: TAiModels | undefined;
  models: TAiModels[];
  isAuthorized: boolean;
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
  sendFeedback: (message_index: number, feedback: EFeedback, feedbackMessage?: string) => Promise<void>;
  setFocus: (chatId: string, entityType: string, entityIdentifier: string) => void;
  startChatWithTemplate: (template: TTemplate, userId: string) => Promise<void>;
  fetchModels: () => Promise<void>;
  setActiveModel: (model: TAiModels) => void;
  setIsInWorkspaceContext: (value: boolean) => void;
}

export class PiChatStore implements IPiChatStore {
  activeChatId = "";
  isInWorkspaceContext = true;
  isNewChat: boolean = true;
  isLoading: boolean = false;
  isPiThinking = false;
  isPiTyping = false;
  isUserTyping = false;
  models: TAiModels[] = [];
  activeModel: TAiModels | undefined = undefined;
  isAuthorized = true;
  activeChat: TChatHistory = {
    chat_id: "",
    dialogue: [],
    title: "",
  };
  focus: Record<string, TFocus> = {};
  threads: Record<string, TUserThreads[]> = {};

  //services
  userStore;
  rootStore;
  piChatService;
  workspaceService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      //observables
      isLoading: observable,
      isNewChat: observable,
      isPiThinking: observable,
      isPiTyping: observable,
      isUserTyping: observable,
      activeChatId: observable,
      focus: observable,
      activeChat: observable,
      threads: observable,
      models: observable,
      activeModel: observable,
      isInWorkspaceContext: observable,
      isAuthorized: observable,
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

  setFocus = (chatId: string, entityType: string, entityIdentifier: string) => {
    set(this.focus, [chatId], { entityType, entityIdentifier });
  };

  setActiveModel = (model: TAiModels) => {
    this.activeModel = model;
  };

  setIsInWorkspaceContext = (value: boolean) => {
    this.isInWorkspaceContext = value;
    if (isEmpty(this.focus[this.activeChatId]) && this.rootStore.workspaceRoot.currentWorkspace?.id) {
      this.setFocus(this.activeChatId, "workspace_id", this.rootStore.workspaceRoot.currentWorkspace?.id);
    }
  };

  // computed
  geUserThreads = computedFn((userId: string) => {
    if (!userId) return [];
    return this.threads[userId];
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
      this.activeChat = {
        chat_id: "",
        dialogue: [],
        title: "",
      };
      // Generate new chat
      const id = uuidv4();
      this.activeChatId = id;
      this.isNewChat = true;
      this.isLoading = false;
    }
    this.isAuthorized = true;
    // Set Focus
    if (isEmpty(this.focus[this.activeChatId]) && this.rootStore.workspaceRoot.currentWorkspace?.id) {
      this.setFocus(this.activeChatId, "workspace_id", this.rootStore.workspaceRoot.currentWorkspace?.id);
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
      llm: this.activeModel?.id,
    };

    try {
      // Optimistically update conversation with user query
      runInAction(() => {
        this.isPiThinking = true;
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
        if (this.isPiThinking) this.isPiThinking = false;
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
          this.activeChat = {
            ...this.activeChat,
            dialogue: [...dialogueHistory, newDialogue],
          };
        });
      }

      this.isPiTyping = false;
      // Call the title api if its a new chat
      if (isNewChat) {
        this.isNewChat = false;
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
        this.isPiThinking = false;
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
    } catch (e: any) {
      runInAction(() => {
        if (e?.status === 403) {
          this.isAuthorized = false;
          this.isNewChat = false;
        } else {
          this.isNewChat = true;
        }
        this.isLoading = false;
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

    return response.results;
  };

  sendFeedback = async (message_index: number, feedback: EFeedback, feedbackMessage?: string) => {
    const initialState = this.activeChat.dialogue[message_index].feedback;
    runInAction(() => {
      set(this.activeChat.dialogue[message_index], "feedback", feedback);
    });
    try {
      const response = await this.piChatService.postFeedback({
        message_index,
        chat_id: this.activeChatId,
        feedback,
        feedback_message: feedbackMessage,
      });
      return response;
    } catch (e) {
      runInAction(() => {
        set(this.activeChat.dialogue[message_index], "feedback", initialState);
      });
      throw e;
    }
  };
}
