import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TEpicStats, TLoader } from "@plane/types";
import { InitiativeService } from "@/plane-web/services/initiative.service";
import { TInitiativeAnalytics } from "@/plane-web/types/initiative";
import { RootStore } from "../root.store";
import { IInitiativeEpicsFilterStore, InitiativeEpicsFilterStore } from "./initiative-epics-filter.store";
import { InitiativeStore } from "./initiatives.store";

export interface IInitiativeEpicStore {
  initiativeEpicLoader: Record<string, TLoader>;
  initiativeEpicsMap: Record<string, string[]>;

  // actions
  fetchInitiativeEpics: (workspaceSlug: string, initiativeId: string) => string[] | undefined;
  fetchInitiativeEpicsDetail: (workspaceSlug: string, initiativeId: string) => string[] | undefined;
  getInitiativeEpicsById: (initiativeId: string) => string[] | undefined;
  removeEpicFromInitiative: (workspaceSlug: string, initiativeId: string, epicId: string) => Promise<void>;
  addEpicsToInitiative: (workspaceSlug: string, initiativeId: string, epicIds: string[]) => Promise<void>;

  fetchInitiativeEpicStats: (workspaceSlug: string, initiativeId: string) => Promise<TEpicStats[] | undefined>;

  filters: IInitiativeEpicsFilterStore;
}

export class InitiativeEpicStore implements IInitiativeEpicStore {
  initiativeEpicLoader: Record<string, TLoader> = {};
  initiativeEpicsMap: Record<string, string[]> = {};

  initiativeStore: InitiativeStore;
  initiativeService: InitiativeService;
  rootStore: RootStore;
  filters: IInitiativeEpicsFilterStore;

  constructor(initiativeStore: InitiativeStore, service: InitiativeService) {
    makeObservable(this, {
      // observables
      initiativeEpicLoader: observable,
      initiativeEpicsMap: observable,
      // actions
      fetchInitiativeEpicStats: action,
      fetchInitiativeAnalytics: action,
      fetchInitiativeEpics: action,
      removeEpicFromInitiative: action,
      addEpicsToInitiative: action,
      fetchInitiativeEpicsDetail: action,
    });

    this.initiativeService = service;
    this.initiativeStore = initiativeStore;
    this.rootStore = initiativeStore.rootStore;
    this.filters = new InitiativeEpicsFilterStore(this);
  }

  /**
   * Get the epic ids for the initiative
   * @param initiativeId - The initiative id
   * @returns The epic ids
   */
  getInitiativeEpicsById = computedFn((initiativeId: string) => this.initiativeEpicsMap?.[initiativeId]);

  /**
   * Fetch the epic stats for the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The epic stats
   */
  fetchInitiativeEpicStats = async (workspaceSlug: string, initiativeId: string): Promise<TEpicStats[] | undefined> => {
    try {
      const response = await this.initiativeService.fetchInitiativeEpicStats(workspaceSlug, initiativeId);

      runInAction(() => {
        if (!response) return;

        if (!this.rootStore.epicAnalytics.epicStatsMap) this.rootStore.epicAnalytics.epicStatsMap = {};

        response.forEach((stats) => {
          if (!stats) return;

          this.rootStore.epicAnalytics.epicStatsMap![stats.epic_id] = stats;
        });
      });

      return response;
    } catch (error) {
      console.error("error while fetching initiatives stats", error);
      throw error;
    }
  };

  /**
   * Fetch the initiative analytics
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative analytics
   */
  fetchInitiativeAnalytics = async (
    workspaceSlug: string,
    initiativeId: string
  ): Promise<TInitiativeAnalytics | undefined> => {
    try {
      runInAction(() => {
        this.initiativeStore.initiativeAnalyticsLoader = {
          ...this.initiativeStore.initiativeAnalyticsLoader,
          [initiativeId]: "init-loader",
        };
      });

      const response = await this.initiativeService.fetchInitiativeAnalytics(workspaceSlug, initiativeId);

      runInAction(() => {
        if (response) {
          this.initiativeStore.initiativeAnalyticsMap[initiativeId] = response;
        }
        this.initiativeStore.initiativeAnalyticsLoader = {
          ...this.initiativeStore.initiativeAnalyticsLoader,
          [initiativeId]: "loaded",
        };
      });

      return response;
    } catch (error) {
      console.error("Error while fetching initiative analytics", error);
      runInAction(() => {
        this.initiativeStore.initiativeAnalyticsLoader = {
          ...this.initiativeStore.initiativeAnalyticsLoader,
          [initiativeId]: undefined,
        };
      });
      return undefined;
    }
  };

  /**
   * Fetch the initiative epics
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative epics
   */
  fetchInitiativeEpics = (workspaceSlug: string, initiativeId: string): string[] | undefined => {
    // Start the async operation
    this.fetchInitiativeEpicsAsync(workspaceSlug, initiativeId);
    // Return the current value synchronously
    return this.initiativeEpicsMap[initiativeId];
  };

  /**
   * Fetch the initiative epics detail
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative epics
   */
  fetchInitiativeEpicsDetail = (workspaceSlug: string, initiativeId: string): string[] | undefined => {
    // Start the async operation
    this.fetchInitiativeEpicsAsync(workspaceSlug, initiativeId, true);
    // Return the current value synchronously
    return this.initiativeEpicsMap[initiativeId];
  };

  /**
   * Fetch the initiative epics asynchronously
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative epics
   */
  private fetchInitiativeEpicsAsync = async (
    workspaceSlug: string,
    initiativeId: string,
    fetchDetail: boolean = false
  ) => {
    try {
      runInAction(() => {
        this.initiativeEpicLoader = {
          ...this.initiativeEpicLoader,
          [initiativeId]: "init-loader",
        };
      });

      // fetch the initiative epics
      let response;
      if (fetchDetail) {
        const detailResponse = await this.initiativeService.fetchInitiativeEpicsDetail(workspaceSlug, initiativeId, {
          expand: "issue_relation,issue_related",
        });
        response = detailResponse.results;
      } else {
        response = await this.initiativeService.fetchInitiativeEpics(workspaceSlug, initiativeId);
      }

      const transformedResponse = response.map((epic) => ({
        ...epic,
        is_epic: true,
      }));

      const responseIds = transformedResponse.map((epic) => epic.id);

      this.rootStore.issue.issues.addIssue(transformedResponse);

      runInAction(() => {
        if (transformedResponse) {
          this.initiativeEpicsMap[initiativeId] = responseIds;
        }
        this.initiativeEpicLoader = {
          ...this.initiativeEpicLoader,
          [initiativeId]: "loaded",
        };
      });

      if (fetchDetail) this.rootStore.issue.issueDetail.relation.extractRelationsFromIssues(transformedResponse);

      this.fetchInitiativeEpicStats(workspaceSlug, initiativeId);
      return responseIds;
    } catch (error) {
      console.error("Error while fetching initiative epics", error);
      runInAction(() => {
        this.initiativeEpicLoader = {
          ...this.initiativeEpicLoader,
          [initiativeId]: undefined,
        };
      });
      return undefined;
    }
  };

  /**
   * Remove the epic from the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @param epicId - The epic id
   */
  removeEpicFromInitiative = async (workspaceSlug: string, initiativeId: string, epicId: string): Promise<void> => {
    try {
      await this.initiativeService.removeEpicsFromInitiative(workspaceSlug, initiativeId, epicId);

      runInAction(() => {
        if (this.initiativeEpicsMap?.[initiativeId]) {
          this.initiativeEpicsMap[initiativeId] = this.initiativeEpicsMap[initiativeId].filter((id) => id !== epicId);
        }
      });
      this.fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId);
    } catch (error) {
      console.error("error while removing epic from initiative", error);
    }
  };

  /**
   * Add the epic to the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @param epicIds - The epic ids
   */
  addEpicsToInitiative = async (workspaceSlug: string, initiativeId: string, epicIds: string[]): Promise<void> => {
    try {
      const response = await this.initiativeService.addEpicsToInitiative(workspaceSlug, initiativeId, epicIds);

      const transformedResponse = response.map((epic) => ({
        ...epic,
        is_epic: true,
      }));

      const responseIds = transformedResponse.map((epic) => epic.id);

      this.rootStore.issue.issues.addIssue(transformedResponse);

      runInAction(() => {
        set(this.initiativeEpicsMap, [initiativeId], responseIds);
      });

      try {
        await Promise.all([
          this.fetchInitiativeEpics(workspaceSlug, initiativeId),
          this.fetchInitiativeAnalytics(workspaceSlug, initiativeId),
          this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId),
        ]);
      } catch (error) {
        console.error("Error fetching initiative stats or analytics:", error);
        // Not throwing here since the main operation (adding epics) was successful
      }
    } catch (error) {
      console.error("Error adding epics to initiative", error);
      throw error;
    }
  };
}
