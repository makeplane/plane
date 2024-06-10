import { AppHeaderWrapper, AppPageWrapper } from "@/components/app";
import WorkspaceActiveCycleHeader from "./header";

const WorkspaceActiveCycleLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeaderWrapper header={<WorkspaceActiveCycleHeader />} />
    <AppPageWrapper>{children}</AppPageWrapper>
  </>
);

export default WorkspaceActiveCycleLayout;
