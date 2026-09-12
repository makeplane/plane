/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TChatScope } from "@plane/types";
// hooks
import { useChat } from "@/hooks/store/use-chat";
import { getChatScopeKey } from "@/store/chat/chat.store";
// local imports
import { ChatChannelList } from "./channel-list";
import { ChatComposer } from "./composer";
import { ChatMessageList } from "./message-list";

/** How often an open channel asks the server for new messages. */
const POLL_INTERVAL_MS = 3000;

type Props = {
  scope: TChatScope;
};

export const ChatRoot = observer(function ChatRoot(props: Props) {
  const { scope } = props;
  const { workspaceSlug, projectId } = scope;
  // store hooks
  const { channels, channelLoader, fetchChannels, getActiveChannelId, fetchMessages, fetchNewMessages } = useChat();
  // derived values
  const activeChannelId = getActiveChannelId(scope);
  const activeChannel = activeChannelId ? channels[activeChannelId] : undefined;
  const isLoadingChannels = channelLoader[getChatScopeKey(scope)] === "init-loader";

  // load the channel list whenever the scope changes
  useEffect(() => {
    fetchChannels({ workspaceSlug, projectId }).catch(() =>
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Chat channels could not be loaded." })
    );
  }, [workspaceSlug, projectId, fetchChannels]);

  // load history for the open channel, then keep polling it for new messages
  useEffect(() => {
    if (!activeChannelId) return;
    const currentScope = { workspaceSlug, projectId };
    fetchMessages(currentScope, activeChannelId).catch(() =>
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Messages could not be loaded." })
    );
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      fetchNewMessages(currentScope, activeChannelId).catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [workspaceSlug, projectId, activeChannelId, fetchMessages, fetchNewMessages]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <ChatChannelList scope={scope} />
      <div className="flex min-w-0 flex-1 flex-col">
        {activeChannel ? (
          <>
            <div className="flex flex-shrink-0 items-center gap-2 border-b border-subtle px-4 py-2.5">
              <span className="text-14 font-semibold text-primary">#{activeChannel.name}</span>
              {activeChannel.description && (
                <span className="truncate text-12 text-tertiary">{activeChannel.description}</span>
              )}
            </div>
            <ChatMessageList scope={scope} channelId={activeChannel.id} />
            <ChatComposer scope={scope} channel={activeChannel} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-13 text-tertiary">
            {isLoadingChannels ? "Loading chat..." : "Pick a channel to start chatting."}
          </div>
        )}
      </div>
    </div>
  );
});
