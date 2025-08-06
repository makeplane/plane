// constants
import { PI_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";
import {
  TFeedback,
  TQuery,
  TSearchQuery,
  TTemplate,
  TChatHistory,
  TUserThreads,
  TAiModels,
  TInitPayload,
} from "../types";

type TTemplateResponse = {
  templates: TTemplate[];
};
type TChatHistoryResponse = {
  results: TChatHistory;
};
export type TUserThreadsResponse = {
  results: TUserThreads[];
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  total_pages: number;
};
type TTitleResponse = {
  title: string;
};
type TAiModelsResponse = {
  models: TAiModels[];
};
export class PiChatService extends APIService {
  constructor() {
    super(PI_BASE_URL);
  }

  // initiatialize chat
  async createChat(data: TInitPayload): Promise<string> {
    const r = await this.post(`/api/v1/chat/initialize-chat/`, data)
      .then((response) => response?.data?.chat_id)
      .catch((error) => {
        throw error?.response?.data;
      });

    return r;
  }

  async retrieveToken(data: TQuery): Promise<string> {
    const streamToken = await this.post(`/api/v1/chat/queue-answer/`, data)
      .then((response) => response?.data?.stream_token)
      .catch((error) => {
        throw error?.response?.data;
      });

    return streamToken;
  }

  // fetch answer
  async retrieveAnswer(data: TQuery): Promise<string> {
    const r = await this.post(`/api/v1/chat/get-answer/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });

    return r;
  }

  // fetch templates
  async listTemplates(): Promise<TTemplateResponse> {
    return this.get(`/api/v1/chat/get-templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // generate title
  async retrieveTitle(chatId: string): Promise<TTitleResponse> {
    return this.post(`/api/v1/chat/generate-title/`, { chat_id: chatId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // search chats
  async searchChats(data: TSearchQuery): Promise<void> {
    return this.post(`/api/v1/chat/search-chats/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // post feedback
  async postFeedback(data: TFeedback): Promise<void> {
    return this.post(`/api/v1/chat/feedback/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get chat by id
  async retrieveChat(chatId: string): Promise<TChatHistoryResponse> {
    return this.get(`/api/v1/chat/get-chat-history-object/`, {
      params: {
        chat_id: chatId,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  // get user threads
  async listUserThreads(
    workspaceId: string,
    is_project_chat: boolean,
    cursor: string = "0"
  ): Promise<TUserThreadsResponse> {
    return this.get(`/api/v1/chat/get-user-threads/`, {
      params: {
        per_page: 100,
        workspace_id: workspaceId,
        is_project_chat,
        cursor,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get recent chats
  async listRecentChats(): Promise<TUserThreadsResponse> {
    return this.get(`/api/v1/chat/get-recent-user-threads/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get models
  async listAiModels(): Promise<TAiModelsResponse> {
    return this.get(`/api/v1/chat/get-models/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // favorite chat
  async favoriteChat(chatId: string): Promise<void> {
    return this.post(`/api/v1/chat/favorite-chat/`, { chat_id: chatId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // unfavorite chat
  async unfavoriteChat(chatId: string): Promise<void> {
    return this.post(`/api/v1/chat/unfavorite-chat/`, { chat_id: chatId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get favorite chats
  async listFavoriteChats(workspaceId: string): Promise<TUserThreads[]> {
    return this.get(`/api/v1/chat/get-favorite-chats/`, {
      params: { workspace_id: workspaceId },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // rename chat
  async renameChat(chatId: string, title: string): Promise<void> {
    return this.post(`/api/v1/chat/rename-chat/`, { chat_id: chatId, title })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // delete chat
  async destroyChat(chatId: string, workspaceSlug: string): Promise<void> {
    return this.delete(`/api/v1/chat/delete-chat/`, { chat_id: chatId, workspace_slug: workspaceSlug })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
