"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
// constants
import { EIssuesStoreType } from "@/constants/issue";
// local components
import { ProjectIssuesMobileHeader as EpicsMobileHeader } from "../../issues/(list)/mobile-header";
import { EpicsHeader } from "./header";

export default function ProjectEpicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader
        header={<EpicsHeader />}
        mobileHeader={<EpicsMobileHeader storeType={EIssuesStoreType.EPIC} showAnalytics={false} />}
      />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
