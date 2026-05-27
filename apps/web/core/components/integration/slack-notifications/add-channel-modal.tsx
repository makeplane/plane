/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Modal: pick a Slack channel + check which event types should
 * post there for this project. Persists as a
 * `WorkspaceEntityConnection` row of `type=slack-channel-notification`.
 */

import { useMemo, useState } from "react";

import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

import { SiloIntegrationService } from "@/services/integrations";
import type { SlackChannel } from "@/services/integrations";

import { EVENT_OPTIONS, SLACK_NOTIFICATION_TYPE } from "./root";

const silo = new SiloIntegrationService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  workspaceConnectionId: string;
  channels: SlackChannel[];
  existingChannelIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export const AddChannelMappingModal = ({
  workspaceSlug,
  projectId,
  workspaceConnectionId,
  channels,
  existingChannelIds,
  onClose,
  onSuccess,
}: Props) => {
  const [filter, setFilter] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(EVENT_OPTIONS.map((e) => e.id)));
  const [submitting, setSubmitting] = useState(false);

  const filteredChannels = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return channels.filter((c) => {
      if (existingChannelIds.has(c.id)) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q);
    });
  }, [channels, existingChannelIds, filter]);

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedChannelId) return;
    const channel = channels.find((c) => c.id === selectedChannelId);
    if (!channel) return;
    setSubmitting(true);
    try {
      await silo.createEntityConnection(workspaceSlug, {
        workspace_connection_id: workspaceConnectionId,
        project_id: projectId,
        type: SLACK_NOTIFICATION_TYPE,
        entity_type: "slack-channel",
        entity_id: channel.id,
        entity_slug: channel.name,
        entity_data: {
          is_private: channel.is_private,
          is_member: channel.is_member,
        },
        config: { events: Array.from(selectedEvents) },
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Channel mapped",
        message: `Notifications for this project will post to #${channel.name}.`,
      });
      await onSuccess();
    } catch (e) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to add mapping",
        message: (e as Error).message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore
      isOpen
      handleClose={submitting ? () => {} : onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XL}
    >
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="text-heading-md-semibold">Add Slack channel</h3>
          <p className="text-body-xs-regular text-secondary">Pick a channel and the events that should post there.</p>
        </div>

        <div>
          <label htmlFor="slack-channel-filter" className="text-body-xs-medium">
            Channel
          </label>
          <input
            id="slack-channel-filter"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter channels…"
            className="mt-1 w-full rounded border border-subtle bg-surface-1 px-2 py-1 text-body-sm-regular"
          />
          <div className="mt-2 max-h-56 overflow-y-auto rounded border border-subtle bg-surface-1">
            {filteredChannels.length === 0 ? (
              <div className="p-3 text-body-xs-regular text-secondary">No channels match.</div>
            ) : (
              filteredChannels.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 border-b border-subtle px-3 py-2 last:border-b-0 hover:bg-surface-2"
                >
                  <input
                    type="radio"
                    name="channel"
                    checked={selectedChannelId === c.id}
                    onChange={() => setSelectedChannelId(c.id)}
                  />
                  <span className="text-body-sm-regular">
                    #{c.name}
                    {c.is_private ? <span className="ml-1 text-body-xs-regular text-secondary">private</span> : null}
                    {!c.is_member ? (
                      <span className="ml-2 text-body-xs-regular text-secondary">
                        — invite @Plane to this channel first
                      </span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="text-body-xs-medium">Events</div>
          <div className="mt-2 flex flex-col gap-1">
            {EVENT_OPTIONS.map((e) => (
              <label key={e.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedEvents.has(e.id)} onChange={() => toggleEvent(e.id)} />
                <span className="text-body-sm-regular">{e.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedChannelId || selectedEvents.size === 0 || submitting}
            loading={submitting}
          >
            {submitting ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};
