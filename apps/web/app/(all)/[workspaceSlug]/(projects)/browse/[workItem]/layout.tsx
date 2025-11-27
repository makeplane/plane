// components
import { Outlet } from "react-router";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectWorkItemDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout() {
  return (
    <>
      <ProjectWorkItemDetailsHeader />
      <ContentWrapper className="overflow-hidden">
        <Outlet />
      </ContentWrapper>
    </>
  );
}
