/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TChatMessage, TChatScope } from "@plane/types";
import { AlertModalCore, Avatar } from "@plane/ui";
import { calculateTimeAgo, cn, getFileURL, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useChat } from "@/hooks/store/use-chat";
import { useUser } from "@/hooks/store/user";

type Props = {
  scope: TChatScope;
  channelId: string;
  message: TChatMessage;
  showHeader: boolean;
};

export const ChatMessageItem = observer(function ChatMessageItem(props: Props) {
  const { scope, channelId, message, showHeader } = props;
  // states
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // refs
  const editRef = useRef<HTMLTextAreaElement>(null);
  // store hooks
  const { editMessage, deleteMessage } = useChat();

  // focus the edit box and put the cursor at the end of the text
  useEffect(() => {
    if (!isEditing) return;
    const el = editRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing]);
  const { data: currentUser } = useUser();
  // derived values
  const sender = message.sender;
  const senderName = sender?.display_name || "Deleted user";
  const isOwn = !!sender && sender.id === currentUser?.id;
  const fullTimestamp = `${renderFormattedDate(message.created_at)} ${renderFormattedTime(message.created_at)}`;

  const startEditing = () => {
    setDraft(message.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await editMessage(scope, channelId, message.id, trimmed);
      setIsEditing(false);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Message could not be updated." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMessage(scope, channelId, message.id);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Message could not be deleted." });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") setIsEditing(false);
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSave();
    }
  };

  return (
    <>
      <AlertModalCore
        isOpen={isDeleteOpen}
        handleClose={() => setIsDeleteOpen(false)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        title="Delete message"
        content="This message will be removed for everyone in the channel."
      />
      <div
        className={cn(
          "group relative flex gap-3 rounded px-2 hover:bg-layer-transparent-hover",
          showHeader ? "mt-3 pt-1" : "py-0.5"
        )}
      >
        <div className="w-8 flex-shrink-0">
          {showHeader ? (
            <Avatar name={senderName} src={getFileURL(sender?.avatar_url ?? "")} size="base" shape="circle" />
          ) : (
            <span
              className="hidden w-8 pt-0.5 text-right text-10 text-placeholder group-hover:block"
              title={fullTimestamp}
            >
              {renderFormattedTime(message.created_at)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {showHeader && (
            <div className="flex items-baseline gap-2">
              <span className="text-13 font-semibold text-primary">{senderName}</span>
              <span className="text-11 text-tertiary" title={fullTimestamp}>
                {calculateTimeAgo(message.created_at)}
              </span>
            </div>
          )}
          {isEditing ? (
            <div className="flex flex-col gap-2 py-1">
              <textarea
                ref={editRef}
                className="focus:border-accent-primary w-full resize-none rounded border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary outline-none"
                rows={Math.min(8, Math.max(1, draft.split("\n").length))}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleEditKeyDown}
                maxLength={4000}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
                  Save
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-13 break-words whitespace-pre-wrap text-primary">
              {message.content}
              {message.edited_at && <span className="ml-1 text-10 text-placeholder">(edited)</span>}
            </p>
          )}
        </div>
        {isOwn && !isEditing && (
          <div className="shadow-sm absolute -top-2 right-2 hidden items-center gap-0.5 rounded border border-subtle bg-surface-1 p-0.5 group-hover:flex">
            <button
              type="button"
              className="grid size-6 place-items-center rounded text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
              onClick={startEditing}
              aria-label="Edit message"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              className="grid size-6 place-items-center rounded text-tertiary hover:bg-layer-transparent-hover hover:text-danger-primary"
              onClick={() => setIsDeleteOpen(true)}
              aria-label="Delete message"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
});
