/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Per-project Slack channel notification mappings. Each row binds
 * one Slack channel + a set of event-type checkboxes to this Plane
 * project. Persisted as `WorkspaceEntityConnection` rows scoped by
 * `(workspace_connection_id, project_id, type='slack-channel-notification')`.
 *
 * Gated on the workspace having a Slack install — if not, render a
 * pointer to Workspace Settings → Integrations.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { Trash2 } from "lucide-react";

import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

import { SiloIntegrationService } from "@/services/integrations";
import type { SlackChannel } from "@/services/integrations";

import { AddChannelMappingModal } from "./add-channel-modal";

const silo = new SiloIntegrationService();

const WORKSPACE_KEY = (slug: string) => `silo-connections-slack:${slug}`;
const ENTITY_KEY = (slug: string, projectId: string) => `silo-entity-slack:${slug}:${projectId}`;
const CHANNELS_KEY = (slug: string, teamId: string) => `silo-channels:${slug}:${teamId}`;

export const SLACK_NOTIFICATION_TYPE = "slack-channel-notification";

export type SlackNotificationConfig = {
  events?: string[];
};

export const EVENT_OPTIONS: { id: string; label: string }[] = [
  { id: "work_item.created", label: "Work item created" },
  { id: "work_item.state_changed", label: "State change" },
  { id: "work_item.commented", label: "Comment created" },
  { id: "work_item.completed", label: "Marked done / cancelled" },
];

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectSlackNotificationsRoot = observer(function ProjectSlackNotificationsRoot({
  workspaceSlug,
  projectId,
}: Props) {
  const { data: workspaceConnections } = useSWR(workspaceSlug ? WORKSPACE_KEY(workspaceSlug) : null, () =>
    silo.listConnections(workspaceSlug, "slack")
  );
  const slackInstall = workspaceConnections && workspaceConnections.length > 0 ? workspaceConnections[0] : null;
  const teamId = slackInstall?.connection_id ?? "";

  const { data: mappings, isLoading: mappingsLoading } = useSWR(
    workspaceSlug && projectId ? ENTITY_KEY(workspaceSlug, projectId) : null,
    () =>
      silo.listEntityConnections(workspaceSlug, {
        projectId,
        type: SLACK_NOTIFICATION_TYPE,
      })
  );

  const { data: channels } = useSWR(slackInstall && teamId ? CHANNELS_KEY(workspaceSlug, teamId) : null, () =>
    silo.listSlackChannels(workspaceSlug, teamId)
  );

  const channelById = new Map<string, SlackChannel>();
  for (const c of channels ?? []) channelById.set(c.id, c);

  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!workspaceConnections) {
    return <div className="text-body-sm-regular text-secondary">Loading…</div>;
  }
  if (!slackInstall) {
    return (
      <div className="rounded border border-subtle bg-surface-1 px-4 py-6">
        <div className="text-body-sm-medium">Slack is not connected to this workspace</div>
        <div className="text-body-xs-regular text-secondary">
          Ask a workspace admin to install Slack under <em>Workspace Settings → Integrations</em>.
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await silo.deleteEntityConnection(workspaceSlug, id);
      await mutate(ENTITY_KEY(workspaceSlug, projectId));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Channel mapping removed",
        message: "Notifications will stop posting to that channel.",
      });
    } catch (e) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Delete failed",
        message: (e as Error).message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-body-sm-regular text-secondary">
          {mappings && mappings.length > 0
            ? `${mappings.length} channel${mappings.length === 1 ? "" : "s"} mapped to this project.`
            : "No channels mapped yet."}
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          Add channel
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {mappingsLoading ? <div className="text-body-sm-regular text-secondary">Loading mappings…</div> : null}
        {mappings?.map((m) => {
          const channel = channelById.get(m.entity_id);
          const events = ((m.config as SlackNotificationConfig | null)?.events ?? []).map(
            (id) => EVENT_OPTIONS.find((e) => e.id === id)?.label ?? id
          );
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded border border-subtle bg-surface-1 px-4 py-3"
            >
              <div>
                <div className="text-body-sm-medium">
                  #{m.entity_slug ?? channel?.name ?? m.entity_id}
                  {channel && !channel.is_member ? (
                    <span className="ml-2 text-body-xs-regular text-secondary">
                      (bot not in channel — invite @Plane there)
                    </span>
                  ) : null}
                </div>
                <div className="text-body-xs-regular text-secondary">
                  {events.length > 0 ? events.join(" · ") : "No events selected"}
                </div>
              </div>
              <Button variant="error-outline" onClick={() => handleDelete(m.id)} loading={deletingId === m.id}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {addOpen ? (
        <AddChannelMappingModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          workspaceConnectionId={slackInstall.id}
          channels={channels ?? []}
          existingChannelIds={new Set((mappings ?? []).map((m) => m.entity_id))}
          onClose={() => setAddOpen(false)}
          onSuccess={async () => {
            setAddOpen(false);
            await mutate(ENTITY_KEY(workspaceSlug, projectId));
          }}
        />
      ) : null}
    </>
  );
});
