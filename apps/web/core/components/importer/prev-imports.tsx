/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IImporterService } from "@plane/types";
import { Table } from "@plane/ui";
import { ImportProgress } from "@/components/importer/import-progress";
import { ImportExportSettingsLoader } from "@/components/ui/loader/settings/import-and-export";
import { IMPORTER_SERVICES_LIST } from "@/constants/fetch-keys";
import { IntegrationService } from "@/services/integrations";

const integrationService = new IntegrationService();

type Props = {
  workspaceSlug: string;
};

export const PrevImports = observer(function PrevImports(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const { data: importerServices } = useSWR(IMPORTER_SERVICES_LIST(workspaceSlug), () =>
    integrationService.getImporterServicesList(workspaceSlug)
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    mutate(IMPORTER_SERVICES_LIST(workspaceSlug)).then(() => setRefreshing(false));
  }, [workspaceSlug]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (importerServices?.some((service) => service.status === "processing" || service.status === "queued")) {
        handleRefresh();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [handleRefresh, importerServices]);

  const columns = [
    {
      key: "service",
      content: t("workspace_settings.settings.imports.table.service"),
      tdRender: (rowData: IImporterService) => <span className="capitalize">{rowData.service}</span>,
    },
    {
      key: "project",
      content: t("workspace_settings.settings.imports.table.project"),
      tdRender: (rowData: IImporterService) => <span>{rowData.project_detail?.name}</span>,
    },
    {
      key: "status",
      content: t("workspace_settings.settings.imports.table.status"),
      tdRender: (rowData: IImporterService) => (
        <ImportProgress status={rowData.status} importedData={rowData.imported_data} />
      ),
    },
    {
      key: "created_at",
      content: t("workspace_settings.settings.imports.table.created_at"),
      tdRender: (rowData: IImporterService) => <span>{new Date(rowData.created_at).toLocaleString()}</span>,
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
      </div>
      <div className="flex flex-col">
        {importerServices ? (
          importerServices.length > 0 ? (
            <Table
              columns={columns}
              data={importerServices}
              keyExtractor={(rowData: IImporterService) => rowData.id}
              tHeadClassName="border-b border-subtle"
              thClassName="text-left font-medium divide-x-0 text-placeholder"
              tBodyClassName="divide-y-0"
              tBodyTrClassName="divide-x-0 p-4 h-[40px] text-secondary"
              tHeadTrClassName="divide-x-0"
            />
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
          )
        ) : (
          <ImportExportSettingsLoader />
        )}
      </div>
    </div>
  );
});
