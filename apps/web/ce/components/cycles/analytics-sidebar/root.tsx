import type { FC } from "react";
import React from "react";
// components
import { SidebarChart } from "./base";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

export function SidebarChartRoot(props: Props) {
  return <SidebarChart {...props} />;
}
