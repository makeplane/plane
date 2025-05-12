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

  //computed
  selectedDurationLabel: DurationType | null;

  //actions
  updateSelectedProjects: (projects: string[]) => void;
  updateSelectedDuration: (duration: DurationType) => void;
}

export class AnalyticsStoreV2 implements IAnalyticsStoreV2 {
  //observables
  currentTab: TAnalyticsTabsV2Base = "overview";
  selectedProjects: DurationType[] = [];
  selectedDuration: DurationType = "last_30_days";

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      currentTab: observable.ref,
      selectedDuration: observable.ref,
      selectedProjects: observable.ref,
      // computed
      selectedDurationLabel: computed,
      // actions
      updateSelectedProjects: action,
      updateSelectedDuration: action,
    });
  }

  get selectedDurationLabel() {
    return ANALYTICS_V2_DURATION_FILTER_OPTIONS.find((item) => item.value === this.selectedDuration)?.name ?? null;
  }

  updateSelectedProjects = (projects: string[]) => {
    const initialState = this.selectedProjects;
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
}
