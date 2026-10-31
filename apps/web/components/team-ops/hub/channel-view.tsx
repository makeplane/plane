/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { SelectField } from "@makeplane/propel/components/select-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { setToast } from "@plane/blocks/toast";
import { FILE_ACCEPT, fileLimitError } from "@plane/services";
import type { THubChannel, THubMessage, THubPerson } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store/user";
import { useHubChannel } from "@/hooks/team-ops/use-hub";
import { useOpsTeams } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { getErrorMessage } from "../calendar/error-message";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

type MessageProps = {
  message: THubMessage;
  isOwn: boolean;
  isReply?: boolean;
  onReply: (message: THubMessage) => void;
  onEdit: (message: THubMessage, body: string) => Promise<void>;
  onDelete: (message: THubMessage) => Promise<void>;
  onOpenFile: (fileId: string) => Promise<void>;
};

function Message({ message, isOwn, isReply, onReply, onEdit, onDelete, onOpenFile }: MessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  if (message.is_deleted) {
    return (
      <p className={cn("px-4 py-1 text-body-xs-regular text-tertiary italic", isReply && "ml-8")}>Message deleted</p>
    );
  }

  return (
    <article
      className={cn(
        "flex flex-col gap-1 px-4 py-2",
        isReply && "ml-8 border-l-2 border-subtle",
        message.kind === "ATTENTION" && "rounded-md bg-warning-subtle",
        message.mentions_me && message.kind !== "ATTENTION" && "bg-accent-subtle"
      )}
    >
      <header className="flex flex-wrap items-baseline gap-2">
        <span className="text-body-sm-medium text-primary">{message.author.display_name}</span>
        <time className="text-caption-sm-regular text-tertiary" dateTime={message.created_at}>
          {timeFormat.format(new Date(message.created_at))}
        </time>
        {message.edited_at ? <span className="text-caption-sm-regular text-tertiary">(edited)</span> : null}
        {message.kind === "ATTENTION" ? <Badge variant="warning" size="sm" label="Needs attention" /> : null}
      </header>
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <TextAreaField
            size="lg"
            label="Edit message"
            value={draft}
            rows={3}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              stretch="auto"
              label="Save"
              disabled={!draft.trim()}
              onClick={async () => {
                await onEdit(message, draft);
                setIsEditing(false);
              }}
            />
            <Button variant="secondary" size="sm" stretch="auto" label="Cancel" onClick={() => setIsEditing(false)} />
          </div>
        </div>
      ) : (
        <p className="text-body-sm-regular break-words whitespace-pre-wrap text-primary">{message.body}</p>
      )}
      {message.mentions.length > 0 ? (
        <p className="text-caption-sm-regular text-tertiary">
          Tagged: {message.mentions.map((person) => `@${person.display_name}`).join(", ")}
        </p>
      ) : null}
      {message.attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {message.attachments.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                className="rounded-md border border-subtle bg-surface-1 px-2.5 py-1 text-left text-body-xs-regular hover:bg-layer-1"
                onClick={() =>
                  onOpenFile(file.id).catch((error) =>
                    setToast({ type: "error", title: "Could not open the file", message: getErrorMessage(error) })
                  )
                }
              >
                <span className="text-accent-primary">{file.name}</span>{" "}
                <span className="text-tertiary">{formatSize(file.size)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <footer className="flex gap-3 text-caption-sm-regular text-tertiary">
        <button type="button" className="hover:text-primary" onClick={() => onReply(message)}>
          Reply
        </button>
        {isOwn ? (
          <>
            <button type="button" className="hover:text-primary" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button type="button" className="hover:text-danger-primary" onClick={() => onDelete(message)}>
              Delete
            </button>
          </>
        ) : null}
      </footer>
    </article>
  );
}

type Props = { workspaceSlug: string; channel: THubChannel; onRead: () => void };

export const ChannelView = observer(function ChannelView({ workspaceSlug, channel, onRead }: Props) {
  // states
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [tagged, setTagged] = useState<THubPerson[]>([]);
  const [taggedTeams, setTaggedTeams] = useState<{ id: string; name: string }[]>([]);
  const [replyTo, setReplyTo] = useState<THubMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [fileError, setFileError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  // hooks
  const { data: currentUser } = useUser();
  const { teams } = useOpsTeams(workspaceSlug);
  const hub = useHubChannel(workspaceSlug, channel.id, onRead);

  // Replies sit under their root message, one level deep.
  const threads = useMemo(() => {
    const roots = (hub.messages ?? []).filter((message) => !message.parent);
    const replies = (hub.messages ?? []).filter((message) => message.parent);
    return roots.map((root) => ({ root, replies: replies.filter((reply) => reply.parent === root.id) }));
  }, [hub.messages]);

  const lastId = hub.messages?.[hub.messages.length - 1]?.id;
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: "end" });
  }, [lastId, channel.id]);

  const people = (hub.channel?.members ?? []).filter((person) => person.id !== currentUser?.id);
  const personOptions = people
    .filter((person) => !tagged.some((item) => item.id === person.id))
    .map((person) => ({ value: person.id, label: person.display_name }));
  const teamOptions = (teams ?? [])
    .filter((team) => !taggedTeams.some((item) => item.id === team.id))
    .map((team) => ({ value: team.id, label: team.name }));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    const problem = fileLimitError(next);
    if (problem) return setFileError(problem);
    setFileError("");
    setFiles(next);
    if (input.current) input.current.value = "";
  };

  const send = async () => {
    if (!body.trim() && files.length === 0) return;
    setIsSending(true);
    try {
      await hub.send({
        body,
        parent: replyTo?.id ?? null,
        users: tagged.map((person) => person.id),
        teams: taggedTeams.map((team) => team.id),
        files,
      });
      setBody("");
      setFiles([]);
      setTagged([]);
      setTaggedTeams([]);
      setReplyTo(null);
    } catch (error) {
      setToast({ type: "error", title: "Could not send", message: getErrorMessage(error) });
    } finally {
      setIsSending(false);
    }
  };

  const guard = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      setToast({ type: "error", title: "Something went wrong", message: getErrorMessage(error) });
    }
  };

  const shared = {
    onReply: setReplyTo,
    onEdit: (message: THubMessage, text: string) => guard(() => hub.edit(message.id, text)),
    onDelete: (message: THubMessage) => guard(() => hub.remove(message.id)),
    onOpenFile: hub.openFile,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-subtle px-4 py-3">
        <h2 className="text-body-md-medium text-primary">
          {channel.kind === "TEAM" ? "Team" : "Project"} · {channel.name}
        </h2>
        <p className="text-caption-sm-regular text-tertiary">
          {hub.channel ? `${hub.channel.members.length} people can read this channel` : "Loading..."}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-2" aria-live="polite">
        {hub.isLoading ? <p className="px-4 py-2 text-body-sm-regular text-tertiary">Loading messages...</p> : null}
        {!hub.isLoading && threads.length === 0 ? (
          <p className="px-4 py-6 text-center text-body-sm-regular text-tertiary">
            No messages yet. Say hello, tag a colleague or share a file.
          </p>
        ) : null}
        {threads.map(({ root, replies }) => (
          <div key={root.id}>
            <Message message={root} isOwn={root.author.id === currentUser?.id} {...shared} />
            {replies.map((reply) => (
              <Message key={reply.id} message={reply} isReply isOwn={reply.author.id === currentUser?.id} {...shared} />
            ))}
          </div>
        ))}
        <div ref={bottom} />
      </div>

      <footer className="flex flex-col gap-2 border-t border-subtle p-3">
        {replyTo ? (
          <p className="flex items-center justify-between gap-2 rounded-md bg-layer-1 px-3 py-1.5 text-body-xs-regular text-secondary">
            <span className="truncate">Replying to {replyTo.author.display_name}</span>
            <button type="button" className="text-accent-primary hover:underline" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </p>
        ) : null}
        <TextAreaField
          size="lg"
          label="Message"
          value={body}
          rows={2}
          maxLength={5000}
          placeholder="Write a message. Use the lists below to tag people or a whole team."
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-44 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="Tag a person"
              options={personOptions}
              value={undefined}
              onValueChange={(value) => {
                const person = people.find((item) => item.id === value);
                if (person) setTagged((current) => [...current, person]);
              }}
            />
          </div>
          <div className="w-44 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="Tag a team"
              options={teamOptions}
              value={undefined}
              onValueChange={(value) => {
                const team = (teams ?? []).find((item) => item.id === value);
                if (team) setTaggedTeams((current) => [...current, { id: team.id, name: team.name }]);
              }}
            />
          </div>
          <input
            ref={input}
            id="hub-files"
            type="file"
            multiple
            accept={FILE_ACCEPT}
            className="sr-only"
            onChange={(event) => addFiles(event.target.files)}
          />
          <label
            htmlFor="hub-files"
            className="cursor-pointer rounded-md border border-subtle px-3 py-2 text-body-xs-medium text-secondary hover:bg-layer-1"
          >
            Attach files
          </label>
          <div className="ml-auto">
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              label="Send"
              loading={isSending}
              disabled={!body.trim() && files.length === 0}
              onClick={send}
            />
          </div>
        </div>
        {tagged.length > 0 || taggedTeams.length > 0 || files.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {tagged.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-caption-sm-regular text-accent-primary"
                  onClick={() => setTagged((current) => current.filter((item) => item.id !== person.id))}
                  aria-label={`Remove tag ${person.display_name}`}
                >
                  @{person.display_name} ×
                </button>
              </li>
            ))}
            {taggedTeams.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-caption-sm-regular text-accent-primary"
                  onClick={() => setTaggedTeams((current) => current.filter((item) => item.id !== team.id))}
                  aria-label={`Remove tag ${team.name}`}
                >
                  @{team.name} (team) ×
                </button>
              </li>
            ))}
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <button
                  type="button"
                  className="rounded-full bg-layer-1 px-2.5 py-0.5 text-caption-sm-regular text-secondary"
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  aria-label={`Remove file ${file.name}`}
                >
                  {file.name} ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {fileError ? (
          <p role="alert" className="text-body-xs-regular text-danger-primary">
            {fileError}
          </p>
        ) : null}
        <p className="text-caption-sm-regular text-tertiary">
          Ctrl+Enter sends. Files are stored privately and open through a link that works for 5 minutes.
        </p>
      </footer>
    </div>
  );
});
