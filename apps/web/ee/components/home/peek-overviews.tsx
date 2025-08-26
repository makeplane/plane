"use client";

// plane imports
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// plane web imports
import { EpicPeekOverview } from "@/plane-web/components/epics/peek-overview";

export const HomePeekOverviewsRoot = () => (
  <>
    <IssuePeekOverview />
    <EpicPeekOverview />
  </>
);
