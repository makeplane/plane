/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState, useEffect } from "react";
import { CloudOff, Dot } from "lucide-react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Badge } from "@makeplane/propel/components/badge";

type Props = {
  syncStatus: "syncing" | "synced" | "error";
};

export function PageSyncingBadge({ syncStatus }: Props) {
  const { t } = useTranslation();

  const BADGE_CONTENT = {
    syncing: {
      label: t("syncing"),
      tooltipLabel: t("web_ui.syncing_your_changes_are_being_synced_with_the_server_you_can_continue_making_changes"),
    },
    error: {
      label: t("web_ui.connection_lost"),
      tooltipLabel: t(
        "web_ui.connection_lost_we_re_having_trouble_connecting_to_the_websocket_server_your_changes_will_"
      ),
    },
  };

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
