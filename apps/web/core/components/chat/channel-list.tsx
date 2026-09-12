/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Hash, Plus, Trash2 } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TChatScope } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useChat } from "@/hooks/store/use-chat";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// local imports
import { ChatCreateChannelModal } from "./create-channel-modal";

type Props = {
  scope: TChatScope;
};

export const ChatChannelList = observer(function ChatChannelList(props: Props) {
  const { scope } = props;
  // states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { channels, getChannelIds, getActiveChannelId, setActiveChannel, deleteChannel } = useChat();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const channelIds = getChannelIds(scope);
  const activeChannelId = getActiveChannelId(scope);
  const permissionLevel = scope.projectId ? EUserPermissionsLevel.PROJECT : EUserPermissionsLevel.WORKSPACE;
  const canCreate = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    permissionLevel,
    scope.workspaceSlug,
    scope.projectId
  );
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], permissionLevel, scope.workspaceSlug, scope.projectId);

  const handleDelete = async () => {
    if (!channelToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChannel(scope, channelToDelete);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Channel deleted." });
    } catch (error: unknown) {
      const message = (error as { error?: string } | undefined)?.error;
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: message ?? "Channel could not be deleted." });
    } finally {
      setIsDeleting(false);
      setChannelToDelete(null);
    }
  };

  return (
    <>
      <ChatCreateChannelModal scope={scope} isOpen={isCreateOpen} handleClose={() => setIsCreateOpen(false)} />
      <AlertModalCore
        isOpen={!!channelToDelete}
        handleClose={() => setChannelToDelete(null)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        title="Delete channel"
        content="All messages in this channel will be removed for everyone. This cannot be undone."
      />
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-subtle bg-surface-1">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-11 font-semibold tracking-wide text-tertiary uppercase">Channels</span>
          {canCreate && (
            <button
              type="button"
              className="grid size-6 place-items-center rounded text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
              onClick={() => setIsCreateOpen(true)}
              aria-label="Create channel"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {channelIds.map((channelId) => {
            const channel = channels[channelId];
            if (!channel) return null;
            const isActive = channelId === activeChannelId;
            const canDelete = !channel.is_default && (isAdmin || channel.created_by === currentUser?.id);
            return (
              <div
                key={channelId}
                className={cn(
                  "group flex items-center gap-1 rounded px-2 py-1.5 text-13",
                  isActive ? "bg-layer-1 text-primary" : "text-secondary hover:bg-layer-transparent-hover"
                )}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  onClick={() => setActiveChannel(scope, channelId)}
                >
                  <Hash className="size-3.5 flex-shrink-0 text-tertiary" />
                  <span className="truncate">{channel.name}</span>
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="hidden flex-shrink-0 text-tertiary group-hover:block hover:text-danger-primary"
                    onClick={() => setChannelToDelete(channelId)}
                    aria-label={`Delete #${channel.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
});
