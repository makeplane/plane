/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { RefreshOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { Pagination } from "@makeplane/propel/components/pagination";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import type { IExportData } from "@plane/types";
// components
import { DataTable } from "@/components/common/data-table";
import { ImportExportSettingsLoader } from "@/components/ui/loader/settings/import-and-export";
// constants
import { EXPORT_SERVICES_LIST } from "@plane/constants";
// services
import { IntegrationService } from "@/services/integrations";
// local imports
import { useExportColumns } from "./column";

const integrationService = new IntegrationService();

type Props = {
  workspaceSlug: string;
  cursor: string | undefined;
  per_page: number;
  setCursor: (cursor: string) => void;
};
type RowData = IExportData;
export const PrevExports = observer(function PrevExports(props: Props) {
  // props
  const { workspaceSlug, cursor, per_page, setCursor } = props;
  // state
  const [refreshing, setRefreshing] = useState(false);
  // hooks
  const { t } = useTranslation();
  const columns = useExportColumns();
  // the cursor is `<per_page>:<page index>:0`
  const pageIndex = Number.parseInt(cursor?.split(":")[1] ?? "0", 10);
  const currentPage = Number.isNaN(pageIndex) ? 1 : pageIndex + 1;

  const { data: exporterServices } = useSWR(
    workspaceSlug && cursor ? EXPORT_SERVICES_LIST(workspaceSlug, cursor, `${per_page}`) : null,
    workspaceSlug && cursor ? () => integrationService.getExportsServicesList(workspaceSlug, cursor, per_page) : null
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await mutate(EXPORT_SERVICES_LIST(workspaceSlug, `${cursor}`, `${per_page}`));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to refresh export services list", error);
    } finally {
      setRefreshing(false);
    }
  }, [workspaceSlug, cursor, per_page]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        Array.isArray(exporterServices?.results) &&
        exporterServices.results.some((service) => service.status === "processing")
      ) {
        handleRefresh();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [exporterServices, handleRefresh]);

  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-h6-medium text-primary">{t("workspace_settings.settings.exports.previous_exports")}</h3>
          <Button
            variant="tertiary"
            size="sm"
            stretch="auto"
            onClick={() => void handleRefresh()}
            icon={<Icon icon={<RefreshOutline className={refreshing ? "animate-spin" : ""} />} />}
            label={refreshing ? t("refreshing") : t("refresh_status")}
          />
        </div>
      </div>
      <div className="flex flex-col">
        {!exporterServices ? (
          <ImportExportSettingsLoader />
        ) : Array.isArray(exporterServices.results) && exporterServices.results.length > 0 ? (
          <div>
            <div className="divide-y divide-subtle-1">
              <DataTable
                columns={columns}
                data={exporterServices.results}
                keyExtractor={(rowData: RowData) => rowData?.id ?? ""}
              />
            </div>
            {exporterServices.total_pages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination
                  page={currentPage}
                  pageCount={exporterServices.total_pages}
                  onPageChange={(page) => setCursor(`${per_page}:${page - 1}:0`)}
                  labels={{
                    root: t("aria_labels.pagination.root"),
                    previous: t("aria_labels.pagination.previous_page"),
                    next: t("aria_labels.pagination.next_page"),
                    page: (page) => t("aria_labels.pagination.go_to_page", { page }),
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <EmptyStateCompact
              assetKey="export"
              title={t("settings_empty_state.exports.title")}
              description={t("settings_empty_state.exports.description")}
              align="center"
              rootClassName="rounded-lg border border-subtle bg-surface-1 py-10"
            />
          </div>
        )}
      </div>
    </div>
  );
});
