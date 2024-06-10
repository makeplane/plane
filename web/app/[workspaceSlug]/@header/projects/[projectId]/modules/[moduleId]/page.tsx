"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import ModuleIssuesHeader from "./header";
import ModuleIssuesMobileHeader from "./mobile-header";

const ModuleIssuesHeaderPage = () => (
  <AppHeaderWrapper header={<ModuleIssuesHeader />} mobileHeader={<ModuleIssuesMobileHeader />} />
);

export default ModuleIssuesHeaderPage;
