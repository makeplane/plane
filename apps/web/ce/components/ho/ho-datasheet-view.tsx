import { useEffect } from "react";
import { observer } from "mobx-react";
import { Loader } from "@plane/ui";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { HoDatasheetToolbar } from "./ho-datasheet-toolbar";
import { HoDatasheetTable } from "./ho-datasheet-table";

export const HoDatasheetView = observer(function HoDatasheetView() {
  const store = useHoIssues();

  useEffect(() => {
    void store.fetchIssues(1);
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
    <div className="flex h-full flex-col">
      <HoDatasheetToolbar />

      {store.issues.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-placeholder">No work items found.</div>
      ) : (
        <>
          <HoDatasheetTable
            issues={store.issues}
            displayProperties={store.displayProperties}
            orderBy={store.orderBy}
            onOrderBy={(key) => store.updateOrderBy(key)}
          />

          {store.nextPageUrl && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                disabled={store.isLoading}
                onClick={() => void store.fetchNextPage()}
                className="rounded border border-subtle px-4 py-1.5 text-sm text-secondary hover:text-primary disabled:opacity-50"
              >
                {store.isLoading ? "Loading…" : `Load more (${store.issues.length} / ${store.totalCount})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});
