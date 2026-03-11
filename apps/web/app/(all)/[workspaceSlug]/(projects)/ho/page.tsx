import { PageHead } from "@/components/core/page-title";
import { HoDepartmentList } from "@/plane-web/components/ho/department-list";

export default function HoPage() {
  return (
    <>
      <PageHead title="HO — Departments" />
      <HoDepartmentList />
    </>
  );
}
