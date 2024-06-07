"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import ModulesListHeader from "./header";
import ModulesListMobileHeader from "./mobile-header";

const ModulesHeaderPage = () => (
  <AppHeaderWrapper header={<ModulesListHeader />} mobileHeader={<ModulesListMobileHeader />} />
);

export default ModulesHeaderPage;
