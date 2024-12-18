import clone from "lodash/clone";
import orderBy from "lodash/orderBy";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// helpers
import { convertToISODateString, getDate } from "@/helpers/date-time.helper";
import { satisfiesDateFilter } from "@/helpers/filter.helper";
// Plane-web
import { InitiativeService } from "@/plane-web/services/initiative.service";
import { TInitiativeFilters, TInitiativeGroupByOptions, TInitiativeOrderByOptions } from "@/plane-web/types/initiative";
import { TInitiativeReaction, TInitiative } from "@/plane-web/types/initiative/initiative";
//
import { RootStore } from "../root.store";
import { IInitiativeLinkStore, InitiativeLinkStore } from "./initiative-links.store";
import { IInitiativeCommentActivityStore, InitiativeCommentActivityStore } from "./initiatives-comment-activity.store";
import { IInitiativeFilterStore } from "./initiatives-filter.store";

export const ALL_INITIATIVES = "All Initiatives";

export interface IInitiativeStore {
  initiativesMap: Record<string, TInitiative> | undefined;
  initiativeLinks: IInitiativeLinkStore;
  initiativeCommentActivities: IInitiativeCommentActivityStore;

  currentGroupedInitiativeIds: { [key: string]: string[] } | undefined;

  getInitiativeById: (initiativeId: string) => TInitiative | undefined;

  fetchInitiatives: (workspaceSlug: string) => Promise<TInitiative[] | undefined>;
  fetchInitiativeAnalytics: (workspaceSlug: string, initiativeId: string) => Promise<any>;
  createInitiative: (workspaceSlug: string, payload: Partial<TInitiative>) => Promise<TInitiative | undefined>;
  fetchInitiativeDetails: (workspaceSlug: string, initiativeId: string) => Promise<TInitiative | undefined>;
  updateInitiative: (workspaceSlug: string, initiativeId: string, payload: Partial<TInitiative>) => Promise<void>;
  deleteInitiative: (workspaceSlug: string, initiativeId: string) => Promise<void>;

  addInitiativeReaction: (
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeReaction>
  ) => Promise<TInitiativeReaction>;
  deleteInitiativeReaction: (
    workspaceSlug: string,
    initiativeId: string,
    reactionId: string,
    reactionEmoji: string
  ) => Promise<void>;
}

export class InitiativeStore implements IInitiativeStore {
  initiativesMap: Record<string, TInitiative> | undefined = undefined;

  initiativeLinks: IInitiativeLinkStore;
  initiativeCommentActivities: IInitiativeCommentActivityStore;

  initiativeService: InitiativeService;
  rootStore: RootStore;
  initiativeFilterStore: IInitiativeFilterStore;

  constructor(_rootStore: RootStore, initiativeFilterStore: IInitiativeFilterStore) {
    makeObservable(this, {
      // observables
      initiativesMap: observable,
      // actions
      fetchInitiatives: action,
      fetchInitiativeAnalytics: action,
      createInitiative: action,
      fetchInitiativeDetails: action,
      updateInitiative: action,
      deleteInitiative: action,
      addInitiativeReaction: action,
      deleteInitiativeReaction: action,
    });

    this.rootStore = _rootStore;
    this.initiativeFilterStore = initiativeFilterStore;
    this.initiativeLinks = new InitiativeLinkStore(this);
    this.initiativeCommentActivities = new InitiativeCommentActivityStore(this);

    // services
    this.initiativeService = new InitiativeService();
  }

  get currentGroupedInitiativeIds() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return;

    return this.getGroupedInitiativeIds(workspaceSlug);
  }

  getGroupedInitiativeIds = computedFn((workspaceSlug: string) => {
    const workspace = this.rootStore.workspaceRoot.getWorkspaceBySlug(workspaceSlug);
    if (!workspace) return;

    const displayFilters = this.initiativeFilterStore.getInitiativeDisplayFilters(workspaceSlug);
    const filters = this.initiativeFilterStore.getInitiativeFilters(workspaceSlug);

    if (!displayFilters || !filters || !this.initiativesMap) return;

    const filteredInitiatives = Object.values(this.initiativesMap).filter((initiative) => {
      return initiative.workspace === workspace.id && shouldFilterInitiative(initiative, filters ?? {});
    });

    const sortedInitiatives = sortInitiativesWithOrderBy(filteredInitiatives, displayFilters?.order_by);

    return getGroupedInitiativeIds(sortedInitiatives, displayFilters.group_by);
  });

  getInitiativeById = computedFn((initiativeId: string) => {
    return this.initiativesMap?.[initiativeId];
  });

  fetchInitiatives = async (workspaceSlug: string): Promise<TInitiative[] | undefined> => {
    try {
      runInAction(() => {
        this.initiativesMap = undefined;
      });

      const response = await this.initiativeService.getInitiatives(workspaceSlug);

      runInAction(() => {
        this.initiativesMap = {};
        response.forEach((initiative) => {
          if (!initiative) return;

          this.initiativesMap![initiative.id] = initiative;
        });
      });

      return response;
    } catch (error) {
      console.error("error while fetching initiatives", error);
    }
    return;
  };

  createInitiative = async (workspaceSlug: string, payload: Partial<TInitiative>): Promise<TInitiative | undefined> => {
    try {
      const response = await this.initiativeService.createInitiative(workspaceSlug, payload);

      runInAction(() => {
        if (!response) return;

        if (!this.initiativesMap) this.initiativesMap = {};
        this.initiativesMap[response.id] = response;
      });

      return response;
    } catch (error) {
      console.error("error while creating initiative", error);
      throw error;
    }
  };

  fetchInitiativeDetails = async (workspaceSlug: string, initiativeId: string): Promise<TInitiative | undefined> => {
    try {
      const response = await this.initiativeService.getInitiative(workspaceSlug, initiativeId);

      runInAction(() => {
        if (!response) return;
        if (!this.initiativesMap) this.initiativesMap = {};
        this.initiativesMap[response.id] = response;
      });

      this.initiativeLinks.fetchInitiativeLinks(workspaceSlug, initiativeId);
      this.initiativeCommentActivities.fetchInitiativeComments(workspaceSlug, initiativeId);
      this.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId);
      return response;
    } catch (error) {
      console.error("error while fetching initiative details", error);
    }
  };

  fetchInitiativeAnalytics = async (workspaceSlug: string, initiativeId: string): Promise<any> => {
    try {
      const response = await this.initiativeService.fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      return response;
    } catch (error) {
      console.error("error while fetching initiative analytics", error);
    }
  };

  updateInitiative = async (
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiative>
  ): Promise<void> => {
    const preUpdateInitiative = clone(this.initiativesMap?.[initiativeId]);
    try {
      runInAction(() => {
        if (this.initiativesMap?.[initiativeId]) {
          this.initiativesMap[initiativeId] = { ...this.initiativesMap[initiativeId], ...payload };
        }
      });

      await this.initiativeService.updateInitiative(workspaceSlug, initiativeId, payload);

      return;
    } catch (error) {
      runInAction(() => {
        if (this.initiativesMap?.[initiativeId] && preUpdateInitiative) {
          this.initiativesMap[initiativeId] = { ...preUpdateInitiative };
        }
      });
      console.error("error while updating initiative", error);
      throw error;
    }
  };

  deleteInitiative = async (workspaceSlug: string, initiativeId: string): Promise<void> => {
    try {
      const response = await this.initiativeService.deleteInitiative(workspaceSlug, initiativeId);

      if (!this.initiativesMap?.[initiativeId]) return;

      runInAction(() => {
        delete this.initiativesMap?.[initiativeId];
      });
    } catch (error) {
      console.error("error while updating initiative", error);
      throw error;
    }
  };

  addInitiativeReaction = async (
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeReaction>
  ): Promise<TInitiativeReaction> => {
    try {
      const response = await this.initiativeService.createInitiativeReaction(workspaceSlug, initiativeId, payload);

      runInAction(() => {
        if (!this.initiativesMap?.[initiativeId]) return;

        if (!this.initiativesMap[initiativeId].reactions || !Array.isArray(this.initiativesMap[initiativeId].reactions))
          this.initiativesMap[initiativeId].reactions = [];

        this.initiativesMap[initiativeId].reactions!.push(response);
      });
      return response;
    } catch (e) {
      console.error("error while adding reaction to initiative", e);
      throw e;
    }
  };

  deleteInitiativeReaction = async (
    workspaceSlug: string,
    initiativeId: string,
    reactionId: string,
    reactionEmoji: string
  ): Promise<void> => {
    try {
      const response = await this.initiativeService.deleteInitiativeReaction(
        workspaceSlug,
        initiativeId,
        reactionEmoji
      );

      runInAction(() => {
        if (!this.initiativesMap?.[initiativeId]) return;

        if (!this.initiativesMap[initiativeId].reactions || !Array.isArray(this.initiativesMap[initiativeId].reactions))
          return;

        update(this.initiativesMap[initiativeId], "reactions", (reactions: TInitiativeReaction[]) => {
          return reactions.filter((reaction) => reaction.id !== reactionId);
        });
      });
      return response;
    } catch (e) {
      console.error("error while adding reaction to initiative", e);
      throw e;
    }
  };
}

export const shouldFilterInitiative = (initiative: TInitiative, filters: TInitiativeFilters): boolean => {
  let fallsInFilters = true;
  Object.keys(filters).forEach((key) => {
    const filterKey = key as keyof TInitiativeFilters;
    if (filterKey === "lead" && filters.lead && filters.lead.length > 0)
      fallsInFilters = fallsInFilters && filters.lead.includes(`${initiative.lead}`);
    if (filterKey === "start_date" && filters.start_date && filters.start_date.length > 0) {
      const startDate = getDate(initiative.start_date);
      filters.start_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!startDate && satisfiesDateFilter(startDate, dateFilter);
      });
    }
    if (filterKey === "target_date" && filters.target_date && filters.target_date.length > 0) {
      const endDate = getDate(initiative.end_date);
      filters.target_date.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!endDate && satisfiesDateFilter(endDate, dateFilter);
      });
    }
  });

  return fallsInFilters;
};

const sortInitiativesWithOrderBy = (
  initiatives: TInitiative[],
  key: TInitiativeOrderByOptions | undefined
): TInitiative[] => {
  const array = orderBy(initiatives, (initiative) => convertToISODateString(initiative["created_at"]), ["desc"]);

  switch (key) {
    case "sort_order":
      return orderBy(array, "sort_order");
    case "-created_at":
      return orderBy(array, (issue) => convertToISODateString(issue["created_at"]), ["desc"]);
    case "-updated_at":
      return orderBy(array, (initiative) => convertToISODateString(initiative["updated_at"] ?? undefined), ["desc"]);
    default:
      return array;
  }
};

const getGroupedInitiativeIds = (initiatives: TInitiative[], key: TInitiativeGroupByOptions | undefined) => {
  const groupedInitiativeIds: { [key: string]: string[] } = {};

  if (!key) return { [ALL_INITIATIVES]: initiatives.map((initiative) => initiative.id) };

  for (const initiative of initiatives) {
    const groupId = initiative[key] ?? "None";

    if (groupedInitiativeIds?.[groupId] !== undefined && Array.isArray(groupedInitiativeIds?.[groupId])) {
      groupedInitiativeIds?.[groupId]?.push(initiative.id);
    } else {
      groupedInitiativeIds[groupId] = [initiative.id];
    }
  }

  return groupedInitiativeIds;
};
