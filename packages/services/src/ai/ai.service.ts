// plane web constants
import type { AI_EDITOR_TASKS } from "@plane/constants";
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "../api.service";

/**
 * Payload type for AI editor tasks
 * @typedef {Object} TTaskPayload
 * @property {number} [casual_score] - Optional score for casual tone analysis
 * @property {number} [formal_score] - Optional score for formal tone analysis
 * @property {AI_EDITOR_TASKS} task - Type of AI editor task to perform
 * @property {string} text_input - The input text to be processed
 */
export type TTaskPayload = {
  casual_score?: number;
  formal_score?: number;
  task: AI_EDITOR_TASKS;
  text_input: string;
};

/**
 * Service class for handling AI-related API operations
 * Extends the base APIService class to interact with AI endpoints
 * @extends {APIService}
 */
export class AIService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Creates a GPT-based task for a specific workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {Object} data - The data payload for the GPT task
   * @param {string} data.prompt - The prompt text for the GPT model
   * @param {string} data.task - The type of task to be performed
   * @returns {Promise<any>} The response data from the GPT task
   * @throws {Error} Throws the response error if the request fails
   */
  async prompt(workspaceSlug: string, data: { prompt: string; task: string }): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/ai-assistant/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Performs an editor-specific AI task for text processing
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {TTaskPayload} data - The task payload containing text and processing parameters
   * @returns {Promise<{response: string}>} The processed text response
   * @throws {Error} Throws the response data if the request fails
   */
  async rephraseGrammar(
    workspaceSlug: string,
    data: TTaskPayload
  ): Promise<{
    response: string;
  }> {
    return this.post(`/api/workspaces/${workspaceSlug}/rephrase-grammar/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
