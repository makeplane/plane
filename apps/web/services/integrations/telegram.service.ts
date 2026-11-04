/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TelegramIntegration = { id: string; bot_username: string };
export type TelegramProjectChat = {
  id: string;
  project_id: string;
  chat_id: number;
  topic_id: number;
  chat_title: string;
};
export type TelegramLinkStatus = {
  available: boolean;
  bot_username: string | null;
  linked: boolean;
  telegram_user_id: number | null;
};

export class TelegramIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getIntegration(slug: string): Promise<TelegramIntegration | null> {
    return (await this.get(`/api/workspaces/${slug}/telegram/`)).data;
  }

  async connect(slug: string, botToken: string): Promise<TelegramIntegration> {
    return (await this.post(`/api/workspaces/${slug}/telegram/`, { bot_token: botToken })).data;
  }

  async disconnect(slug: string): Promise<void> {
    await this.delete(`/api/workspaces/${slug}/telegram/`);
  }

  async getChats(slug: string): Promise<TelegramProjectChat[]> {
    return (await this.get(`/api/workspaces/${slug}/telegram/chats/`)).data;
  }

  async addChat(slug: string, projectId: string, chatId: string, topicId: string): Promise<void> {
    await this.post(`/api/workspaces/${slug}/telegram/chats/`, {
      project_id: projectId,
      chat_id: chatId,
      topic_id: topicId || 0,
    });
  }

  async removeChat(slug: string, chatId: string): Promise<void> {
    await this.delete(`/api/workspaces/${slug}/telegram/chats/${chatId}/`);
  }

  async createLink(slug: string): Promise<string> {
    return (await this.post(`/api/workspaces/${slug}/telegram/link/`)).data.link_url;
  }

  async getLinkStatus(slug: string): Promise<TelegramLinkStatus> {
    return (await this.get(`/api/workspaces/${slug}/telegram/link/`)).data;
  }

  async unlink(slug: string): Promise<void> {
    await this.delete(`/api/workspaces/${slug}/telegram/link/`);
  }
}
