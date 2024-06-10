"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import ProjectArchivesHeader from "../header";

const ProjectArchiveCyclesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ProjectArchivesHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectArchiveCyclesLayout;
