import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectInboxHeader } from "@/plane-web/components/projects/settings/intake/header";

export default function ProjectInboxIssuesLayout() {
  return (
    <>
      <AppHeader header={<ProjectInboxHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
