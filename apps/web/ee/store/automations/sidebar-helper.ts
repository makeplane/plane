import { action, makeObservable, observable } from "mobx";
// plane imports
import { EAutomationSidebarTab } from "@plane/types";

type TSelectedSidebarConfig = {
  tab: EAutomationSidebarTab | null;
  mode: "create" | "view" | null;
};

export interface IAutomationSidebarHelper {
  // properties
  selectedSidebarConfig: TSelectedSidebarConfig;
  isPublishAlertOpen: boolean;
  // actions
  setSelectedSidebarConfig: (config: TSelectedSidebarConfig) => void;
  setIsPublishAlertOpen: (isOpen: boolean) => void;
}

export class AutomationSidebarHelper implements IAutomationSidebarHelper {
  // properties
  selectedSidebarConfig: IAutomationSidebarHelper["selectedSidebarConfig"];
  isPublishAlertOpen: IAutomationSidebarHelper["isPublishAlertOpen"];

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
  setSelectedSidebarConfig: IAutomationSidebarHelper["setSelectedSidebarConfig"] = action((config) => {
    this.selectedSidebarConfig = config;
  });

  setIsPublishAlertOpen: IAutomationSidebarHelper["setIsPublishAlertOpen"] = action((isOpen) => {
    this.isPublishAlertOpen = isOpen;
  });
}
