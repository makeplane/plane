import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { ANALYTICS_V2_DURATION_FILTER_OPTIONS, PROJECT_CREATED_AT_FILTER_OPTIONS } from "@plane/constants";
import { TAnalyticsTabsV2Base } from "@plane/types";
import { CoreRootStore } from "./root.store";


type DurationType = typeof PROJECT_CREATED_AT_FILTER_OPTIONS[number]['value']

export interface IAnalyticsStoreV2 {
    //observables
    currentTab: TAnalyticsTabsV2Base
    selectedProjects: string[]
    selectedDuration: DurationType,

    //computed
    selectedDurationLabel: string | null,

    //actions
    updateSelectedProjects: (projects: string[]) => void,
    updateSelectedDuration: (duration: DurationType) => void,
}

export class AnalyticsStoreV2 implements IAnalyticsStoreV2 {
    //observables
    currentTab: TAnalyticsTabsV2Base = "overview";
    selectedProjects: string[] = [];
    selectedDuration: typeof ANALYTICS_V2_DURATION_FILTER_OPTIONS[number]['value'] = "last_30_days";

    constructor(_rootStore: CoreRootStore) {
        makeObservable(this, {
            // observables
            currentTab: observable,
            selectedDuration: observable,
            selectedProjects: observable,
            // computed
            selectedDurationLabel: computed,
            // actions
            updateSelectedProjects: action,
            updateSelectedDuration: action
        })
    }

    get selectedDurationLabel() {
        return ANALYTICS_V2_DURATION_FILTER_OPTIONS.find(item => item.value === this.selectedDuration)?.name ?? null
    }

    updateSelectedProjects = (projects: string[]) => {
        const initialState = this.selectedProjects;
        try {
            runInAction(() => {
                this.selectedProjects = projects;
            })
        } catch (error) {
            console.error("Failed to update selected project");
            throw error;
        }
    }

    updateSelectedDuration = (duration: DurationType) => {
        try {
            runInAction(() => {
                this.selectedDuration = duration;
            })
        } catch (error) {
            console.error("Failed to update selected duration");
            throw error;
        }
    }
}