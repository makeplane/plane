import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { ANALYTICS_V2_DURATION_FILTER_OPTIONS } from "@plane/constants";
import { TAnalyticsTabsV2Base } from "@plane/types";
import { CoreRootStore } from "./root.store";

type DurationType = (typeof ANALYTICS_V2_DURATION_FILTER_OPTIONS)[number]["value"];

export interface IAnalyticsStoreV2 {
  //observables
  currentTab: TAnalyticsTabsV2Base;
  selectedProjects: string[];
  selectedDuration: DurationType;
  selectedCycle: string;
  selectedModule: string;

  //computed
  selectedDurationLabel: DurationType | null;

  //actions
  updateSelectedProjects: (projects: string[]) => void;
  updateSelectedDuration: (duration: DurationType) => void;
  updateSelectedCycle: (cycle: string) => void;
  updateSelectedModule: (module: string) => void;
}

export class AnalyticsStoreV2 implements IAnalyticsStoreV2 {
  //observables
  currentTab: TAnalyticsTabsV2Base = "overview";
  selectedProjects: DurationType[] = [];
  selectedDuration: DurationType = "last_30_days";
  selectedCycle: string = "";
  selectedModule: string = "";

  constructor() {
    makeObservable(this, {
      // observables
      currentTab: observable.ref,
      selectedDuration: observable.ref,
      selectedProjects: observable.ref,
      selectedCycle: observable.ref,
      selectedModule: observable.ref,
      // computed
      selectedDurationLabel: computed,
      // actions
      updateSelectedProjects: action,
      updateSelectedDuration: action,
      updateSelectedCycle: action,
      updateSelectedModule: action,
    });
  }

  get selectedDurationLabel() {
    return ANALYTICS_V2_DURATION_FILTER_OPTIONS.find((item) => item.value === this.selectedDuration)?.name ?? null;
  }

  updateSelectedProjects = (projects: string[]) => {
    try {
      runInAction(() => {
        this.selectedProjects = projects;
      });
    } catch (error) {
      console.error("Failed to update selected project");
      throw error;
    }
  };

  updateSelectedDuration = (duration: DurationType) => {
    try {
      runInAction(() => {
        this.selectedDuration = duration;
      });
    } catch (error) {
      console.error("Failed to update selected duration");
      throw error;
    }
  };

  updateSelectedCycle = (cycle: string) => {
    runInAction(() => {
      this.selectedCycle = cycle;
    });
  };

  updateSelectedModule = (module: string) => {
    runInAction(() => {
      this.selectedModule = module;
    });
  };
}
