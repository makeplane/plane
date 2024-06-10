import { AppHeader, ContentWrapper } from "@/components/core";
import WorkspaceAnalyticsHeader from "./header";

const WorkspaceAnalyticsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<WorkspaceAnalyticsHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default WorkspaceAnalyticsLayout;
