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

import type { AxiosError, AxiosInstance } from "axios";
import axios from "axios";
import { logger } from "@plane/logger";
import type {
  CursorLaunchParams,
  CursorAgentResponse,
  CursorFollowUpParams,
  CursorFollowUpResponse,
  CursorConversationResponse,
  CursorMeResponse,
  CursorRepositoriesResponse,
} from "./types";

const CURSOR_API_BASE_URL = "https://api.cursor.com";

/**
 * HTTP client for the Cursor Cloud Agent API.
 * Auth: Basic auth with API key as username, empty password.
 */
export class CursorApiClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    const basicAuth = Buffer.from(`${apiKey}:`).toString("base64");
    this.client = axios.create({
      baseURL: CURSOR_API_BASE_URL,
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          logger.error("[CursorApiClient] API error", {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
          });
        }
        throw error;
      }
    );
  }

  /**
   * Launch a new Cursor Cloud Agent session.
   * POST /v0/agents
   */
  async launchAgent(params: CursorLaunchParams): Promise<CursorAgentResponse> {
    try {
      const response = await this.client.post<CursorAgentResponse>("/v0/agents", params);
      return response.data;
    } catch (error) {
      logger.error("[CursorApiClient] Failed to launch agent", { error });
      throw error;
    }
  }

  /**
   * Send a follow-up message to an existing Cursor agent session.
   * POST /v0/agents/{id}/followup
   */
  async addFollowUp(agentId: string, params: CursorFollowUpParams): Promise<CursorFollowUpResponse> {
    try {
      const response = await this.client.post<CursorFollowUpResponse>(`/v0/agents/${agentId}/followup`, params);
      return response.data;
    } catch (error) {
      logger.error("[CursorApiClient] Failed to send follow-up", { error, agentId });
      throw error;
    }
  }

  /**
   * Get an agent's current status and details.
   * GET /v0/agents/{id}
   */
  async getAgent(agentId: string): Promise<CursorAgentResponse> {
    try {
      const response = await this.client.get<CursorAgentResponse>(`/v0/agents/${agentId}`);
      return response.data;
    } catch (error) {
      logger.error("[CursorApiClient] Failed to get agent", { error, agentId });
      throw error;
    }
  }

  /**
   * Get an agent's conversation messages.
   * GET /v0/agents/{id}/conversation
   */
  async getConversation(agentId: string): Promise<CursorConversationResponse> {
    try {
      const response = await this.client.get<CursorConversationResponse>(`/v0/agents/${agentId}/conversation`);
      return response.data;
    } catch (error) {
      logger.error("[CursorApiClient] Failed to get conversation", { error, agentId });
      throw error;
    }
  }

  /**
   * List repositories available in the Cursor account.
   * GET /v0/repositories
   */
  async listRepositories(): Promise<CursorRepositoriesResponse> {
    try {
      const response = await this.client.get<CursorRepositoriesResponse>("/v0/repositories");
      return response.data;
    } catch (error) {
      logger.error("[CursorApiClient] Failed to list repositories", { error });
      throw error;
    }
  }

  /**
   * Verify the API key by calling GET /v0/me.
   */
  async verifyMe(): Promise<CursorMeResponse> {
    try {
      const response = await this.client.get<CursorMeResponse>("/v0/me");
      return response.data;
    } catch (error) {
      logger.error("[CursorApiClient] Failed to verify API key", { error });
      throw error;
    }
  }
}
