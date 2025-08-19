import { action, makeObservable, observable } from "mobx";
// plane imports
import { EAutomationSidebarTab } from "@plane/types";

type TSelectedSidebarConfig = {
  tab: EAutomationSidebarTab | null;
  mode: "create" | "view" | null;
};

export interface IAutomationDetailSidebarHelper {
  // properties
  selectedSidebarConfig: TSelectedSidebarConfig;
  isPublishAlertOpen: boolean;
  // actions
  setSelectedSidebarConfig: (config: TSelectedSidebarConfig) => void;
  setIsPublishAlertOpen: (isOpen: boolean) => void;
}

export class AutomationDetailSidebarHelper implements IAutomationDetailSidebarHelper {
  // properties
  selectedSidebarConfig: IAutomationDetailSidebarHelper["selectedSidebarConfig"];
  isPublishAlertOpen: IAutomationDetailSidebarHelper["isPublishAlertOpen"];

  constructor() {
    this.selectedSidebarConfig = {
      tab: null,
      mode: "create",
    };
    this.isPublishAlertOpen = true;
    makeObservable(this, {
      // properties
      selectedSidebarConfig: observable,
      isPublishAlertOpen: observable,
      // actions
      setSelectedSidebarConfig: action,
      setIsPublishAlertOpen: action,
    });
  }

  // actions
  setSelectedSidebarConfig: IAutomationDetailSidebarHelper["setSelectedSidebarConfig"] = action((config) => {
    this.selectedSidebarConfig = config;
  });

  setIsPublishAlertOpen: IAutomationDetailSidebarHelper["setIsPublishAlertOpen"] = action((isOpen) => {
    this.isPublishAlertOpen = isOpen;
  });
}
