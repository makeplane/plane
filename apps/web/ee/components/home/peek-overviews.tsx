"use client";

import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { EpicPeekOverview } from "../epics";

export const HomePeekOverviewsRoot = () => (
  <>
    <IssuePeekOverview />
    <EpicPeekOverview />
  </>
);
