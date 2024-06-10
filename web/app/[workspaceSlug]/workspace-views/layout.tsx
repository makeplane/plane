import { AppHeader, ContentWrapper } from "@/components/core";
import GlobalIssuesHeader from "./header";

const GlobalIssuesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<GlobalIssuesHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default GlobalIssuesLayout;
