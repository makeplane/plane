"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import CyclesHeader from "./header";
import CyclesListMobileHeader from "./mobile-header";

const CyclesHeaderPage = () => (
  <AppHeaderWrapper header={<CyclesHeader />} mobileHeader={<CyclesListMobileHeader />} />
);

export default CyclesHeaderPage;
