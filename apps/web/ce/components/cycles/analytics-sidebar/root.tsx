"use client";
// components
import { SidebarChart } from "./base";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

export const SidebarChartRoot: React.FC<Props> = (props) => <SidebarChart {...props} />;
