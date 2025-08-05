"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import IssueEditNotAllowedContextProvider from "@/components/issues/issue-detail/issue-edit-not-allowed-context";
import { ProjectIssueDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <IssueEditNotAllowedContextProvider>
      <AppHeader header={<ProjectIssueDetailsHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </IssueEditNotAllowedContextProvider>
  );
}
