/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { mutate } from "swr";
import { RefreshCw } from "lucide-react";
import { IMPORTABLE_IMPORTER_STATUSES, IMPORTER_SERVICES_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IImporterService } from "@plane/types";
import { ImportExportSettingsLoader } from "@/components/ui/loader/settings/import-and-export";
import { getImportHubProviderLabel } from "./import-provider-card";

type Props = {
  workspaceSlug: string;
  importers: IImporterService[] | undefined;
  isLoading: boolean;
  cancellingId: string | null;
  onCancel: (importer: IImporterService) => Promise<void>;
};

function sourceLabel(importer: IImporterService) {
  return importer.metadata?.project_key || importer.metadata?.name || importer.metadata?.owner || "—";
}

function importedCount(importer: IImporterService) {
  return importer.imported_data?.issues ?? importer.data?.total_issues ?? 0;
}

export const ImportHistoryList = observer(function ImportHistoryList(props: Props) {
  const { workspaceSlug, importers, isLoading, cancellingId, onCancel } = props;
  const { t } = useTranslation();
  const importerServicesKey = IMPORTER_SERVICES_LIST(workspaceSlug);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-subtle pb-3.5">
        <h3 className="text-h6-medium text-primary">{t("workspace_settings.settings.imports.previous_imports")}</h3>
        <Button variant="tertiary" className="shrink-0" onClick={() => void mutate(importerServicesKey)}>
          <RefreshCw className="h-3 w-3" />
          {t("refresh_status")}
        </Button>
      </div>
      <div className="flex flex-col">
        {isLoading ? (
          <ImportExportSettingsLoader />
        ) : importers && importers.length > 0 ? (
          <div className="divide-y divide-subtle-1">
            {importers.map((importer) => (
              <div
                key={importer.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-13 font-medium text-primary">
                    <span>{getImportHubProviderLabel(importer.service, t)}</span>
                    <span className="rounded bg-layer-1 px-2 py-0.5 text-11 text-secondary capitalize">
                      {importer.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-12 text-secondary">
                    {sourceLabel(importer)}
                    {importer.project_detail
                      ? ` → ${importer.project_detail.identifier} - ${importer.project_detail.name}`
                      : ""}
                  </p>
                  <p className="mt-1 text-12 text-tertiary">
                    {importedCount(importer)} {t("workspace_settings.settings.imports.jira.issues")}
                    {importer.created_at ? ` · ${new Date(importer.created_at).toLocaleString()}` : ""}
                  </p>
                </div>
                {IMPORTABLE_IMPORTER_STATUSES.has(importer.status) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={cancellingId === importer.id}
                    onClick={() => void onCancel(importer)}
                  >
                    {t("cancel")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <EmptyStateCompact
              assetKey="export"
              title={t("settings_empty_state.imports.title")}
              description={t("settings_empty_state.imports.description")}
              align="start"
              rootClassName="py-20"
            />
          </div>
        )}
      </div>
    </div>
  );
});
