"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import CycleIssuesHeader from "./header";
import CycleIssuesMobileHeader from "./mobile-header";

const CycleIssuesHeaderPage = () => (
  <AppHeaderWrapper header={<CycleIssuesHeader />} mobileHeader={<CycleIssuesMobileHeader />} />
);

export default CycleIssuesHeaderPage;
