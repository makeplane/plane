/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// hooks
import { revalidateTimeTracking } from "@/hooks/time-tracking/keys";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { getTimeTrackingErrorMessage } from "../helpers";
import { DeleteTimeEntryModal } from "../modals/delete-time-entry-modal";

type Props = {
  workspaceSlug: string;
  selectedIds: string[];
  onDone: () => void;
};

/** Delete / mark billable / mark non-billable for the selected entries (all-or-nothing on the server). */
export function TimeEntriesBulkActionsBar({ workspaceSlug, selectedIds, onDone }: Props) {
  const { t } = useTranslation();
  const [isBusy, setIsBusy] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const run = async (request: () => Promise<{ updated: number }>, successKey: string) => {
    setIsBusy(true);
    try {
      const { updated } = await request();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t(successKey, { count: updated }) });
      onDone();
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: getTimeTrackingErrorMessage(t, error) });
    } finally {
      setIsBusy(false);
      void revalidateTimeTracking(workspaceSlug);
    }
  };

  const setBillable = (isBillable: boolean) =>
    void run(
      () =>
        timeTrackingService.bulk(workspaceSlug, { action: "set_billable", ids: selectedIds, is_billable: isBillable }),
      "time-tracking.toasts.entries_updated"
    );

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border-[0.5px] border-accent-strong bg-accent-subtle px-3 py-1.5 text-13">
      <span className="font-medium text-accent-primary">
        {t("time-tracking.entries.selected", { count: selectedIds.length })}
      </span>
      <Button variant="secondary" size="base" disabled={isBusy} onClick={() => setBillable(true)}>
        {t("time-tracking.entries.mark_billable")}
      </Button>
      <Button variant="secondary" size="base" disabled={isBusy} onClick={() => setBillable(false)}>
        {t("time-tracking.entries.mark_non_billable")}
      </Button>
      <Button variant="error-outline" size="base" disabled={isBusy} onClick={() => setIsDeleteOpen(true)}>
        {t("delete")}
      </Button>
      <DeleteTimeEntryModal
        isOpen={isDeleteOpen}
        count={selectedIds.length}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() =>
          run(
            () => timeTrackingService.bulk(workspaceSlug, { action: "delete", ids: selectedIds }),
            "time-tracking.toasts.entries_deleted"
          )
        }
      />
    </div>
  );
}
