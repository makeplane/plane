/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import { setToast } from "@plane/blocks/toast";
import type { THubMessage, THubOverviewChannel } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { controlService, useHubOverview } from "@/hooks/team-ops/use-control";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = { workspaceSlug: string };

const KIND: Record<THubOverviewChannel["kind"], string> = {
  NEWS: "News",
  GENERAL: "General",
  TEAM: "Team",
  PROJECT: "Project",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 * 1024
    ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
    : bytes >= 1024 * 1024
      ? `${(bytes / 1024 ** 2).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;

const Tile = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="flex min-w-36 flex-1 flex-col rounded-lg border border-subtle bg-surface-1 px-4 py-3">
    <span className="text-caption-sm-regular text-tertiary">{label}</span>
    <span className="text-h4-medium text-primary tabular-nums">{value}</span>
    {note ? <span className="text-caption-sm-regular text-tertiary">{note}</span> : null}
  </div>
);

/** The Hub from above: how busy each channel is, who can write, and a way to remove a message. Private content stays private. */
export const HubControl = observer(function HubControl({ workspaceSlug }: Props) {
  const { overview, refresh } = useHubOverview(workspaceSlug, true);
  const [reviewing, setReviewing] = useState<THubOverviewChannel | null>(null);
  const [messages, setMessages] = useState<THubMessage[]>([]);

  const guard = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      setToast({ type: "error", title: "Something went wrong", message: getErrorMessage(error) });
    }
  };

  const review = (channel: THubOverviewChannel) =>
    guard(async () => {
      setMessages(await controlService.listChannelMessages(workspaceSlug, channel.id));
      setReviewing(channel);
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Tile label="Channels" value={String(overview?.channels.length ?? 0)} />
        <Tile label="Documents" value={String(overview?.docs ?? 0)} />
        <Tile label="Files" value={String(overview?.files ?? 0)} note={formatSize(overview?.file_bytes ?? 0)} />
        <Tile
          label="Private conversations"
          value={String(overview?.private_conversations ?? 0)}
          note="content is not visible"
        />
        <Tile
          label="Secrets"
          value={String(overview?.secrets ?? 0)}
          note={`${overview?.secret_publishers ?? 0} publisher(s); values are not visible`}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-subtle bg-surface-1">
        <table className="w-full min-w-160 text-left text-body-sm-regular">
          <thead className="border-b border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
            <tr>
              {["Channel", "Type", "People", "Messages", "Last 24 h", "Last message", "Who can write", ""].map(
                (label) => (
                  <th key={label} scope="col" className="px-3 py-2 font-medium">
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {(overview?.channels ?? []).map((channel) => (
              <tr key={channel.id} className={cn(reviewing?.id === channel.id && "bg-accent-subtle")}>
                <td className="px-3 py-2 font-medium text-primary"># {channel.name}</td>
                <td className="px-3 py-2 text-secondary">{KIND[channel.kind]}</td>
                <td className="px-3 py-2 tabular-nums">{channel.members}</td>
                <td className="px-3 py-2 tabular-nums">{channel.messages}</td>
                <td className="px-3 py-2 tabular-nums">{channel.today}</td>
                <td className="px-3 py-2 text-secondary">
                  {channel.last_at ? dateFormat.format(new Date(channel.last_at)) : "—"}
                </td>
                <td className="px-3 py-2">
                  {channel.kind === "NEWS" ? (
                    <Badge variant="neutral" size="sm" label="Admins only" />
                  ) : (
                    <button
                      type="button"
                      className="text-body-xs-medium text-accent-primary hover:underline"
                      aria-pressed={channel.is_locked}
                      onClick={() =>
                        void guard(async () => {
                          await controlService.setChannelLocked(workspaceSlug, channel.id, !channel.is_locked);
                          await refresh();
                        })
                      }
                    >
                      {channel.is_locked ? "Admins only (unlock)" : "Everyone (lock)"}
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-body-xs-medium text-accent-primary hover:underline"
                    onClick={() => void review(channel)}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewing ? (
        <section
          aria-label="Review messages"
          className="flex flex-col gap-2 rounded-lg border border-accent-strong bg-surface-1 p-4"
        >
          <header className="flex items-center justify-between gap-2">
            <h3 className="text-body-md-medium text-primary"># {reviewing.name}: latest messages</h3>
            <button
              type="button"
              className="text-body-xs-medium text-accent-primary hover:underline"
              onClick={() => setReviewing(null)}
            >
              Close
            </button>
          </header>
          {messages.length === 0 ? <p className="text-body-sm-regular text-tertiary">No messages.</p> : null}
          <ul className="flex max-h-96 flex-col divide-y divide-subtle overflow-y-auto">
            {messages.map((message) => (
              <li key={message.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-body-xs-medium text-primary">
                    {message.author.display_name}{" "}
                    <span className="font-normal text-tertiary">{dateFormat.format(new Date(message.created_at))}</span>
                  </p>
                  <p className="text-body-sm-regular break-words whitespace-pre-wrap text-secondary">
                    {message.is_deleted ? "Removed" : message.body}
                  </p>
                </div>
                {!message.is_deleted ? (
                  <button
                    type="button"
                    className="shrink-0 text-body-xs-regular text-tertiary hover:text-danger-primary"
                    onClick={() =>
                      void guard(async () => {
                        await controlService.removeMessage(workspaceSlug, message.id);
                        setMessages(await controlService.listChannelMessages(workspaceSlug, reviewing.id));
                        await refresh();
                      })
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-caption-sm-regular text-tertiary">
        Admins cannot read private messages or secret values here, by design. Removing a message keeps its place in the
        thread but deletes its text.
      </p>
    </div>
  );
});
