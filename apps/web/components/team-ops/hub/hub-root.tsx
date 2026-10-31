/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import type { THubChannel } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useHubChannels, useHubMentions } from "@/hooks/team-ops/use-hub";
// local imports
import { ChannelView } from "./channel-view";

type Props = { workspaceSlug: string };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const MENTIONS = "mentions";

function ChannelGroup({
  title,
  channels,
  activeId,
  onOpen,
}: {
  title: string;
  channels: THubChannel[];
  activeId: string | null;
  onOpen: (id: string) => void;
}) {
  if (channels.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="px-3 pb-1 text-caption-sm-medium text-tertiary uppercase">{title}</h3>
      {channels.map((channel) => (
        <button
          key={channel.id}
          type="button"
          aria-current={activeId === channel.id ? "page" : undefined}
          onClick={() => onOpen(channel.id)}
          className={cn(
            "flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-body-sm-regular",
            activeId === channel.id ? "bg-layer-1 text-primary" : "text-secondary hover:bg-layer-1"
          )}
        >
          <span className="truncate"># {channel.name}</span>
          {channel.unread > 0 ? <Badge variant="brand" size="sm" label={String(channel.unread)} /> : null}
        </button>
      ))}
    </div>
  );
}

/** Where tags and attention requests land: everything the caller was tagged in, newest first. */
const MentionsView = observer(function MentionsView({
  workspaceSlug,
  onOpenChannel,
}: Props & { onOpenChannel: (id: string) => void }) {
  const { mentions, markAllRead } = useHubMentions(workspaceSlug, true);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-subtle px-4 py-3">
        <h2 className="text-body-md-medium text-primary">Mentions and attention requests</h2>
        <Button variant="secondary" size="sm" stretch="auto" label="Mark all read" onClick={() => markAllRead()} />
      </header>
      <ul className="min-h-0 flex-1 divide-y divide-subtle overflow-y-auto">
        {(mentions ?? []).length === 0 ? (
          <li className="px-4 py-6 text-center text-body-sm-regular text-tertiary">Nobody has tagged you yet.</li>
        ) : null}
        {(mentions ?? []).map((mention) => (
          <li key={mention.id}>
            <button
              type="button"
              onClick={() => onOpenChannel(mention.channel)}
              className={cn(
                "flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-layer-1",
                !mention.read && "bg-accent-subtle"
              )}
            >
              <span className="flex flex-wrap items-center gap-2 text-body-sm-medium text-primary">
                {mention.author.display_name}
                {mention.kind === "ATTENTION" ? <Badge variant="warning" size="sm" label="Needs attention" /> : null}
                {mention.via_team ? (
                  <span className="text-caption-sm-regular text-tertiary">via team {mention.via_team}</span>
                ) : null}
                <span className="ml-auto text-caption-sm-regular text-tertiary">
                  {dateFormat.format(new Date(mention.created_at))}
                </span>
              </span>
              <span className="line-clamp-2 text-body-sm-regular whitespace-pre-line text-secondary">
                {mention.body}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

/** Chat and files for the people of a team or a project. Membership of the team or project is the only key. */
export const HubRoot = observer(function HubRoot({ workspaceSlug }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { channels, unreadMentions, isLoading, refresh } = useHubChannels(workspaceSlug);
  const requested = searchParams.get("channel");
  const list = channels ?? [];
  const active = requested === MENTIONS ? null : (list.find((channel) => channel.id === requested) ?? list[0] ?? null);
  const showMentions = requested === MENTIONS;

  const open = (id: string) => setSearchParams({ channel: id });

  return (
    <div className="flex h-[calc(100vh-var(--header-height,3.5rem))] min-h-96 w-full">
      <aside
        aria-label="Channels"
        className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-subtle p-3"
      >
        <button
          type="button"
          onClick={() => setSearchParams({ channel: MENTIONS })}
          className={cn(
            "flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-body-sm-medium",
            showMentions ? "bg-layer-1 text-primary" : "text-secondary hover:bg-layer-1"
          )}
        >
          <span>Mentions</span>
          {unreadMentions > 0 ? <Badge variant="warning" size="sm" label={String(unreadMentions)} /> : null}
        </button>
        <ChannelGroup
          title="Teams"
          channels={list.filter((channel) => channel.kind === "TEAM")}
          activeId={showMentions ? null : (active?.id ?? null)}
          onOpen={open}
        />
        <ChannelGroup
          title="Projects"
          channels={list.filter((channel) => channel.kind === "PROJECT")}
          activeId={showMentions ? null : (active?.id ?? null)}
          onOpen={open}
        />
        {!isLoading && list.length === 0 ? (
          <p className="px-3 text-body-xs-regular text-tertiary">
            You are not in a team or a project yet. Channels appear when you join one.
          </p>
        ) : null}
      </aside>
      <section className="min-w-0 flex-1">
        {showMentions ? (
          <MentionsView workspaceSlug={workspaceSlug} onOpenChannel={open} />
        ) : active ? (
          <ChannelView key={active.id} workspaceSlug={workspaceSlug} channel={active} onRead={() => void refresh()} />
        ) : (
          <p className="p-6 text-body-sm-regular text-tertiary">Choose a channel.</p>
        )}
      </section>
    </div>
  );
});
