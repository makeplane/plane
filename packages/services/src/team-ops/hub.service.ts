/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { THubChannelDetail, THubChannelList, THubMention, THubMessage, THubMessagePayload } from "@plane/types";
// services
import { APIService } from "../api.service";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

export const buildMessageForm = (payload: THubMessagePayload): FormData => {
  const form = new FormData();
  form.append("body", payload.body);
  if (payload.parent) form.append("parent", payload.parent);
  payload.users.forEach((user) => form.append("users", user));
  payload.teams.forEach((team) => form.append("teams", team));
  payload.files.forEach((file) => form.append("files", file));
  return form;
};

export class HubService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops/hub`;
  }

  async listChannels(workspaceSlug: string): Promise<THubChannelList> {
    return this.get(`${this.base(workspaceSlug)}/channels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** A channel with the people who can be tagged in it. */
  async getChannel(workspaceSlug: string, channelId: string): Promise<THubChannelDetail> {
    return this.get(`${this.base(workspaceSlug)}/channels/${channelId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** The newest messages, oldest first. Opening a channel marks it read; paging back with `before` does not. */
  async listMessages(
    workspaceSlug: string,
    channelId: string,
    before?: string
  ): Promise<{ results: THubMessage[]; has_more: boolean }> {
    return this.get(`${this.base(workspaceSlug)}/channels/${channelId}/messages/`, {
      params: before ? { before } : {},
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async postMessage(workspaceSlug: string, channelId: string, payload: THubMessagePayload): Promise<THubMessage> {
    return this.post(
      `${this.base(workspaceSlug)}/channels/${channelId}/messages/`,
      buildMessageForm(payload),
      MULTIPART
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async editMessage(workspaceSlug: string, messageId: string, body: string): Promise<THubMessage> {
    return this.patch(`${this.base(workspaceSlug)}/messages/${messageId}/`, { body })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteMessage(workspaceSlug: string, messageId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/messages/${messageId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** A signed link that works for a few minutes; ask again instead of keeping it. */
  async getFileLink(workspaceSlug: string, fileId: string): Promise<{ url: string; name: string }> {
    return this.get(`${this.base(workspaceSlug)}/files/${fileId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listMentions(workspaceSlug: string): Promise<THubMention[]> {
    return this.get(`${this.base(workspaceSlug)}/mentions/`)
      .then((response) => response?.data?.results)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markMentionsRead(workspaceSlug: string): Promise<void> {
    return this.post(`${this.base(workspaceSlug)}/mentions/`, {})
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
