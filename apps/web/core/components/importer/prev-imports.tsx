/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { MoveLeft, MoveRight, RefreshCw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IExportData } from "@plane/types";
import { Table } from "@plane/ui";
import { ImportExportStatusPill } from "@/components/exporter/status-pill";
import { ImportExportSettingsLoader } from "@/components/ui/loader/settings/import-and-export";
import { PROJECT_IMPORT_SERVICES_LIST } from "@/constants/fetch-keys";
import { ProjectImportService } from "@/services/project/project-import.service";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";

const projectImportService = new ProjectImportService();

type Props = {
  workspaceSlug: string;
  cursor: string | undefined;
  per_page: number;
  setCursor: (cursor: string) => void;
};

type RowData = IExportData;

export const PrevImports = observer(function PrevImports(props: Props) {
  const { workspaceSlug, cursor, per_page, setCursor } = props;
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const { data: importServices } = useSWR(
    workspaceSlug && cursor ? PROJECT_IMPORT_SERVICES_LIST(workspaceSlug, cursor, `${per_page}`) : null,
    workspaceSlug && cursor ? () => projectImportService.getImportHistory(workspaceSlug, cursor, per_page) : null
  );

  const handleRefresh = () => {
    setRefreshing(true);
    mutate(PROJECT_IMPORT_SERVICES_LIST(workspaceSlug, `${cursor}`, `${per_page}`)).then(() => setRefreshing(false));
  };

  const columns = [
    {
      key: "Imported By",
      content: t("workspace_settings.settings.imports.history.imported_by"),
      tdRender: (rowData: RowData) => (
        <span className="text-13">{rowData.initiated_by_detail?.display_name ?? "-"}</span>
      ),
    },
    {
      key: "Imported On",
      content: t("workspace_settings.settings.imports.history.imported_on"),
      tdRender: (rowData: RowData) => (
        <span>
          {renderFormattedDate(rowData.created_at)} {renderFormattedTime(rowData.created_at)}
        </span>
      ),
    },
    {
      key: "File",
      content: t("workspace_settings.settings.imports.history.file"),
      tdRender: (rowData: RowData) => <span className="text-13">{rowData.name ?? "-"}</span>,
    },
    {
      key: "Projects",
      content: t("workspace_settings.settings.imports.history.projects"),
      tdRender: (rowData: RowData) => (
        <div className="text-13">
          {t("workspace_settings.settings.imports.history.project_count", { count: rowData.project?.length ?? 0 })}
        </div>
      ),
    },
    {
      key: "Status",
      content: t("workspace_settings.settings.imports.history.status"),
      tdRender: (rowData: RowData) => <ImportExportStatusPill status={rowData.status} />,
    },
    {
      key: "Reason",
      content: t("workspace_settings.settings.imports.history.reason"),
      tdRender: (rowData: RowData) =>
        rowData.status === "failed" && rowData.reason ? (
          <span className="line-clamp-2 max-w-xs text-11 text-danger-primary" title={rowData.reason}>
            {rowData.reason}
          </span>
        ) : (
          <span className="text-13 text-placeholder">-</span>
        ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-subtle pb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-h6-medium text-primary">{t("workspace_settings.settings.imports.previous_imports")}</h3>
          <Button variant="tertiary" className="shrink-0" onClick={handleRefresh}>
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? t("refreshing") : t("refresh_status")}
          </Button>
        </div>
        {!!importServices?.results?.length && (
          <div className="flex items-center gap-2 text-11">
            <Button
              variant="secondary"
              size="sm"
              disabled={!importServices?.prev_page_results}
              onClick={() => importServices?.prev_page_results && setCursor(importServices?.prev_cursor)}
              prependIcon={<MoveLeft />}
            >
              {t("prev")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!importServices?.next_page_results}
              onClick={() => importServices?.next_page_results && setCursor(importServices?.next_cursor)}
              appendIcon={<MoveRight />}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col">
        {importServices && importServices?.results ? (
          importServices?.results?.length > 0 ? (
            <Table
              columns={columns}
              data={importServices?.results ?? []}
              keyExtractor={(rowData: RowData) => rowData?.id ?? ""}
              tHeadClassName="border-b border-subtle"
              thClassName="text-left font-medium divide-x-0 text-placeholder"
              tBodyClassName="divide-y-0"
              tBodyTrClassName="divide-x-0 p-4 h-[40px] text-secondary"
              tHeadTrClassName="divide-x-0"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <EmptyStateCompact
                assetKey="unknown"
                title={t("settings_empty_state.imports.title")}
                description={t("settings_empty_state.imports.description")}
                align="start"
                rootClassName="py-20"
              />
            </div>
          )
        ) : (
          <ImportExportSettingsLoader />
        )}
      </div>
    </div>
  );
});
