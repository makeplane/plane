import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { HoDepartmentList } from "@/plane-web/components/ho/department-list";
import { HoDatasheetView } from "@/plane-web/components/ho/ho-datasheet-view";
import { HoCategoryView } from "@/plane-web/components/ho/ho-category-view";
import { HoExportsList } from "@/plane-web/components/ho/ho-exports-list";

// Refetch on mount and on workspace switch (store is singleton, won't re-mount).
const HoPage = observer(function HoPage() {
  const [searchParams] = useSearchParams();
  const { workspaceSlug } = useParams();
  const view = searchParams.get("view") ?? "department";
  const store = useHoIssues();

  useEffect(() => {
    void store.fetchFilterOptions();
  }, [store, workspaceSlug]);

  return (
    <>
      <PageHead title="Overall Management" />
      {view === "datasheet" ? (
        <HoDatasheetView />
      ) : view === "category" ? (
        <HoCategoryView />
      ) : view === "exports" ? (
        <HoExportsList />
      ) : (
        <HoDepartmentList />
      )}
    </>
  );
});

export default HoPage;
