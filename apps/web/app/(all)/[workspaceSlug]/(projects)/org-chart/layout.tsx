import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { OrgChartHeader } from "./header";

export default function OrgChartLayout() {
  return (
    <>
      <AppHeader header={<OrgChartHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
