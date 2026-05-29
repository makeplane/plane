import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectArchivesHeader } from "../header";

export default function ProjectArchiveCyclesLayout() {
  return (
    <>
      <AppHeader header={<ProjectArchivesHeader activeTab="cycles" />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
