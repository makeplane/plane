/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
