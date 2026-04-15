import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { AIService } from "@plane/services";
import type { TChatMessage, TChatToolAction } from "@plane/services";

const generateId = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const aiService = new AIService();

export type TAiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: TChatToolAction[];
};

export interface IAiChatStore {
  // observables
  isOpen: boolean;
  isLoading: boolean;
  messages: TAiChatMessage[];
  // actions
  togglePanel: (open?: boolean) => void;
  sendMessage: (workspaceSlug: string, content: string) => Promise<void>;
  clearMessages: () => void;
}

export class AiChatStore implements IAiChatStore {
  // observables
  isOpen: boolean = false;
  isLoading: boolean = false;
  messages: TAiChatMessage[] = [];

  constructor() {
    makeObservable(this, {
      isOpen: observable.ref,
      isLoading: observable.ref,
      messages: observable,
      togglePanel: action,
      sendMessage: action,
      clearMessages: action,
    });
  }

  togglePanel = (open?: boolean) => {
    this.isOpen = open !== undefined ? open : !this.isOpen;
  };

  sendMessage = async (workspaceSlug: string, content: string) => {
    const userMessage: TAiChatMessage = {
      id: generateId(),
      role: "user",
      content,
    };

    runInAction(() => {
      this.messages.push(userMessage);
      this.isLoading = true;
    });

    try {
      const history: TChatMessage[] = this.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await aiService.chat(workspaceSlug, { messages: history });

      runInAction(() => {
        this.messages.push({
          id: generateId(),
          role: "assistant",
          content: result.response,
          actions: result.actions,
        });
      });
    } catch {
      runInAction(() => {
        this.messages.push({
          id: generateId(),
          role: "assistant",
          content: "Произошла ошибка. Попробуй ещё раз.",
        });
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  clearMessages = () => {
    this.messages = [];
  };
}
