import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { ANALYTICS_V2_DURATION_FILTER_OPTIONS, PROJECT_CREATED_AT_FILTER_OPTIONS } from "@plane/constants";
import { TAnalyticsTabsV2Base } from "@plane/types";
import { CoreRootStore } from "./root.store";


type DurationType = typeof PROJECT_CREATED_AT_FILTER_OPTIONS[number]['value']

export interface IAnalyticsStoreV2 {
    //observables
    currentTab: TAnalyticsTabsV2Base
    selectedProject: string | null
    selectedDuration: DurationType,

    //computed
    selectedDurationLabel: string | null,

    //actions
    updateSelectedProject: (project: string) => void,
    updateSelectedDuration: (duration: DurationType) => void,
}

export class AnalyticsStoreV2 implements IAnalyticsStoreV2 {
    //observables
    currentTab: TAnalyticsTabsV2Base = "overview";
    selectedProject: string | null = null;
    selectedDuration: typeof ANALYTICS_V2_DURATION_FILTER_OPTIONS[number]['value'] = "today";

    constructor(_rootStore: CoreRootStore) {
        makeObservable(this, {
            // observables
            currentTab: observable,
            selectedDuration: observable,
            selectedProject: observable,
            // computed
            selectedProjectLabel: computed,
            selectedDurationLabel: computed,
            // actions
            updateSelectedProject: action,
            updateSelectedDuration: action
        })
    }

    get selectedProjectLabel() { // TODO: get the project label from the project id
        return "All Projects"
    }


    get selectedDurationLabel() {
        return PROJECT_CREATED_AT_FILTER_OPTIONS.find(item => item.value === this.selectedDuration)?.name ?? null
    }

    updateSelectedProject = (project: string) => {
        const initialState = this.selectedProject;
        try {
            runInAction(() => {
                this.selectedProject = project;
            })
        } catch (error) {
            console.error("Failed to update selected project");
            throw error;
        }
    }

    updateSelectedDuration = (duration: DurationType) => {
        const initialState = this.selectedDuration;
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