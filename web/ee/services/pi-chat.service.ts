// helpers
import { PI_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";
import { TFeedback, TQuery, TSearchQuery, TTemplate, TChatHistory, TUserThreads, TAiModels } from "../types";

type TTemplateResponse = {
  templates: TTemplate[];
};
type TChatHistoryResponse = {
  results: TChatHistory;
};
type TUserThreadsResponse = {
  results: TUserThreads[];
};
type TTitleResponse = {
  title: string;
};
type TPlaceholderResponse = {
  placeholder: string;
};
type TAiModelsResponse = {
  models: TAiModels[];
};
export class PiChatService extends APIService {
  constructor() {
    super(PI_BASE_URL);
  }

  // fetch answer
  async getAnswer(data: TQuery): Promise<string> {
    const r = await this.post(`/api/v1/chat/get-answer/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });

    return r;
  }

  // fetch templates
  async getTemplate(): Promise<TTemplateResponse> {
    return this.get(`/api/v1/chat/get-templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // generate title
  async getTitle(chatId: string): Promise<TTitleResponse> {
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

  // get placeholder
  async getPlaceHolder(data: TTemplate): Promise<TPlaceholderResponse> {
    return this.post(`/api/v1/chat/get-placeholder/`, data)
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
  async getChatById(chatId: string): Promise<TChatHistoryResponse> {
    return this.post(`/api/v1/chat/get-chat-history-object/`, { chat_id: chatId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get user threads
  async getUserThreads(userId: string): Promise<TUserThreadsResponse> {
    return this.post(`/api/v1/chat/get-user-threads/`, { user_id: userId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get models
  async getAiModels(): Promise<TAiModelsResponse> {
    return this.get(`/api/v1/chat/get-models/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
