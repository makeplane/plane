/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
// hooks
import { useTimer } from "@/hooks/store/use-timer";

/** No entries for the current filters, with "Start a timer" and "Log time" calls to action. */
export const TimeEntriesEmptyState = observer(function TimeEntriesEmptyState({ canLog }: { canLog: boolean }) {
  const { t } = useTranslation();
  const { openLogTimeModal, setStartPopoverOpen } = useTimer();
  return (
    <EmptyStateDetailed
      assetKey="search"
      title={t("time-tracking.empty_state.entries_title")}
      description={t("time-tracking.empty_state.entries_description")}
      actions={
        canLog
          ? [
              { label: t("time-tracking.timer.start"), variant: "secondary", onClick: () => setStartPopoverOpen(true) },
              { label: t("time-tracking.log_time_button"), variant: "primary", onClick: () => openLogTimeModal() },
            ]
          : []
      }
    />
  );
});
