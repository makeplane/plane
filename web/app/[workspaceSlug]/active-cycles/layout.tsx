"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import WorkspaceActiveCycleHeader from "./header";

const WorkspaceActiveCycleLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<WorkspaceActiveCycleHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default WorkspaceActiveCycleLayout;
