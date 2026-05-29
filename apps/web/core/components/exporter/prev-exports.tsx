import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { MoveLeft, MoveRight, RefreshCw } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IExportData } from "@plane/types";
import { Table } from "@plane/ui";
// components
import { ImportExportSettingsLoader } from "@/components/ui/loader/settings/import-and-export";
// constants
import { EXPORT_SERVICES_LIST } from "@/constants/fetch-keys";
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

  const { data: exporterServices } = useSWR(
    workspaceSlug && cursor ? EXPORT_SERVICES_LIST(workspaceSlug, cursor, `${per_page}`) : null,
    workspaceSlug && cursor ? () => integrationService.getExportsServicesList(workspaceSlug, cursor, per_page) : null
  );

  const handleRefresh = () => {
    setRefreshing(true);
    mutate(EXPORT_SERVICES_LIST(workspaceSlug, `${cursor}`, `${per_page}`)).then(() => setRefreshing(false));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (exporterServices?.results?.some((service) => service.status === "processing")) {
        handleRefresh();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [exporterServices]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-subtle pb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-h6-medium text-primary">{t("workspace_settings.settings.exports.previous_exports")}</h3>
          <Button variant="tertiary" className="shrink-0" onClick={handleRefresh}>
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? t("refreshing") : t("refresh_status")}
          </Button>
        </div>
        {!!exporterServices?.results?.length && (
          <div className="flex items-center gap-2 text-11">
            <Button
              variant="secondary"
              size="sm"
              disabled={!exporterServices?.prev_page_results}
              onClick={() => exporterServices?.prev_page_results && setCursor(exporterServices?.prev_cursor)}
              prependIcon={<MoveLeft />}
            >
              {t("prev")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!exporterServices?.next_page_results}
              onClick={() => exporterServices?.next_page_results && setCursor(exporterServices?.next_cursor)}
              appendIcon={<MoveRight />}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col">
        {exporterServices && exporterServices?.results ? (
          exporterServices?.results?.length > 0 ? (
            <div>
              <div className="divide-y divide-subtle-1">
                <Table
                  columns={columns}
                  data={exporterServices?.results ?? []}
                  keyExtractor={(rowData: RowData) => rowData?.id ?? ""}
                  tHeadClassName="border-b border-subtle"
                  thClassName="text-left font-medium divide-x-0 text-placeholder"
                  tBodyClassName="divide-y-0"
                  tBodyTrClassName="divide-x-0 p-4 h-[40px] text-secondary"
                  tHeadTrClassName="divide-x-0"
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <EmptyStateCompact
                assetKey="export"
                title={t("settings_empty_state.exports.title")}
                description={t("settings_empty_state.exports.description")}
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
