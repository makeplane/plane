"use client";
import React, { FC } from "react";
// components
import { SidebarChart } from "./base";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

export const SidebarChartRoot: FC<Props> = (props) => <SidebarChart {...props} />;
