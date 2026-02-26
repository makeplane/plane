/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// mobx store
// components
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ModuleSpreadsheetLayout = observer(function ModuleSpreadsheetLayout() {
  const { moduleId } = useParams();

  return <BaseSpreadsheetRoot QuickActions={ModuleIssueQuickActions} viewId={moduleId?.toString()} />;
});
