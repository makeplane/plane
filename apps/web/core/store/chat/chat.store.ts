/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, unset } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { TChatChannel, TChatMessage, TChatScope, TLoader } from "@plane/types";
import { ChatService } from "@/services/chat.service";

/** One key per place a chat can live, so workspace and project rooms never mix. */
export const getChatScopeKey = (scope: TChatScope) =>
  scope.projectId ? `${scope.workspaceSlug}:${scope.projectId}` : scope.workspaceSlug;

export interface IChatStore {
  // observables
  channelLoader: Record<string, TLoader>; // scopeKey -> loader
  messageLoader: Record<string, TLoader>; // channelId -> loader
  channelIdsByScope: Record<string, string[]>; // scopeKey -> channelIds
  channels: Record<string, TChatChannel>; // channelId -> channel
  messageIdsByChannel: Record<string, string[]>; // channelId -> messageIds, oldest first
  messages: Record<string, TChatMessage>; // messageId -> message
  hasOlderByChannel: Record<string, boolean>; // channelId -> more history exists
  activeChannelIdByScope: Record<string, string>; // scopeKey -> channelId
  // computed
  getChannelIds: (scope: TChatScope) => string[];
  getActiveChannelId: (scope: TChatScope) => string | undefined;
  getMessageIds: (channelId: string) => string[];
  // actions
  setActiveChannel: (scope: TChatScope, channelId: string) => void;
  fetchChannels: (scope: TChatScope) => Promise<void>;
  createChannel: (scope: TChatScope, payload: Pick<TChatChannel, "name" | "description">) => Promise<TChatChannel>;
  deleteChannel: (scope: TChatScope, channelId: string) => Promise<void>;
  fetchMessages: (scope: TChatScope, channelId: string) => Promise<void>;
  fetchOlderMessages: (scope: TChatScope, channelId: string) => Promise<void>;
  fetchNewMessages: (scope: TChatScope, channelId: string) => Promise<number>;
  sendMessage: (scope: TChatScope, channelId: string, content: string) => Promise<void>;
  editMessage: (scope: TChatScope, channelId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (scope: TChatScope, channelId: string, messageId: string) => Promise<void>;
}

export class ChatStore implements IChatStore {
  channelLoader: Record<string, TLoader> = {};
  messageLoader: Record<string, TLoader> = {};
  channelIdsByScope: Record<string, string[]> = {};
  channels: Record<string, TChatChannel> = {};
  messageIdsByChannel: Record<string, string[]> = {};
  messages: Record<string, TChatMessage> = {};
  hasOlderByChannel: Record<string, boolean> = {};
  activeChannelIdByScope: Record<string, string> = {};

  // services
  chatService;

  constructor() {
    makeObservable(this, {
      channelLoader: observable,
      messageLoader: observable,
      channelIdsByScope: observable,
      channels: observable,
      messageIdsByChannel: observable,
      messages: observable,
      hasOlderByChannel: observable,
      activeChannelIdByScope: observable,
      setActiveChannel: action,
      fetchChannels: action,
      createChannel: action,
      deleteChannel: action,
      fetchMessages: action,
      fetchOlderMessages: action,
      fetchNewMessages: action,
      sendMessage: action,
      editMessage: action,
      deleteMessage: action,
    });
    this.chatService = new ChatService();
  }

  getChannelIds = computedFn((scope: TChatScope) => this.channelIdsByScope[getChatScopeKey(scope)] ?? []);

  getActiveChannelId = computedFn((scope: TChatScope) => {
    const key = getChatScopeKey(scope);
    const active = this.activeChannelIdByScope[key];
    if (active && this.channels[active]) return active;
    return this.channelIdsByScope[key]?.[0];
  });

  getMessageIds = computedFn((channelId: string) => this.messageIdsByChannel[channelId] ?? []);

  setActiveChannel = (scope: TChatScope, channelId: string) => {
    set(this.activeChannelIdByScope, [getChatScopeKey(scope)], channelId);
  };

  /** Insert messages keeping the per-channel list sorted by creation time and free of duplicates. */
  private mergeMessages(channelId: string, incoming: TChatMessage[]) {
    const existing = this.messageIdsByChannel[channelId] ?? [];
    const known = new Set(existing);
    incoming.forEach((message) => {
      set(this.messages, [message.id], message);
      known.add(message.id);
    });
    // oxlint-disable-next-line unicorn/no-array-sort -- sorting a fresh copy, nothing observable is mutated
    const sorted = Array.from(known).sort((a, b) => {
      const left = this.messages[a]?.created_at ?? "";
      const right = this.messages[b]?.created_at ?? "";
      return left < right ? -1 : left > right ? 1 : 0;
    });
    set(this.messageIdsByChannel, [channelId], sorted);
  }

  fetchChannels = async (scope: TChatScope) => {
    const key = getChatScopeKey(scope);
    if (!this.channelIdsByScope[key]) set(this.channelLoader, [key], "init-loader");
    try {
      const channels = await this.chatService.getChannels(scope);
      runInAction(() => {
        channels.forEach((channel) => set(this.channels, [channel.id], channel));
        set(
          this.channelIdsByScope,
          [key],
          channels.map((channel) => channel.id)
        );
        set(this.channelLoader, [key], "loaded");
      });
    } catch (error) {
      runInAction(() => set(this.channelLoader, [key], "loaded"));
      throw error;
    }
  };

  createChannel = async (scope: TChatScope, payload: Pick<TChatChannel, "name" | "description">) => {
    const key = getChatScopeKey(scope);
    const channel = await this.chatService.createChannel(scope, payload);
    runInAction(() => {
      set(this.channels, [channel.id], channel);
      set(this.channelIdsByScope, [key], [...(this.channelIdsByScope[key] ?? []), channel.id]);
      set(this.activeChannelIdByScope, [key], channel.id);
    });
    return channel;
  };

  deleteChannel = async (scope: TChatScope, channelId: string) => {
    const key = getChatScopeKey(scope);
    await this.chatService.deleteChannel(scope, channelId);
    runInAction(() => {
      set(
        this.channelIdsByScope,
        [key],
        (this.channelIdsByScope[key] ?? []).filter((id) => id !== channelId)
      );
      unset(this.channels, [channelId]);
      (this.messageIdsByChannel[channelId] ?? []).forEach((id) => unset(this.messages, [id]));
      unset(this.messageIdsByChannel, [channelId]);
      if (this.activeChannelIdByScope[key] === channelId) unset(this.activeChannelIdByScope, [key]);
    });
  };

  fetchMessages = async (scope: TChatScope, channelId: string) => {
    if (!this.messageIdsByChannel[channelId]) set(this.messageLoader, [channelId], "init-loader");
    try {
      const page = await this.chatService.getMessages(scope, channelId);
      runInAction(() => {
        this.mergeMessages(channelId, page.results);
        set(this.hasOlderByChannel, [channelId], page.has_more);
        set(this.messageLoader, [channelId], "loaded");
      });
    } catch (error) {
      runInAction(() => set(this.messageLoader, [channelId], "loaded"));
      throw error;
    }
  };

  fetchOlderMessages = async (scope: TChatScope, channelId: string) => {
    const oldestId = this.messageIdsByChannel[channelId]?.[0];
    const oldest = oldestId ? this.messages[oldestId] : undefined;
    if (!oldest) return this.fetchMessages(scope, channelId);
    set(this.messageLoader, [channelId], "pagination");
    try {
      const page = await this.chatService.getMessages(scope, channelId, { before: oldest.created_at });
      runInAction(() => {
        this.mergeMessages(channelId, page.results);
        set(this.hasOlderByChannel, [channelId], page.has_more);
        set(this.messageLoader, [channelId], "loaded");
      });
    } catch (error) {
      runInAction(() => set(this.messageLoader, [channelId], "loaded"));
      throw error;
    }
  };

  /** Pull anything newer than the last message we hold. Returns how many arrived. */
  fetchNewMessages = async (scope: TChatScope, channelId: string) => {
    const ids = this.messageIdsByChannel[channelId];
    const newestId = ids?.[ids.length - 1];
    const newest = newestId ? this.messages[newestId] : undefined;
    if (!newest) {
      await this.fetchMessages(scope, channelId);
      return 0;
    }
    const page = await this.chatService.getMessages(scope, channelId, { after: newest.created_at });
    runInAction(() => this.mergeMessages(channelId, page.results));
    return page.results.length;
  };

  sendMessage = async (scope: TChatScope, channelId: string, content: string) => {
    const message = await this.chatService.sendMessage(scope, channelId, content);
    runInAction(() => this.mergeMessages(channelId, [message]));
  };

  editMessage = async (scope: TChatScope, channelId: string, messageId: string, content: string) => {
    const message = await this.chatService.editMessage(scope, channelId, messageId, content);
    runInAction(() => set(this.messages, [messageId], message));
  };

  deleteMessage = async (scope: TChatScope, channelId: string, messageId: string) => {
    await this.chatService.deleteMessage(scope, channelId, messageId);
    runInAction(() => {
      set(
        this.messageIdsByChannel,
        [channelId],
        (this.messageIdsByChannel[channelId] ?? []).filter((id) => id !== messageId)
      );
      unset(this.messages, [messageId]);
    });
  };
}
