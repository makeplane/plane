import { AppPageWrapper } from "@/components/app";
import { AppHeader } from "@/components/core";
import WorkspaceActiveCycleHeader from "./header";

const WorkspaceActiveCycleLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<WorkspaceActiveCycleHeader />} />
    <AppPageWrapper>{children}</AppPageWrapper>
  </>
);

export default WorkspaceActiveCycleLayout;
