/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { HubService } from "@plane/services";
import type { THubMessagePayload } from "@plane/types";

const hubService = new HubService();

// New messages from others appear within this time without a reload.
const POLL_MS = 8000;

/** The channels the caller belongs to, with unread counts. */
export const useHubChannels = (workspaceSlug: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    `TEAM_OPS_HUB_CHANNELS_${workspaceSlug}`,
    () => hubService.listChannels(workspaceSlug),
    { refreshInterval: POLL_MS }
  );
  return { channels: data?.results, unreadMentions: data?.unread_mentions ?? 0, error, isLoading, refresh: mutate };
};

/** One open channel: its members (for tagging), its messages and the actions on them. */
export const useHubChannel = (workspaceSlug: string, channelId: string | null, onRead: () => void) => {
  const { data: channel } = useSWR(channelId && `TEAM_OPS_HUB_CHANNEL_${channelId}`, () =>
    hubService.getChannel(workspaceSlug, channelId!)
  );
  const {
    data: messages,
    error,
    isLoading,
    mutate,
  } = useSWR(
    channelId && `TEAM_OPS_HUB_MESSAGES_${channelId}`,
    async () => {
      const page = await hubService.listMessages(workspaceSlug, channelId!);
      // Fetching the first page marks the channel read on the server.
      onRead();
      return page;
    },
    { refreshInterval: POLL_MS }
  );

  const send = useCallback(
    async (payload: THubMessagePayload) => {
      const message = await hubService.postMessage(workspaceSlug, channelId!, payload);
      await mutate();
      return message;
    },
    [workspaceSlug, channelId, mutate]
  );

  const edit = useCallback(
    async (messageId: string, body: string) => {
      await hubService.editMessage(workspaceSlug, messageId, body);
      await mutate();
    },
    [workspaceSlug, mutate]
  );

  const remove = useCallback(
    async (messageId: string) => {
      await hubService.deleteMessage(workspaceSlug, messageId);
      await mutate();
    },
    [workspaceSlug, mutate]
  );

  /** Asks for a fresh signed link and opens it; links expire after a few minutes, so none is kept. */
  const openFile = useCallback(
    async (fileId: string) => {
      const { url } = await hubService.getFileLink(workspaceSlug, fileId);
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [workspaceSlug]
  );

  return {
    channel,
    messages: messages?.results,
    hasMore: messages?.has_more ?? false,
    error,
    isLoading,
    send,
    edit,
    remove,
    openFile,
  };
};

/** Where the caller was tagged. */
export const useHubMentions = (workspaceSlug: string, enabled: boolean) => {
  const { data, mutate } = useSWR(
    enabled ? `TEAM_OPS_HUB_MENTIONS_${workspaceSlug}` : null,
    () => hubService.listMentions(workspaceSlug),
    { refreshInterval: POLL_MS }
  );
  const markAllRead = useCallback(async () => {
    await hubService.markMentionsRead(workspaceSlug);
    await mutate();
  }, [workspaceSlug, mutate]);
  return { mentions: data, markAllRead };
};

export { hubService };
