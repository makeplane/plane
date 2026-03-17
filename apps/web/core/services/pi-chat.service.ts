/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// constants
import type { AxiosRequestConfig } from "axios";
import { PI_URL } from "@plane/constants";

// services
import { APIService } from "@/services/api.service";
import type {
  TFeedback,
  TQuery,
  TSearchQuery,
  TInstanceResponse,
  TUserThreads,
  TAiModels,
  TInitPayload,
  TAction,
  TExecuteActionResponse,
  TDialogue,
  TArtifact,
  TFollowUpResponse,
  TUpdatedArtifact,
  TPiAttachment,
  TTemplate,
} from "../types";

type TChatHistoryResponse = {
  results: {
    chat_id: string;
    dialogue: TDialogue[];
    title: string;
    last_modified: string;
    is_favorite: boolean;
    is_focus_enabled: boolean;
    is_websearch_enabled: boolean;
    focus_workspace_id: string;
    focus_project_id: string;
    workspace_id?: string;
    llm?: string;
    mode?: string;
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

/**
 * @description combine the file path with the base URL
 * @param {string} path
 * @returns {string} final URL with the base URL
 */
export const getPiFileURL = (path: string): string | undefined => {
  if (!path) return undefined;
  const isValidURL = path.startsWith("http");
  if (isValidURL) return path;
  return `${PI_URL}${path}`;
};

export class PiChatService extends APIService {
  constructor() {
    super(PI_URL);
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

  // fetch instance
  async getInstance(workspaceId: string): Promise<TInstanceResponse> {
    return this.get(`/api/v1/chat/start/auth-check/`, {
      params: {
        workspace_id: workspaceId,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get preset templates
  async fetchPrompts(data: {
    workspace_id: string;
    mode: string;
    project_id: string | undefined;
    entity_id: string | undefined;
    entity_type: string | undefined;
  }): Promise<{ templates: TTemplate[] }> {
    return this.post(`/api/v1/chat/start/set-prompts/`, data)
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
  async listFavoriteChats(workspaceId: string | undefined, isProjectChat: boolean = false): Promise<TUserThreads[]> {
    return this.get(`/api/v1/chat/get-favorite-chats/`, {
      params: {
        ...(workspaceId && { workspace_id: workspaceId }),
        is_project_chat: isProjectChat,
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
        throw (
          error?.response?.data ?? {
            error: error?.message ?? "Unable to execute action",
          }
        );
      });
  }

  // get artifact
  async listArtifacts(chatId: string): Promise<TArtifact[]> {
    return this.get(`/api/v1/artifacts/chat/${chatId}/`)
      .then((response) => response.data.artifacts)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // follow up
  async followUp(
    query: string,
    workspace_id: string,
    chat_id: string,
    artifact_id: string,
    current_artifact_data: TUpdatedArtifact,
    user_message_id: string,
    entity_type: string,
    project_id: string | undefined
  ): Promise<TFollowUpResponse> {
    return this.post(`/api/v1/artifacts/${artifact_id}/followup/`, {
      query,
      workspace_id,
      chat_id,
      artifact_id,
      current_artifact_data,
      user_message_id,
      entity_type,
      project_id,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // get attachments
  async listAttachments(chatId: string): Promise<TPiAttachment[]> {
    return this.get(`/api/v1/attachments/chat/`, {
      params: {
        chat_id: chatId,
      },
    })
      .then((response) => response.data.attachments)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // upload attachments
  async uploadAttachment(
    file: File,
    workspaceId: string,
    chatId: string,
    uploadProgressHandler: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TPiAttachment | void> {
    // Create FormData to send file directly to backend
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", workspaceId);
    formData.append("chat_id", chatId);
    formData.append("filename", file.name);
    formData.append("file_size", file.size.toString());

    // Upload file directly to backend (backend will scan and upload to S3)
    const response = await this.post(`/api/v1/attachments/upload-attachment/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: uploadProgressHandler,
    })
      .then((response) => response?.data)
      .catch((error) => {
        // Handle security-related errors with better messages
        const errorData = error?.response?.data;
        const errorMessage = errorData?.detail || errorData?.message || "Upload failed";

        throw {
          detail: errorMessage,
          message: errorMessage,
          isSecurityError:
            errorMessage.includes("Malware") ||
            errorMessage.includes("rejected") ||
            errorMessage.includes("dangerous") ||
            errorMessage.includes("mismatch"),
          status: error?.response?.status,
        };
      });
    return response;
  }

  // convert to page
  async convertToPage(data: {
    chat_id: string;
    name?: string;
    description_html: string;
    workspace_slug: string;
    page_type: string;
    project_id: string | undefined;
  }): Promise<{
    page_url: string;
  }> {
    return this.post(`/api/v1/chat-ctas/save-as-page/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  fetchPageSummary(pageId: string): Promise<{ summary: string; generated_at: string }> {
    return this.get(`/api/v1/pages/${pageId}/summary/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // generate page summary (SSE stream)
  // Returns an abort function to cancel the stream.
  generatePageSummary(
    data: {
      page_id: string;
      entity_type: string;
      workspace_id: string;
    },
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete?: () => void;
      onError?: (error: { code: string; message: string }) => void;
    }
  ): () => void {
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    const run = async () => {
      const response = await this.post(`/api/v1/pages/summarize/`, data, {
        responseType: "stream",
        adapter: "fetch",
        signal: controller.signal,
      });

      const stream = response.data as ReadableStream<Uint8Array>;

      if (!stream) {
        callbacks.onError?.({ code: "NO_BODY", message: "Response body is empty" });
        return;
      }

      reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";

        for (const message of messages) {
          if (message.startsWith(":")) continue;

          let eventData = "";

          for (const line of message.split("\n")) {
            if (line.startsWith("data: ")) eventData += line.slice(6);
          }

          if (!eventData || eventData === "[DONE]") continue;

          try {
            const parsed = JSON.parse(eventData) as { chunk?: string };
            if (parsed.chunk) callbacks.onChunk(parsed.chunk);
          } catch {
            // If not JSON, treat as plain text chunk
            callbacks.onChunk(eventData);
          }
        }
      }

      callbacks.onComplete?.();
    };

    run().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      callbacks.onError?.({
        code: "CONNECTION_ERROR",
        message: err instanceof Error ? err.message : "Failed to generate page summary",
      });
    });

    return () => {
      void reader?.cancel();
      controller.abort();
    };
  }
}
