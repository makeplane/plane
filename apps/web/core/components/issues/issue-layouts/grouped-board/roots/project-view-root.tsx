/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// local imports
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseGroupedBoardRoot } from "../base-grouped-board-root";

export const ProjectViewGroupedBoardLayout = observer(function ProjectViewGroupedBoardLayout() {
  const { viewId } = useParams();

  return <BaseGroupedBoardRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
