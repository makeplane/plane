/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { IWorkflowSidebarHelper, TWorkflowSidebarStep } from "@plane/types";
import { makeObservable, observable, action } from "mobx";

export class WorkflowSidebarHelper implements IWorkflowSidebarHelper {
  // observable
  selectedTab: TWorkflowSidebarStep | null;
  constructor() {
    makeObservable(this, {
      selectedTab: observable,
      selectTab: action,
      closeTab: action,
    });
    this.selectedTab = null;
  }

  selectTab = (tab: TWorkflowSidebarStep) => {
    this.selectedTab = tab;
  };

  closeTab = () => {
    this.selectedTab = null;
  };
}
