import { AppHeaderWrapper, AppPageWrapper } from "@/components/app";
import WorkspaceAnalyticsHeader from "./header";

const WorkspaceAnalyticsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeaderWrapper header={<WorkspaceAnalyticsHeader />} />
    <AppPageWrapper>{children}</AppPageWrapper>
  </>
);

export default WorkspaceAnalyticsLayout;
