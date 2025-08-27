import { action, computed, makeObservable, observable } from "mobx";
// plane imports
import { EAutomationSidebarTab } from "@plane/types";
import { IAutomationInstance } from "./automation";

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
