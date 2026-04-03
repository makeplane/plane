import { useEffect } from "react";
import { observer } from "mobx-react";
import { Loader, Spinner } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { HoDatasheetToolbar } from "./ho-datasheet-toolbar";
import { HoDatasheetTable } from "./ho-datasheet-table";

export const HoDatasheetView = observer(function HoDatasheetView() {
  const { t } = useTranslation();
  const store = useHoIssues();

  useEffect(() => {
    void store.fetchIssues(1);
    void store.fetchAccessibleWorkspaces();
    void store.fetchFilterOptions();
  }, [store]);

  if (store.isLoading && store.issues.length === 0) {
    return (
      <div className="py-9 px-page-x lg:px-12 space-y-2">
        <Loader className="space-y-2">
          <Loader.Item height="36px" />
          <Loader.Item height="36px" />
          <Loader.Item height="36px" />
          <Loader.Item height="36px" />
        </Loader>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {store.isFetchingIssues && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-1/50">
          <Spinner />
        </div>
      )}
      <HoDatasheetToolbar />

      {store.issues.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-placeholder">{t("ho.no_work_items")}</div>
      ) : (
        <>
          <HoDatasheetTable issues={store.issues} displayProperties={store.displayProperties} />

          {store.nextPageUrl && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                disabled={store.isLoading}
                onClick={() => void store.fetchNextPage()}
                className="rounded border border-subtle px-4 py-1.5 text-sm text-secondary hover:text-primary disabled:opacity-50"
              >
                {store.isLoading
                  ? t("ho.loading")
                  : t("ho.load_more", { loaded: store.issues.length, total: store.totalCount })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});
