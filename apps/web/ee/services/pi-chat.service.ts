// constants
import { PI_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";
import {
  TFeedback,
  TQuery,
  TSearchQuery,
  TTemplate,
  TUserThreads,
  TAiModels,
  TInitPayload,
  TAction,
  TExecuteActionResponse,
  TDialogue,
  TArtifact,
} from "../types";

type TTemplateResponse = {
  templates: TTemplate[];
};
type TChatHistoryResponse = {
  results: {
    chat_id: string;
    dialogue: TDialogue[];
    title: string;
    last_modified: string;
    is_favorite: boolean;
    is_focus_enabled: boolean;
    focus_workspace_id: string;
    focus_project_id: string;
    workspace_id?: string;
  };
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

  async transcribeAudio(workspace_id: string, formData: FormData, chat_id: string): Promise<string> {
    try {
      const response = await this.post(`/api/v1/transcription/transcribe`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          workspace_id,
          chat_id,
        },
      });

      return response?.data?.detail;
    } catch (error: any) {
      throw error?.response?.data;
    }
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
  async listTemplates(workspaceId: string | undefined): Promise<TTemplateResponse> {
    return this.get(`/api/v1/chat/get-templates/`, {
      params: {
        ...(workspaceId && { workspace_id: workspaceId }),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // generate title
  async retrieveTitle(chatId: string, workspaceId: string | undefined): Promise<TTitleResponse> {
    return this.post(`/api/v1/chat/generate-title/`, {
      chat_id: chatId,
      ...(workspaceId && { workspace_id: workspaceId }),
    })
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
  async retrieveChat(chatId: string, workspaceId: string | undefined): Promise<TChatHistoryResponse> {
    return this.get(`/api/v1/chat/get-chat-history-object/`, {
      params: {
        chat_id: chatId,
        ...(workspaceId && { workspace_id: workspaceId }),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  // get user threads
  async listUserThreads(
    workspaceId: string | undefined,
    is_project_chat: boolean,
    cursor: string = "0"
  ): Promise<TUserThreadsResponse> {
    return this.get(`/api/v1/chat/get-user-threads/`, {
      params: {
        per_page: 100,
        is_project_chat,
        cursor,
        ...(workspaceId && { workspace_id: workspaceId }),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get recent chats
  async listRecentChats(workspaceId: string | undefined): Promise<TUserThreadsResponse> {
    return this.get(`/api/v1/chat/get-recent-user-threads/`, {
      params: {
        ...(workspaceId && { workspace_id: workspaceId }),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get models
  async listAiModels(workspaceId?: string): Promise<TAiModelsResponse> {
    return this.get(`/api/v1/chat/get-models/`, {
      params: {
        ...(workspaceId && { workspace_id: workspaceId }),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // favorite chat
  async favoriteChat(chatId: string, workspaceId: string | undefined): Promise<void> {
    return this.post(`/api/v1/chat/favorite-chat/`, {
      chat_id: chatId,
      ...(workspaceId && { workspace_id: workspaceId }),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // unfavorite chat
  async unfavoriteChat(chatId: string, workspaceId: string | undefined): Promise<void> {
    return this.post(`/api/v1/chat/unfavorite-chat/`, {
      chat_id: chatId,
      ...(workspaceId && { workspace_id: workspaceId }),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get favorite chats
  async listFavoriteChats(workspaceId: string | undefined): Promise<TUserThreads[]> {
    return this.get(`/api/v1/chat/get-favorite-chats/`, {
      params: {
        ...(workspaceId && { workspace_id: workspaceId }),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // rename chat
  async renameChat(chatId: string, title: string, workspaceId: string | undefined): Promise<void> {
    return this.post(`/api/v1/chat/rename-chat/`, {
      chat_id: chatId,
      title,
      ...(workspaceId && { workspace_id: workspaceId }),
    })
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

  // execute action
  async executeAction(data: TAction): Promise<TExecuteActionResponse> {
    return this.post(`/api/v1/chat/execute-action/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get artifact
  async listArtifacts(chatId: string): Promise<TArtifact[]> {
    return this.get(`/api/v1/artifacts/chat/${chatId}`)
      .then((response) => response.data.artifacts)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
