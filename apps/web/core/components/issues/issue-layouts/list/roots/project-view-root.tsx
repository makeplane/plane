/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// store
// constants
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseListRoot } from "../base-list-root";
import { useParams } from "react-router";

export const ProjectViewListLayout = observer(function ProjectViewListLayout() {
  const { viewId } = useParams();

  if (!viewId) return null;

  return <BaseListRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
