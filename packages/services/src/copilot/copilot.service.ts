/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL, COPILOT_ENDPOINTS } from "@plane/constants";
import type {
  TCopilotCreateSessionPayload,
  TCopilotMemory,
  TCopilotSendMessageResponse,
  TCopilotSession,
} from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for the planning copilot.
 * Extends APIService to handle HTTP requests to the copilot endpoints.
 * @extends {APIService}
 */
export class CopilotService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Opens the session of a page or work item, creating it on first use.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The project that holds the page or work item
   * @param {TCopilotCreateSessionPayload} payload - The page or work item to attach the session to
   * @returns {Promise<TCopilotSession>} The session with its transcript
   * @throws {Error} Throws the response data if the request fails
   */
  async getOrCreateSession(
    workspaceSlug: string,
    projectId: string,
    payload: TCopilotCreateSessionPayload
  ): Promise<TCopilotSession> {
    return this.post(COPILOT_ENDPOINTS.sessions(workspaceSlug, projectId), payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Loads a session with its ordered messages, tool calls and memories.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The project that holds the page or work item
   * @param {string} sessionId - The session to load
   * @returns {Promise<TCopilotSession>} The session with its transcript
   * @throws {Error} Throws the response data if the request fails
   */
  async getSession(workspaceSlug: string, projectId: string, sessionId: string): Promise<TCopilotSession> {
    return this.get(COPILOT_ENDPOINTS.session(workspaceSlug, projectId, sessionId))
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Lists the memories of a session.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The project that holds the page or work item
   * @param {string} sessionId - The session whose memories to list
   * @returns {Promise<TCopilotMemory[]>} The memories of the session
   * @throws {Error} Throws the response data if the request fails
   */
  async listMemories(workspaceSlug: string, projectId: string, sessionId: string): Promise<TCopilotMemory[]> {
    return this.get(COPILOT_ENDPOINTS.memories(workspaceSlug, projectId, sessionId))
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates the content of a memory.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The project that holds the page or work item
   * @param {string} sessionId - The session the memory belongs to
   * @param {string} memoryId - The memory to update
   * @param {string} content - The new content
   * @returns {Promise<TCopilotMemory>} The updated memory
   * @throws {Error} Throws the response data if the request fails
   */
  async updateMemory(
    workspaceSlug: string,
    projectId: string,
    sessionId: string,
    memoryId: string,
    content: string
  ): Promise<TCopilotMemory> {
    return this.patch(COPILOT_ENDPOINTS.memory(workspaceSlug, projectId, sessionId, memoryId), { content })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a memory.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The project that holds the page or work item
   * @param {string} sessionId - The session the memory belongs to
   * @param {string} memoryId - The memory to delete
   * @returns {Promise<void>} Resolves when the memory is deleted
   * @throws {Error} Throws the response data if the request fails
   */
  async deleteMemory(workspaceSlug: string, projectId: string, sessionId: string, memoryId: string): Promise<void> {
    return this.delete(COPILOT_ENDPOINTS.memory(workspaceSlug, projectId, sessionId, memoryId))
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Sends a user message, which persists it and runs the next agent turn.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The project that holds the page or work item
   * @param {string} sessionId - The session to post to
   * @param {string} content - The message text
   * @returns {Promise<TCopilotSendMessageResponse>} The persisted messages and whether the script is finished
   * @throws {Error} Throws the response data if the request fails
   */
  async sendMessage(
    workspaceSlug: string,
    projectId: string,
    sessionId: string,
    content: string
  ): Promise<TCopilotSendMessageResponse> {
    return this.post(COPILOT_ENDPOINTS.messages(workspaceSlug, projectId, sessionId), { content })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
