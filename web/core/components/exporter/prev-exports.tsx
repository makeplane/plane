import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { MoveLeft, MoveRight, RefreshCw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { IExportData } from "@plane/types";
import { Table } from "@plane/ui";
import { EXPORT_SERVICES_LIST } from "@/constants/fetch-keys";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { IntegrationService } from "@/services/integrations";
import { DetailedEmptyState } from "../empty-state";
import { ImportExportSettingsLoader } from "../ui";
import { useExportColumns } from "./column";

const integrationService = new IntegrationService();

type Props = {
  workspaceSlug: string;
  cursor: string | undefined;
  per_page: number;
  setCursor: (cursor: string) => void;
};
type RowData = IExportData;
export const PrevExports = observer((props: Props) => {
  // props
  const { workspaceSlug, cursor, per_page, setCursor } = props;
  // state
  const [refreshing, setRefreshing] = useState(false);
  // hooks
  const { t } = useTranslation();
  const columns = useExportColumns();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/workspace-settings/exports" });

  const { data: exporterServices } = useSWR(
    workspaceSlug && cursor ? EXPORT_SERVICES_LIST(workspaceSlug as string, cursor, `${per_page}`) : null,
    workspaceSlug && cursor
      ? () => integrationService.getExportsServicesList(workspaceSlug as string, cursor, per_page)
      : null
  );

  const handleRefresh = () => {
    setRefreshing(true);
    mutate(EXPORT_SERVICES_LIST(workspaceSlug as string, `${cursor}`, `${per_page}`)).then(() => setRefreshing(false));
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
      <div className="flex items-center justify-between border-b border-custom-border-100 pb-3.5 pt-7">
        <div className="flex items-center gap-2">
          <h3 className="flex gap-2 text-xl font-medium">
            {t("workspace_settings.settings.exports.previous_exports")}
          </h3>

          <button
            type="button"
            className="flex flex-shrink-0 items-center gap-1 rounded bg-custom-background-80 px-1.5 py-1 text-xs outline-none"
            onClick={handleRefresh}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />{" "}
            {refreshing ? `${t("refreshing")}...` : t("refresh_status")}
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            disabled={!exporterServices?.prev_page_results}
            onClick={() => exporterServices?.prev_page_results && setCursor(exporterServices?.prev_cursor)}
            className={`flex items-center rounded border border-custom-primary-100 px-1 text-custom-primary-100 ${
              exporterServices?.prev_page_results
                ? "cursor-pointer hover:bg-custom-primary-100 hover:text-white"
                : "cursor-not-allowed opacity-75"
            }`}
          >
            <MoveLeft className="h-4 w-4" />
            <div className="pr-1">{t("prev")}</div>
          </button>
          <button
            disabled={!exporterServices?.next_page_results}
            onClick={() => exporterServices?.next_page_results && setCursor(exporterServices?.next_cursor)}
            className={`flex items-center rounded border border-custom-primary-100 px-1 text-custom-primary-100 ${
              exporterServices?.next_page_results
                ? "cursor-pointer hover:bg-custom-primary-100 hover:text-white"
                : "cursor-not-allowed opacity-75"
            }`}
          >
            <div className="pl-1">{t("next")}</div>
            <MoveRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {exporterServices && exporterServices?.results ? (
          exporterServices?.results?.length > 0 ? (
            <div>
              <div className="divide-y divide-custom-border-200">
                <Table
                  columns={columns}
                  data={exporterServices?.results ?? []}
                  keyExtractor={(rowData: RowData) => rowData?.id ?? ""}
                  tHeadClassName="border-b border-custom-border-100"
                  thClassName="text-left font-medium divide-x-0 text-custom-text-400"
                  tBodyClassName="divide-y-0"
                  tBodyTrClassName="divide-x-0 p-4 h-[40px] text-custom-text-200"
                  tHeadTrClassName="divide-x-0"
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <DetailedEmptyState
                title={t("workspace_settings.empty_state.exports.title")}
                description={t("workspace_settings.empty_state.exports.description")}
                assetPath={resolvedPath}
                className="w-full !px-0"
                size="sm"
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
