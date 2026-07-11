/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// hooks
// constant
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseKanBanRoot } from "../base-kanban-root";
import { useParams } from "@/hooks/use-params";

export const ProjectViewKanBanLayout = observer(function ProjectViewKanBanLayout() {
  const { viewId } = useParams();

  return <BaseKanBanRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
