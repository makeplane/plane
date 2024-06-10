import { AppHeaderWrapper, AppPageWrapper } from "@/components/app";
import GlobalIssuesHeader from "./header";

const GlobalIssuesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeaderWrapper header={<GlobalIssuesHeader />} />
    <AppPageWrapper>{children}</AppPageWrapper>
  </>
);

export default GlobalIssuesLayout;
