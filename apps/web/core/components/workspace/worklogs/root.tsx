/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TTimeLogFilters } from "@plane/types";
// components
import { WorklogsFilters } from "./filters";
import { WorklogsTable } from "./worklogs-table";
import { ExportWorklogsButton } from "./export-button";
// services
import { WorkspaceTimeLogService } from "@/services/workspace/time-log.service";

const workspaceTimeLogService = new WorkspaceTimeLogService();

export const WorklogsRoot = observer(function WorklogsRoot() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<TTimeLogFilters>({});

  const slug = workspaceSlug?.toString();

  const { data, isLoading, error } = useSWR(
    slug ? `WORKLOGS_LIST_${slug}_${JSON.stringify(filters)}` : null,
    () => workspaceTimeLogService.getWorkspaceTimeLogs(slug, filters),
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <WorklogsFilters filters={filters} onChange={setFilters} />
        <ExportWorklogsButton workspaceSlug={slug ?? ""} filters={filters} disabled={!data || data.length === 0} />
      </div>

      {isLoading ? (
        <div className="animate-pulse divide-y-[0.5px] divide-subtle-1">
          {Array.from({ length: 4 }).map((_, i) => (
            // oxlint-disable-next-line react/no-array-index-key
            <div key={i} className="h-12 bg-layer-1" />
          ))}
        </div>
      ) : error ? (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("something_went_wrong_please_try_again")}
        />
      ) : data && data.length > 0 ? (
        <WorklogsTable workspaceSlug={slug ?? ""} logs={data} />
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("settings_empty_state.worklogs.title")}
          description={t("settings_empty_state.worklogs.description")}
          align="start"
        />
      )}
    </div>
  );
});
