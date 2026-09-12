/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// helpers
import { API_BASE_URL } from "@plane/constants";
import type { TChatChannel, TChatMessage, TChatMessagePage, TChatScope } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

const scopeUrl = (scope: TChatScope) =>
  scope.projectId
    ? `/api/workspaces/${scope.workspaceSlug}/projects/${scope.projectId}/chat`
    : `/api/workspaces/${scope.workspaceSlug}/chat`;

export class ChatService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getChannels(scope: TChatScope): Promise<TChatChannel[]> {
    return this.get(`${scopeUrl(scope)}/channels/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createChannel(scope: TChatScope, payload: Pick<TChatChannel, "name" | "description">): Promise<TChatChannel> {
    return this.post(`${scopeUrl(scope)}/channels/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateChannel(
    scope: TChatScope,
    channelId: string,
    payload: Partial<Pick<TChatChannel, "name" | "description">>
  ): Promise<TChatChannel> {
    return this.patch(`${scopeUrl(scope)}/channels/${channelId}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteChannel(scope: TChatScope, channelId: string): Promise<void> {
    return this.delete(`${scopeUrl(scope)}/channels/${channelId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getMessages(
    scope: TChatScope,
    channelId: string,
    params: { after?: string; before?: string; per_page?: number } = {}
  ): Promise<TChatMessagePage> {
    return this.get(`${scopeUrl(scope)}/channels/${channelId}/messages/`, { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async sendMessage(scope: TChatScope, channelId: string, content: string): Promise<TChatMessage> {
    return this.post(`${scopeUrl(scope)}/channels/${channelId}/messages/`, { content })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async editMessage(scope: TChatScope, channelId: string, messageId: string, content: string): Promise<TChatMessage> {
    return this.patch(`${scopeUrl(scope)}/channels/${channelId}/messages/${messageId}/`, { content })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteMessage(scope: TChatScope, channelId: string, messageId: string): Promise<void> {
    return this.delete(`${scopeUrl(scope)}/channels/${channelId}/messages/${messageId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
