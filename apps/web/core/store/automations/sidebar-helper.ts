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

import { action, computed, makeObservable, observable } from "mobx";
// plane imports
import { EAutomationSidebarTab } from "@plane/types";
import type { IAutomationInstance } from "./automation";

type TSelectedSidebarConfig = {
  tab: EAutomationSidebarTab | null;
  mode: "create" | "view" | null;
};

export interface IAutomationDetailSidebarHelper {
  // properties
  selectedSidebarConfig: TSelectedSidebarConfig;
  // computed
  isPublishAlertOpen: boolean;
  // actions
  setSelectedSidebarConfig: (config: TSelectedSidebarConfig) => void;
  setIsPublishAlertOpen: (isOpen: boolean) => void;
}

export class AutomationDetailSidebarHelper implements IAutomationDetailSidebarHelper {
  // properties
  selectedSidebarConfig: IAutomationDetailSidebarHelper["selectedSidebarConfig"];
  _isPublishAlertOpen: IAutomationDetailSidebarHelper["isPublishAlertOpen"];
  // automation instance
  automation: IAutomationInstance;

  constructor(automation: IAutomationInstance) {
    // automation instance
    this.automation = automation;
    this.selectedSidebarConfig = {
      tab: EAutomationSidebarTab.TRIGGER,
      mode: "create",
    };
    this._isPublishAlertOpen = true;
    makeObservable(this, {
      // properties
      selectedSidebarConfig: observable,
      _isPublishAlertOpen: observable,
      // computed
      isPublishAlertOpen: computed,
      // actions
      setSelectedSidebarConfig: action,
      setIsPublishAlertOpen: action,
    });
  }

  get isPublishAlertOpen() {
    return (
      this._isPublishAlertOpen && this.automation.isTriggerNodeAvailable && this.automation.isAnyActionNodeAvailable
    );
  }

  // actions
  setSelectedSidebarConfig: IAutomationDetailSidebarHelper["setSelectedSidebarConfig"] = action((config) => {
    this.selectedSidebarConfig = config;
  });

  setIsPublishAlertOpen: IAutomationDetailSidebarHelper["setIsPublishAlertOpen"] = action((isOpen) => {
    this._isPublishAlertOpen = isOpen;
  });
}
