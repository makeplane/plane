/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChevronDown, Download } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TTimeEntryFilters } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// services
import { timeTrackingService } from "@/services/time-tracking.service";

type Props = {
  workspaceSlug: string;
  filters: TTimeEntryFilters;
  onExportPivot?: () => void;
};

/** Entries as CSV / Excel (server side, same filters), and the pivot as CSV (client side). */
export function TimeReportExportMenu({ workspaceSlug, filters, onExportPivot }: Props) {
  const { t } = useTranslation();
  // a plain download link: the session cookie authenticates it
  const exportEntries = (format: "csv" | "xlsx") => {
    window.location.href = timeTrackingService.getExportUrl(workspaceSlug, format, filters);
  };
  return (
    <CustomMenu
      customButton={
        <span className="flex h-7 items-center gap-1.5 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2 text-13 text-secondary hover:bg-layer-2-hover">
          <Download className="size-3.5" />
          {t("time-tracking.reports.export")}
          <ChevronDown className="size-3" />
        </span>
      }
      placement="bottom-end"
      closeOnSelect
    >
      <CustomMenu.MenuItem onClick={() => exportEntries("csv")}>
        {t("time-tracking.reports.export_entries_csv")}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => exportEntries("xlsx")}>
        {t("time-tracking.reports.export_entries_xlsx")}
      </CustomMenu.MenuItem>
      {onExportPivot && (
        <CustomMenu.MenuItem onClick={onExportPivot}>{t("time-tracking.reports.export_pivot_csv")}</CustomMenu.MenuItem>
      )}
    </CustomMenu>
  );
}
