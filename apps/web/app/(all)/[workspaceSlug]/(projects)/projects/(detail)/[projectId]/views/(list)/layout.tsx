import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { ProjectViewsHeader } from "./header";
import { ViewMobileHeader } from "./mobile-header";

export default function ProjectViewsListLayout() {
  return (
    <>
      <AppHeader header={<ProjectViewsHeader />} mobileHeader={<ViewMobileHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
