/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { CloudOff, Dot } from "lucide-react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Badge } from "@makeplane/propel/components/badge";

type Props = {
  syncStatus: "syncing" | "synced" | "error";
};

const BADGE_CONTENT = {
  syncing: {
    label: "Syncing...",
    tooltipLabel: "Syncing... Your changes are being synced with the server. You can continue making changes.",
  },
  error: {
    label: "Connection lost",
    tooltipLabel:
      "Connection lost. We're having trouble connecting to the websocket server. Your changes will be synced and saved every 10 seconds.",
  },
};

export function PageSyncingBadge({ syncStatus }: Props) {
  const [isVisible, setIsVisible] = useState(syncStatus !== "synced");

  // Runs once per status change. The pending hide is cancelled if the status moves on (or the badge
  // unmounts) before it fires, so a stale timer can't hide the badge during a later sync.
  useEffect(() => {
    if (syncStatus !== "synced") {
      setIsVisible(true);
      return;
    }
    // Delay hiding to allow exit animation to complete
    const timeoutId = setTimeout(() => {
      setIsVisible(false);
    }, 300); // match animation duration
    return () => clearTimeout(timeoutId);
  }, [syncStatus]);

  if (!isVisible || syncStatus === "synced") return null;

  // The synced early-return above guarantees this key exists
  const content = BADGE_CONTENT[syncStatus];

  return (
    <Tooltip label={content.tooltipLabel} layout="stacked">
      <span className="animate-quickFadeIn">
        <Badge
          variant={syncStatus === "syncing" ? "brand" : "danger"}
          size="sm"
          startIcon={syncStatus === "syncing" ? <Dot className="size-4" /> : <CloudOff className="size-4" />}
          label={content.label}
        />
      </span>
    </Tooltip>
  );
}
