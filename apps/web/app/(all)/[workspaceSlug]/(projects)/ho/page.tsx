import { useSearchParams } from "react-router";
import { PageHead } from "@/components/core/page-title";
import { HoDepartmentList } from "@/plane-web/components/ho/department-list";
import { HoDatasheetView } from "@/plane-web/components/ho/ho-datasheet-view";
import { HoCategoryView } from "@/plane-web/components/ho/ho-category-view";

export default function HoPage() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "department";

  return (
    <>
      <PageHead title="HO" />
      {view === "datasheet" ? <HoDatasheetView /> : view === "category" ? <HoCategoryView /> : <HoDepartmentList />}
    </>
  );
}
