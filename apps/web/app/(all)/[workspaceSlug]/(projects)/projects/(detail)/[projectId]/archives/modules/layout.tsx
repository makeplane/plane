import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectArchivesHeader } from "../header";

export default function ProjectArchiveModulesLayout() {
  return (
    <>
      <AppHeader header={<ProjectArchivesHeader activeTab="modules" />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
