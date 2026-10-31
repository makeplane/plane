/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { SelectField } from "@makeplane/propel/components/select-field";
import { setToast } from "@plane/blocks/toast";
import type { THubChannel } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { hubExtraService, useHubChannels, useHubMentions, useHubPeople } from "@/hooks/team-ops/use-hub";
// local imports
import { getErrorMessage } from "../calendar/error-message";
import { ChannelView } from "./channel-view";
import { DocsView } from "./docs-view";
import { FilesView } from "./files-view";
import { SecretsView } from "./secrets-view";

type Props = { workspaceSlug: string };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const SECTIONS = ["mentions", "docs", "files", "secrets"] as const;
type TSection = (typeof SECTIONS)[number];
const SECTION_LABEL: Record<TSection, string> = {
  mentions: "Mentions",
  docs: "Doc Hub",
  files: "Files",
  secrets: "Secrets",
};

const SideButton = ({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) => (
  <button
    type="button"
    aria-current={active ? "page" : undefined}
    onClick={onClick}
    className={cn(
      "flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-body-sm-regular",
      active ? "bg-layer-1 text-primary" : "text-secondary hover:bg-layer-1"
    )}
  >
    <span className="truncate">{children}</span>
    {badge ? <Badge variant="brand" size="sm" label={String(badge)} /> : null}
  </button>
);

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="px-3 pb-1 text-caption-sm-medium text-tertiary uppercase">{title}</h3>
      {children}
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

/** Chat, news, private messages, documents, files and secrets for the people of a workspace. */
export const HubRoot = observer(function HubRoot({ workspaceSlug }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { channels, unreadMentions, isLoading, refresh } = useHubChannels(workspaceSlug);
  const { people } = useHubPeople(workspaceSlug);
  const list = channels ?? [];
  const requestedChannel = searchParams.get("channel");
  const requestedSection = searchParams.get("section");
  const section =
    SECTIONS.find((item) => item === requestedSection) ?? (requestedChannel === "mentions" ? "mentions" : null);
  const fallback = list.find((channel) => channel.kind === "GENERAL") ?? list[0] ?? null;
  const active: THubChannel | null = section
    ? null
    : (list.find((channel) => channel.id === requestedChannel) ?? fallback);

  const openChannel = (id: string) => setSearchParams({ channel: id });
  const openSection = (next: TSection) => setSearchParams({ section: next });

  const startDirect = async (user: string | null) => {
    if (!user) return;
    try {
      const channel = await hubExtraService.openDirect(workspaceSlug, user);
      await refresh();
      openChannel(channel.id);
    } catch (error) {
      setToast({ type: "error", title: "Could not open", message: getErrorMessage(error) });
    }
  };

  const ofKind = (...kinds: THubChannel["kind"][]) => list.filter((channel) => kinds.includes(channel.kind));
  const channelButton = (channel: THubChannel) => (
    <SideButton
      key={channel.id}
      active={active?.id === channel.id}
      onClick={() => openChannel(channel.id)}
      badge={channel.unread}
    >
      {channel.kind === "DM" ? channel.name : `# ${channel.name}`}
    </SideButton>
  );

  return (
    <div className="flex h-[calc(100vh-var(--header-height,3.5rem))] min-h-96 w-full">
      <aside aria-label="Hub" className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-subtle p-3">
        <Group title="Inbox">
          <SideButton active={section === "mentions"} onClick={() => openSection("mentions")} badge={unreadMentions}>
            {SECTION_LABEL.mentions}
          </SideButton>
        </Group>
        <Group title="Everyone">{ofKind("NEWS", "GENERAL").map(channelButton)}</Group>
        {ofKind("TEAM").length > 0 ? <Group title="Teams">{ofKind("TEAM").map(channelButton)}</Group> : null}
        {ofKind("PROJECT").length > 0 ? <Group title="Projects">{ofKind("PROJECT").map(channelButton)}</Group> : null}
        <Group title="Private">
          {ofKind("DM").map(channelButton)}
          <div className="px-1 pt-1 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="New private message"
              options={(people ?? []).map((person) => ({ value: person.id, label: person.display_name }))}
              value={undefined}
              onValueChange={(value) => void startDirect(value)}
            />
          </div>
        </Group>
        <Group title="Library">
          {(["docs", "files", "secrets"] as const).map((item) => (
            <SideButton key={item} active={section === item} onClick={() => openSection(item)}>
              {SECTION_LABEL[item]}
            </SideButton>
          ))}
        </Group>
        {!isLoading && list.length === 0 ? (
          <p className="px-3 text-body-xs-regular text-tertiary">Channels appear when you join a team or a project.</p>
        ) : null}
      </aside>
      <section className="min-w-0 flex-1">
        {section === "mentions" ? <MentionsView workspaceSlug={workspaceSlug} onOpenChannel={openChannel} /> : null}
        {section === "docs" ? <DocsView workspaceSlug={workspaceSlug} /> : null}
        {section === "files" ? <FilesView workspaceSlug={workspaceSlug} /> : null}
        {section === "secrets" ? <SecretsView workspaceSlug={workspaceSlug} /> : null}
        {!section && active ? (
          <ChannelView key={active.id} workspaceSlug={workspaceSlug} channel={active} onRead={() => void refresh()} />
        ) : null}
        {!section && !active ? <p className="p-6 text-body-sm-regular text-tertiary">Choose a channel.</p> : null}
      </section>
    </div>
  );
});
