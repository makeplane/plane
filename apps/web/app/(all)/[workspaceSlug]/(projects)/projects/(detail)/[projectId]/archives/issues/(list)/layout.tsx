import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectArchivesHeader } from "../../header";

export default function ProjectArchiveIssuesLayout() {
  return (
    <>
      <AppHeader header={<ProjectArchivesHeader activeTab="issues" />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
