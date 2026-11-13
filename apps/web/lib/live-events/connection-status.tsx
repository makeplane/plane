/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// live updates connection indicator for the project header.
import { useSyncExternalStore } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// local imports
import { getLiveEventsClient } from "@/lib/live-events/client";
import type { TLiveConnectionStatus } from "@/lib/live-events/client";

const IDLE: TLiveConnectionStatus = { state: "idle" };

/** The live events connection state of this tab; idle on the server. */
export function useLiveConnectionStatus(): TLiveConnectionStatus {
  const client = getLiveEventsClient();
  return useSyncExternalStore(client.subscribeConnectionStatus, client.getConnectionStatus, () => IDLE);
}

type Props = {
  isMobile?: boolean;
};

/**
 * A dot (and, when not connected, a short label) showing whether live updates reach this tab.
 * Renders nothing while no project is subscribed.
 */
export function LiveConnectionStatus({ isMobile = false }: Props) {
  const { t } = useTranslation();
  const status = useLiveConnectionStatus();
  if (status.state === "idle") return null;

  let label: string;
  let tooltip: string;
  let dotClass: string;
  switch (status.state) {
    case "connected":
      label = t("live_updates.status.connected");
      tooltip = t("live_updates.status.connected_tooltip");
      dotClass = "bg-success-primary";
      break;
    case "connecting":
      label = t("live_updates.status.connecting");
      tooltip = t("live_updates.status.connecting_tooltip");
      dotClass = "animate-pulse bg-warning-primary";
      break;
    case "reconnecting":
      label = t("live_updates.status.reconnecting");
      tooltip = t("live_updates.status.reconnecting_tooltip");
      dotClass = "animate-pulse bg-warning-primary";
      break;
    case "offline":
      label = t("live_updates.status.offline");
      tooltip =
        status.offlineReason === "unauthenticated"
          ? t("live_updates.status.offline_unauthenticated_tooltip")
          : status.offlineReason === "stopped"
            ? t("live_updates.status.offline_stopped_tooltip")
            : t("live_updates.status.offline_network_tooltip");
      dotClass = "bg-danger-primary";
      break;
  }
  const connected = status.state === "connected";

  return (
    <Tooltip label={tooltip} side="bottom" disabled={isMobile}>
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-sm px-1.5 py-1 text-caption-sm-medium text-secondary"
      >
        <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", dotClass)} aria-hidden="true" />
        {!connected && <span className="hidden whitespace-nowrap sm:inline">{label}</span>}
      </div>
    </Tooltip>
  );
}
