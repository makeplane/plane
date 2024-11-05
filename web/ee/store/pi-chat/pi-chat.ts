import { set } from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
import { PI_BASE_URL } from "@/helpers/common.helper";
import { WorkspaceService } from "@/plane-web/services";
import { PiChatService } from "@/plane-web/services/pi-chat.service";
import { RootStore } from "@/plane-web/store/root.store";
import { EFeedback, TChatHistory, TFocus, TTemplate, TUserThreads } from "@/plane-web/types";
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
  // computed fn
  geUserThreads: (userId: string) => TUserThreads[];
  currentFocus: TFocus;
  // actions
  initPiChat: (chatId?: string) => string;
  fetchChatById: (chatId: string) => void;
  getAnswer: (query: string, user_id: string) => Promise<string>;
  getTemplates: () => Promise<TTemplate[]>;
  fetchUserThreads: (userId: string) => void;
  searchCallback: (workspace: string, query: string) => Promise<IFormattedValue>;
  sendFeedback: (feedback: EFeedback) => Promise<void>;
  setFocus: (chatId: string, entityType: string, entityIdentifier: string) => void;
  startChatWithTemplate: (template: TTemplate, userId: string) => Promise<void>;
}

export class PiChatStore implements IPiChatStore {
  activeChatId = "";
  isNewChat: boolean = true;
  isLoading: boolean = false;
  isPiTyping = false;
  isUserTyping = false;
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

    // Optimistically update conversation with user query
    runInAction(() => {
      this.isPiTyping = true;
      this.activeChat = {
        ...this.activeChat,
        dialogue: [...this.activeChat.dialogue, query],
      };
      this.isUserTyping = false;
      if (isNewChat)
        set(this.threads, userId, [
          {
            chat_id: this.activeChatId,
            title: "New Chat",
            last_modified: new Date().toISOString(),
          },
          ...userThreads,
        ]);
    });

    let payload = {
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

    const dialogueHistory = this.activeChat.dialogue;
    let latestAiMessage = "";

    while (true) {
      const { done, value } = await (reader?.read() as Promise<ReadableStreamReadResult<string>>);
      if (this.isPiTyping) this.isPiTyping = false;
      if (done) break;
      if (value.startsWith("title: ")) continue; // Use this title value and remove the api call to get title in the future

      let formattedValue = value.replaceAll("data: ", "");
      formattedValue = formattedValue.replaceAll("\n", "");
      latestAiMessage += formattedValue;

      // Update the store with the latest ai message
      runInAction(() => {
        this.activeChat = {
          ...this.activeChat,
          dialogue: [...dialogueHistory, latestAiMessage],
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
      console.log(e);
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
