/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the License for file details.
 */

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web components
import { formatDuration } from "@/components/issues/issue-detail/time-log/helper";
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";
import { DataTable } from "../insight-table/data-table";

type Props = {
  byProject: { project_id: string; project__name: string; total_minutes: number }[];
  byMember: { logged_by_id: string; logged_by__display_name: string; total_minutes: number }[];
  isLoading: boolean;
};

export const TimeTrackingTable = ({ byProject, byMember: _byMember, isLoading }: Props) => {
  const { t } = useTranslation();

  const columns: ColumnDef<Props["byProject"][number]>[] = useMemo(
    () => [
      {
        accessorKey: "project__name",
        header: () => <div className="text-left">{t("common.project")}</div>,
        cell: ({ row }) => <div className="text-left">{row.original.project__name}</div>,
      },
      {
        accessorKey: "total_minutes",
        header: () => <div className="text-right">{t("time_tracking_tracked_time")}</div>,
        cell: ({ row }) => <div className="text-right">{formatDuration(row.original.total_minutes)}</div>,
      },
    ],
    [t]
  );

  return (
    <AnalyticsSectionWrapper title={t("time_tracking_breakdown")}>
      {isLoading ? (
        <ChartLoader />
      ) : byProject && byProject.length > 0 ? (
        <DataTable data={byProject} columns={columns} searchPlaceholder={t("search")} />
      ) : null}
    </AnalyticsSectionWrapper>
  );
};
