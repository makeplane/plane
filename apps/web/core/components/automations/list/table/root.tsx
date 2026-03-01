/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@plane/propel/table";
import { Avatar } from "@plane/ui";
import { getFileURL, renderFormattedDate, formatDuration, cn } from "@plane/utils";
// store hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import type { IAutomationInstance } from "@/store/automations/automation";
// local imports
import { TableEmptyState } from "./empty-state";
import { SuccessFailureIndicator } from "./indicator";
import { AutomationRunStatusBadge } from "./status-badge";

interface AutomationsTableProps {
  automations: IAutomationInstance[];
  onAutomationClick?: (automation: IAutomationInstance) => void;
}

const COMMON_TABLE_HEADER_CLASSNAME = "h-14 text-center";
const COMMON_TABLE_TITLE_HEADER_CLASSNAME = "h-14 sticky left-0 border-r border-subtle z-10 min-w-[200px]";
const COMMON_TABLE_CELL_CLASSNAME = "text-secondary text-center";
const COMMON_TABLE_DISABLED_CELL_CLASSNAME = "text-placeholder";
const COMMON_TABLE_TITLE_CELL_CLASSNAME =
  "font-medium text-primary max-w-72 truncate sticky left-0 border-r border-subtle z-10 min-w-[200px] transition-colors duration-75 py-3";

export const AutomationsTable = observer(function AutomationsTable(props: AutomationsTableProps) {
  const { automations, onAutomationClick } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getUserDetails } = useMember();

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader className="border-t-0 border-subtle py-4">
            <TableRow>
              <TableHead className={COMMON_TABLE_TITLE_HEADER_CLASSNAME}>{t("automations.table.title")}</TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                {t("automations.table.last_run_on")}
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                {t("automations.table.created_on")}
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                {t("automations.table.last_updated_on")}
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                {t("automations.table.last_run_status")}
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                {t("automations.table.average_duration")}
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                {t("automations.table.owner")}
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                {t("automations.table.executions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {automations.length > 0 ? (
              automations.map((automation) => {
                const owner = getUserDetails(automation.created_by);
                return (
                  <TableRow
                    key={automation.id}
                    className="group hover:bg-layer-transparent-hover cursor-pointer border-b border-subtle transition-colors duration-75"
                    onClick={() => {
                      onAutomationClick?.(automation);
                    }}
                  >
                    <TableCell className={COMMON_TABLE_TITLE_CELL_CLASSNAME}>
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="font-medium max-w-72 truncate" title={automation.name}>
                          {automation.name}
                        </div>
                        <SuccessFailureIndicator
                          failedCount={automation.total_failed_count}
                          successCount={automation.total_success_count}
                          totalCount={automation.run_count}
                        />
                      </div>
                    </TableCell>
                    <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                      {automation.last_run_at ? (
                        renderFormattedDate(automation.last_run_at)
                      ) : (
                        <span className={COMMON_TABLE_DISABLED_CELL_CLASSNAME}>--</span>
                      )}
                    </TableCell>
                    <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                      {renderFormattedDate(automation.created_at)}
                    </TableCell>
                    <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                      {renderFormattedDate(automation.updated_at)}
                    </TableCell>
                    <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                      <AutomationRunStatusBadge status={automation.last_run_status} />
                    </TableCell>
                    <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                      {automation.average_run_time && automation.average_run_time > 0 ? (
                        formatDuration(automation.average_run_time)
                      ) : (
                        <span className={COMMON_TABLE_DISABLED_CELL_CLASSNAME}>--</span>
                      )}
                    </TableCell>
                    <TableCell className={cn(COMMON_TABLE_CELL_CLASSNAME, "grid place-items-center")}>
                      <Avatar
                        name={owner?.display_name}
                        src={owner?.avatar_url ? getFileURL(owner?.avatar_url) : ""}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                      {automation.run_count > 0 ? (
                        `${automation.total_success_count} / ${automation.run_count}`
                      ) : (
                        <span className={COMMON_TABLE_DISABLED_CELL_CLASSNAME}>--</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableEmptyState icon={Search} title="No automations available" colSpan={8} />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
