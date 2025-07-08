"use client";

import { IssuePeekOverview } from "@/components/issues";
import { EpicPeekOverview } from "../epics";

export const HomePeekOverviewsRoot = () => (
  <>
    <IssuePeekOverview />
    <EpicPeekOverview />
  </>
);
