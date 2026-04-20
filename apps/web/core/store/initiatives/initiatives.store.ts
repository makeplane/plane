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

import { clone, isEmpty, update } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";

// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { TEpicStats, TInitiativeLabel, TLoader } from "@plane/types";
// utils
import { getGroupedInitiativeIds, sortInitiativesWithOrderBy } from "@/components/initiatives/utils";
// plane-web imports
import { InitiativeLabelsService } from "@/services/initiative-labels.service";
import { InitiativeService } from "@/services/initiative.service";
import type {
  TExternalInitiativeFilterExpression,
  TInitiative,
  TInitiativeAnalytics,
  TInitiativeReaction,
  TInitiativeStats,
} from "@/types/initiative";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { RootStore } from "../../../ee/store/root.store";

// local imports
import type { IInitiativeAttachmentStore } from "./initiative-attachment.store";
import { InitiativeAttachmentStore } from "./initiative-attachment.store";
import type { IInitiativeLinkStore } from "./initiative-links.store";
import { InitiativeLinkStore } from "./initiative-links.store";
import { InitiativeScopeStore } from "./initiative-scope.store";
import type { IInitiativeCommentActivityStore } from "./initiatives-comment-activity.store";
import { InitiativeCommentActivityStore } from "./initiatives-comment-activity.store";
import type { IInitiativeFilterStore } from "./initiatives-filter.store";
import type { IUpdateStore } from "@/store/work-items/epic/updates/base.store";
import { UpdateStore } from "@/store/work-items/epic/updates/base.store";
import { InitiativePermissionsInstance } from "./permissions/root";
import type { InitiativePermissions } from "./permissions/root";

export const ALL_INITIATIVES = "All Initiatives";

type InitiativeCollapsible = "links" | "attachments" | "projects" | "epics";

export type TPeekInitiative = {
  workspaceSlug: string;
  initiativeId: string;
};

export interface IInitiativeStore {
  initiativesMap: Record<string, TInitiative> | undefined;
  filteredInitiativesMap: Record<string, TInitiative> | undefined;
  filteredInitiativesIds: string[];
  initiativeIds: string[] | undefined;
  archivedInitiativeIds: string[] | undefined;

  initiativesStatsMap: Record<string, TInitiativeStats> | undefined;
  initiativeLabelsMap: Map<string, Map<string, TInitiativeLabel>>;
  initiativeAnalyticsMap: Record<string, TInitiativeAnalytics>;
  initiativeTimelineItems: Record<string, TInitiative & { target_date?: string | null }>;

  initiativeLinks: IInitiativeLinkStore;
  initiativeCommentActivities: IInitiativeCommentActivityStore;
  initiativeAttachments: IInitiativeAttachmentStore;
  initiativeAnalyticsLoader: Record<string, TLoader>;
  initiativesLoader: boolean;
  isAnyModalOpen: boolean;
  isProjectsModalOpen: boolean;
  isEpicModalOpen: boolean;
  isAttachmentDeleteModalOpen: boolean;
  updatesStore: IUpdateStore;
  isInitiativeModalOpen: string | null;
  fetchingFilteredInitiatives: boolean;
  peekInitiative: TPeekInitiative | undefined;
  initiativeLabelsService: InitiativeLabelsService;

  openCollapsibleSection: InitiativeCollapsible[];
  lastCollapsibleAction: InitiativeCollapsible | null;

  setOpenCollapsibleSection: (section: InitiativeCollapsible[]) => void;
  setLastCollapsibleAction: (section: InitiativeCollapsible) => void;
  toggleOpenCollapsibleSection: (section: InitiativeCollapsible) => void;
  toggleProjectsModal: (value?: boolean) => void;
  toggleEpicModal: (value?: boolean, initiativeContext?: TPeekInitiative) => Promise<void>;
  toggleDeleteAttachmentModal: (value?: boolean) => void;
  toggleInitiativeModal: (value?: string | null) => void;
  setPeekInitiative: (peekInitiative: TPeekInitiative | undefined) => void;
  getIsInitiativePeeked: (initiativeId: string) => boolean;

  currentGroupedFilteredInitiativeIds: Record<string, string[]> | undefined;
  isInitiativesFeatureEnabled: boolean;

  initFilteredInitiatives: (workspaceSlug: string, isArchived?: boolean) => Promise<void>;

  getInitiativeById: (initiativeId: string) => TInitiative | undefined;
  getInitiativesLabels: (workspaceSlug: string) => Map<string, TInitiativeLabel> | undefined;
  getInitiativeStatsById: (initiativeId: string) => TInitiativeStats | undefined;
  getInitiativeAnalyticsById: (initiativeId: string) => TInitiativeAnalytics | undefined;

  fetchInitiatives: (
    workspaceSlug: string,
    filters?: TExternalInitiativeFilterExpression,
    isArchived?: boolean
  ) => Promise<TInitiative[] | undefined>;
  fetchInitiativesStats: (workspaceSlug: string) => Promise<TInitiativeStats[] | undefined>;
  fetchInitiativeAnalytics: (workspaceSlug: string, initiativeId: string) => Promise<TInitiativeAnalytics | undefined>;
  fetchInitiativeLabels: (workspaceSlug: string) => Promise<TInitiativeLabel[] | undefined>;
  fetchInitiativeDetails: (workspaceSlug: string, initiativeId: string) => Promise<TInitiative | undefined>;
  fetchFilteredInitiatives: (
    workspaceSlug: string,
    filters?: TExternalInitiativeFilterExpression,
    isArchived?: boolean
  ) => Promise<TInitiative[] | undefined>;

  createInitiative: (workspaceSlug: string, payload: Partial<TInitiative>) => Promise<TInitiative | undefined>;
  updateInitiative: (workspaceSlug: string, initiativeId: string, payload: Partial<TInitiative>) => Promise<void>;
  deleteInitiative: (workspaceSlug: string, initiativeId: string) => Promise<void>;
  archiveInitiative: (workspaceSlug: string, initiativeId: string) => Promise<void>;
  restoreInitiative: (workspaceSlug: string, initiativeId: string) => Promise<void>;

  // labels
  createInitiativeLabel: (workspaceSlug: string, data: Partial<TInitiativeLabel>) => Promise<TInitiativeLabel>;
  updateInitiativeLabel: (
    workspaceSlug: string,
    labelId: string,
    data: Partial<TInitiativeLabel>
  ) => Promise<TInitiativeLabel | undefined>;
  updateInitiativeLabelPosition: (
    workspaceSlug: string,
    draggingLabelId: string,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => Promise<TInitiativeLabel | undefined>;
  deleteInitiativeLabel: (workspaceSlug: string, labelId: string) => Promise<void>;

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

  // store
  scope: InitiativeScopeStore;
  // permissions
  permissions: InitiativePermissions;
}

export class InitiativeStore implements IInitiativeStore {
  initiativesMap: Record<string, TInitiative> | undefined = undefined;
  initiativesStatsMap: Record<string, TInitiativeStats> | undefined = undefined;
  initiativeAnalyticsLoader: Record<string, TLoader> = {};
  initiativeAnalyticsMap: Record<string, TInitiativeAnalytics> = {};
  initiativeLabelsMap: Map<string, Map<string, TInitiativeLabel>> = new Map();

  filteredInitiativesIds: string[] = [];
  fetchingFilteredInitiatives: boolean = true;

  initiativesLoader: boolean = false;
  isInitiativeModalOpen: string | null = null;
  peekInitiative: TPeekInitiative | undefined = undefined;
  isProjectsModalOpen: boolean = false;
  isEpicModalOpen: boolean = false;
  isAttachmentDeleteModalOpen: boolean = false;
  openCollapsibleSection: InitiativeCollapsible[] = ["projects", "epics"];
  lastCollapsibleAction: InitiativeCollapsible | null = null;

  initiativeLinks: IInitiativeLinkStore;
  initiativeCommentActivities: IInitiativeCommentActivityStore;
  initiativeAttachments: IInitiativeAttachmentStore;

  initiativeService: InitiativeService;
  initiativeLabelsService: InitiativeLabelsService;

  rootStore: RootStore;
  initiativeFilterStore: IInitiativeFilterStore;
  updatesStore: IUpdateStore;
  scope: InitiativeScopeStore;
  permissions: InitiativePermissions;

  constructor(_rootStore: RootStore, initiativeFilterStore: IInitiativeFilterStore) {
    makeObservable(this, {
      // observables
      filteredInitiativesIds: observable,
      initiativesMap: observable,
      fetchingFilteredInitiatives: observable,
      initiativesStatsMap: observable,
      initiativeAnalyticsLoader: observable,
      initiativeAnalyticsMap: observable,
      initiativeLabelsMap: observable,
      isInitiativeModalOpen: observable,
      isAttachmentDeleteModalOpen: observable.ref,
      isProjectsModalOpen: observable.ref,
      isEpicModalOpen: observable.ref,
      isAnyModalOpen: computed,
      peekInitiative: observable,

      openCollapsibleSection: observable.ref,
      lastCollapsibleAction: observable.ref,
      initiativesLoader: observable,

      // actions
      fetchInitiatives: action,
      fetchFilteredInitiatives: action,
      fetchInitiativesStats: action,
      fetchInitiativeAnalytics: action,
      fetchInitiativeDetails: action,

      createInitiative: action,
      updateInitiative: action,
      deleteInitiative: action,
      archiveInitiative: action,

      addInitiativeReaction: action,
      deleteInitiativeReaction: action,

      fetchInitiativeLabels: action,
      createInitiativeLabel: action,
      updateInitiativeLabel: action,
      deleteInitiativeLabel: action,

      setOpenCollapsibleSection: action,
      toggleOpenCollapsibleSection: action,
      setLastCollapsibleAction: action,
      toggleInitiativeModal: action,
      setPeekInitiative: action,
    });

    this.rootStore = _rootStore;
    this.initiativeFilterStore = initiativeFilterStore;
    this.initiativeLinks = new InitiativeLinkStore(this);
    this.initiativeCommentActivities = new InitiativeCommentActivityStore(this);
    this.initiativeAttachments = new InitiativeAttachmentStore(this);
    this.updatesStore = new UpdateStore();

    // services
    this.initiativeService = new InitiativeService();
    this.initiativeLabelsService = new InitiativeLabelsService();
    this.scope = new InitiativeScopeStore(this.rootStore, this.initiativeService);

    // permissions
    this.permissions = new InitiativePermissionsInstance({
      can: this.rootStore.permissionAccessStore.can,
      getAttachmentConditionContext: this.getAttachmentConditionContextById.bind(this),
      getCommentConditionContext: this.getCommentConditionContextById.bind(this),
    });
  }

  get isAnyModalOpen() {
    return Boolean(
      this.initiativeLinks.isLinkModalOpen ||
      this.isInitiativeModalOpen ||
      this.isProjectsModalOpen ||
      this.isEpicModalOpen ||
      this.isAttachmentDeleteModalOpen
    );
  }

  get initiativeTimelineItems() {
    const filteredInitiativesMap = this.filteredInitiativesMap;
    if (!filteredInitiativesMap) return {};
    const timelineItemsWithDates: Record<string, TInitiative & { target_date?: string | null }> = {};
    Object.values(filteredInitiativesMap).forEach((initiative) => {
      timelineItemsWithDates[initiative.id] = {
        ...initiative,
        target_date: initiative.end_date,
      };
    });
    return timelineItemsWithDates;
  }

  get currentGroupedFilteredInitiativeIds() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) return;
    return this.getGroupedInitiativeIds(workspaceSlug);
  }

  get isInitiativesFeatureEnabled() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) return false;
    return (
      this.rootStore.workspaceFeatures.isWorkspaceFeatureEnabled(
        workspaceSlug,
        EWorkspaceFeatures.IS_INITIATIVES_ENABLED
      ) && this.rootStore.featureFlags.flags?.[workspaceSlug]?.[E_FEATURE_FLAGS.INITIATIVES]
    );
  }

  get initiativeIds() {
    return Object.values(this.initiativesMap ?? {})
      .filter((initiative) => !initiative.archived_at)
      .map((initiative) => initiative.id);
  }

  get archivedInitiativeIds() {
    return Object.values(this.initiativesMap ?? {})
      .filter((initiative) => initiative.archived_at)
      .map((initiative) => initiative.id);
  }

  get filteredInitiativesMap() {
    const filteredMap: Record<string, TInitiative> = {};
    this.filteredInitiativesIds.forEach((initiativeId: string) => {
      const initiative = this.initiativesMap?.[initiativeId];
      if (initiative) {
        filteredMap[initiativeId] = initiative;
      }
    });
    return isEmpty(filteredMap) ? undefined : filteredMap;
  }

  initFilteredInitiatives = async (workspaceSlug: string, isArchived = false) => {
    await this.initiativeFilterStore.initInitiativeFilters(workspaceSlug, isArchived);
    const filters = this.initiativeFilterStore.getInitiativeFilters(workspaceSlug);
    await this.fetchFilteredInitiatives(workspaceSlug, filters, isArchived);
  };

  getGroupedInitiativeIds = computedFn((workspaceSlug: string) => {
    const workspace = this.rootStore.workspaceRoot.getWorkspaceBySlug(workspaceSlug);
    if (!workspace) return;

    const displayFilters = this.initiativeFilterStore.getInitiativeDisplayFilters(workspaceSlug);
    const filters = this.initiativeFilterStore.getInitiativeFilters(workspaceSlug);

    if (!displayFilters || !filters) return;

    if (!this.filteredInitiativesMap) return;

    const initiativesArray = Object.values(this.filteredInitiativesMap);
    const sortedInitiatives = sortInitiativesWithOrderBy(initiativesArray, displayFilters?.order_by);

    return getGroupedInitiativeIds(sortedInitiatives, displayFilters.group_by);
  });

  getInitiativeById = computedFn((initiativeId: string) => this.initiativesMap?.[initiativeId]);

  getInitiativeStatsById = computedFn((initiativeId: string) => this.initiativesStatsMap?.[initiativeId]);

  getInitiativeAnalyticsById = computedFn((initiativeId: string) => this.initiativeAnalyticsMap[initiativeId]);

  getInitiativesLabels = computedFn((workspaceSlug: string) => this.initiativeLabelsMap.get(workspaceSlug));

  setOpenCollapsibleSection = (section: InitiativeCollapsible[]) => {
    this.openCollapsibleSection = section;
    if (this.lastCollapsibleAction) this.lastCollapsibleAction = null;
  };

  setLastCollapsibleAction = (section: InitiativeCollapsible) => {
    this.openCollapsibleSection = [...this.openCollapsibleSection, section];
  };

  toggleOpenCollapsibleSection = (section: InitiativeCollapsible) => {
    if (this.openCollapsibleSection && this.openCollapsibleSection.includes(section)) {
      this.openCollapsibleSection = this.openCollapsibleSection.filter((s) => s !== section);
    } else {
      this.openCollapsibleSection = [...this.openCollapsibleSection, section];
    }
  };

  /**
   * When merging list response into the map, preserve detail-only fields (e.g. epic_ids)
   * from the existing entry if the list item doesn't have them. Avoids losing selection
   * when list fetch completes after detail fetch on refresh.
   */
  private mergeInitiativeFromList(
    map: Record<string, TInitiative>,
    initiative: TInitiative,
    existingMap: Record<string, TInitiative> | undefined
  ): void {
    const existing = existingMap?.[initiative.id];
    if (!existing) {
      map[initiative.id] = initiative;
      return;
    }
    map[initiative.id] = {
      ...initiative,
      // Preserve detail-only fields from the cached entry when the list response
      // omits them (list fetch can arrive after a detail fetch on refresh).
      epic_ids: initiative.epic_ids?.length ? initiative.epic_ids : existing.epic_ids,
      project_ids: initiative.project_ids?.length ? initiative.project_ids : existing.project_ids,
    };
  }

  fetchInitiatives = async (
    workspaceSlug: string,
    filters?: TExternalInitiativeFilterExpression
  ): Promise<TInitiative[] | undefined> => {
    try {
      runInAction(() => {
        this.initiativesLoader = true;
      });

      const response = await this.initiativeService.getInitiatives(workspaceSlug, filters);

      runInAction(() => {
        const existingMap = this.initiativesMap;
        this.initiativesMap = {};
        response.forEach((initiative) => {
          if (!initiative) return;
          this.mergeInitiativeFromList(this.initiativesMap!, initiative, existingMap);
        });
        this.initiativesLoader = false;
      });

      void this.fetchInitiativesStats(workspaceSlug);
      return response;
    } catch (error) {
      console.error("error while fetching initiatives", error);
    } finally {
      runInAction(() => {
        this.initiativesLoader = false;
      });
    }
    return;
  };

  fetchFilteredInitiatives = async (
    workspaceSlug: string,
    filters?: TExternalInitiativeFilterExpression,
    isArchived = false
  ): Promise<TInitiative[] | undefined> => {
    try {
      runInAction(() => {
        this.fetchingFilteredInitiatives = true;
        this.filteredInitiativesIds = [];
      });

      const response = isArchived
        ? await this.initiativeService.getArchivedInitiatives(workspaceSlug, filters)
        : await this.initiativeService.getInitiatives(workspaceSlug, filters);
      runInAction(() => {
        response.forEach((initiative) => {
          if (!initiative) return;
          this.initiativesMap![initiative.id] = initiative;
          this.filteredInitiativesIds.push(initiative.id);
        });
      });

      return response;
    } catch (error) {
      console.error("error while fetching filtered initiative ids", error);
    } finally {
      runInAction(() => {
        this.fetchingFilteredInitiatives = false;
      });
    }
  };

  fetchInitiativesStats = async (workspaceSlug: string): Promise<TInitiativeStats[] | undefined> => {
    try {
      runInAction(() => {
        this.initiativesStatsMap = undefined;
      });

      const response = await this.initiativeService.fetchInitiativesStats(workspaceSlug);

      runInAction(() => {
        this.initiativesStatsMap = {};
        response.forEach((stats) => {
          if (!stats) return;

          this.initiativesStatsMap![stats.initiative_id] = stats;
        });
      });

      return response;
    } catch (error) {
      console.error("error while fetching initiatives stats", error);
    }
  };

  fetchInitiativeEpicStats = async (workspaceSlug: string, initiativeId: string): Promise<TEpicStats[] | undefined> => {
    try {
      const response = await this.initiativeService.fetchInitiativeEpicStats(workspaceSlug, initiativeId);

      runInAction(() => {
        if (!response) return;

        if (!this.rootStore.epicAnalytics.epicStatsMap) this.rootStore.epicAnalytics.epicStatsMap = {};

        response.forEach((stats) => {
          if (!stats) return;

          this.rootStore.epicAnalytics.epicStatsMap[stats.epic_id] = stats;
        });
      });

      return response;
    } catch (error) {
      console.error("error while fetching initiatives stats", error);
      throw error;
    }
  };

  createInitiative = async (workspaceSlug: string, payload: Partial<TInitiative>): Promise<TInitiative | undefined> => {
    try {
      const response = await this.initiativeService.createInitiative(workspaceSlug, payload);

      runInAction(() => {
        if (!response) return;

        if (!this.initiativesMap) this.initiativesMap = {};
        this.initiativesMap[response.id] = response;

        this.filteredInitiativesIds.push(response.id);
      });

      this.fetchInitiativesStats(workspaceSlug);
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

      if (response?.epic_ids?.length) {
        await this.scope.epics.fetchInitiativeEpicsDetail(workspaceSlug, initiativeId);
      }

      this.initiativeLinks.fetchInitiativeLinks(workspaceSlug, initiativeId);
      this.initiativeAttachments.fetchAttachments(workspaceSlug, initiativeId);
      this.fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      this.initiativeCommentActivities.fetchInitiativeComments(workspaceSlug, initiativeId);
      this.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId);
      return response;
    } catch (error) {
      console.error("error while fetching initiative details", error);
      throw error;
    }
  };

  fetchInitiativeAnalytics = async (
    workspaceSlug: string,
    initiativeId: string
  ): Promise<TInitiativeAnalytics | undefined> => {
    try {
      runInAction(() => {
        this.initiativeAnalyticsLoader = {
          ...this.initiativeAnalyticsLoader,
          [initiativeId]: "init-loader",
        };
      });

      const response = await this.initiativeService.fetchInitiativeAnalytics(workspaceSlug, initiativeId);

      runInAction(() => {
        if (response) {
          this.initiativeAnalyticsMap[initiativeId] = response;
        }
        this.initiativeAnalyticsLoader = {
          ...this.initiativeAnalyticsLoader,
          [initiativeId]: "loaded",
        };
      });

      return response;
    } catch (error) {
      console.error("Error while fetching initiative analytics", error);
      runInAction(() => {
        this.initiativeAnalyticsLoader = {
          ...this.initiativeAnalyticsLoader,
          [initiativeId]: undefined,
        };
      });
      return undefined;
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
      this.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId);
      this.fetchInitiativeAnalytics(workspaceSlug, initiativeId);
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
      if (!this.initiativesMap?.[initiativeId]) return;

      runInAction(() => {
        delete this.initiativesMap?.[initiativeId];
        this.filteredInitiativesIds = this.filteredInitiativesIds.filter((id) => id !== initiativeId);
      });
      await this.initiativeService.deleteInitiative(workspaceSlug, initiativeId);
    } catch (error) {
      console.error("error while updating initiative", error);
      throw error;
    }
  };

  archiveInitiative = async (workspaceSlug: string, initiativeId: string): Promise<void> => {
    try {
      if (!this.initiativesMap?.[initiativeId]) return;

      const response = await this.initiativeService.archiveInitiative(workspaceSlug, initiativeId);
      runInAction(() => {
        this.initiativesMap![initiativeId] = { ...this.initiativesMap![initiativeId], ...response };
        this.filteredInitiativesIds = this.filteredInitiativesIds.filter((id) => id !== initiativeId);
      });
    } catch (error) {
      console.error("error while archiving initiative", error);
      throw error;
    }
  };

  restoreInitiative = async (workspaceSlug: string, initiativeId: string): Promise<void> => {
    try {
      if (!this.initiativesMap?.[initiativeId]) return;

      await this.initiativeService.restoreInitiative(workspaceSlug, initiativeId);
      runInAction(() => {
        this.initiativesMap![initiativeId] = { ...this.initiativesMap![initiativeId], archived_at: null };
        this.filteredInitiativesIds = this.filteredInitiativesIds.filter((id) => id !== initiativeId);
      });
    } catch (error) {
      console.error("error while restoring initiative", error);
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

        this.initiativesMap[initiativeId].reactions.push(response);
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

        update(this.initiativesMap[initiativeId], "reactions", (reactions: TInitiativeReaction[]) =>
          reactions.filter((reaction) => reaction.id !== reactionId)
        );
      });
      return response;
    } catch (e) {
      console.error("error while adding reaction to initiative", e);
      throw e;
    }
  };

  toggleInitiativeModal = (value?: string | null) => (this.isInitiativeModalOpen = value ?? null);
  toggleProjectsModal = (value?: boolean) => (this.isProjectsModalOpen = value ?? !this.isProjectsModalOpen);
  toggleEpicModal = async (value?: boolean, initiativeContext?: TPeekInitiative) => {
    if (value === false) {
      runInAction(() => {
        this.isEpicModalOpen = false;
      });
      return;
    }

    if (initiativeContext) {
      await this.scope.epics.fetchInitiativeEpicsDetail(
        initiativeContext.workspaceSlug,
        initiativeContext.initiativeId
      );
    }

    runInAction(() => {
      this.isEpicModalOpen = value ?? !this.isEpicModalOpen;
    });
  };

  toggleDeleteAttachmentModal = (value?: boolean) =>
    (this.isAttachmentDeleteModalOpen = value ?? !this.isAttachmentDeleteModalOpen);
  setPeekInitiative = (peekInitiative: TPeekInitiative | undefined) => (this.peekInitiative = peekInitiative);

  getIsInitiativePeeked = (initiativeId: string) => this.peekInitiative?.initiativeId === initiativeId;

  // ---------------------------------------- Label Methods -----------------------------------------

  fetchInitiativeLabels = async (workspaceSlug: string) => {
    const response = await this.initiativeLabelsService.getInitiativeLabels(workspaceSlug);

    runInAction(() => {
      const sortetLabels = (response || []).sort((a, b) => a.sort_order - b.sort_order);
      this.initiativeLabelsMap.set(workspaceSlug, new Map(sortetLabels.map((label) => [label.id, label])));
    });
    return response;
  };

  /**
   * Creates a new initiative label and add it to the store
   * @param workspaceSlug
   * @param data
   * @returns Promise<TInitiativeLabel>
   */
  createInitiativeLabel = async (workspaceSlug: string, data: Partial<TInitiativeLabel>) =>
    await this.initiativeLabelsService.createInitiativeLabel(workspaceSlug, data).then((response) => {
      runInAction(() => {
        if (!this.initiativeLabelsMap.get(workspaceSlug)) {
          this.initiativeLabelsMap.set(workspaceSlug, new Map());
        }
        this.initiativeLabelsMap.get(workspaceSlug)?.set(response.id, response);
      });
      return response;
    });

  /**
   * Updates an initiative label and update it in the store
   * @param workspaceSlug
   * @param labelId
   * @param data
   * @returns Promise<TInitiativeLabel>
   */
  updateInitiativeLabel = async (workspaceSlug: string, labelId: string, data: Partial<TInitiativeLabel>) => {
    if (!this.initiativeLabelsMap.get(workspaceSlug)) return;

    const currInitiativelabels = this.initiativeLabelsMap.get(workspaceSlug);
    const currInitiativeSelectedLabel = currInitiativelabels?.get(labelId);

    if (!currInitiativeSelectedLabel) return;

    try {
      runInAction(() => {
        currInitiativelabels?.set(labelId, { ...currInitiativeSelectedLabel, ...data });
      });
      const response = await this.initiativeLabelsService.updateInitiativeLabel(workspaceSlug, labelId, data);
      return response;
    } catch (error) {
      console.log("Failed to update initiative label from store");
      runInAction(() => {
        currInitiativelabels?.set(labelId, currInitiativeSelectedLabel);
      });
      throw error;
    }
  };

  /**
   * Delete the initiative label and remove it from the labelMap object
   * @param workspaceSlug
   * @param labelId
   */
  deleteInitiativeLabel = async (workspaceSlug: string, labelId: string) => {
    const currInitiativelabels = this.initiativeLabelsMap.get(workspaceSlug);
    const currInitiativeSelectedLabel = currInitiativelabels?.get(labelId);
    if (!currInitiativeSelectedLabel) return;
    await this.initiativeLabelsService.deleteInitiativeLabel(workspaceSlug, labelId);
    runInAction(() => {
      currInitiativelabels?.delete(labelId);
    });
  };

  /**
   * Updates the sort order of an initiative label
   * @param workspaceSlug
   * @param draggingLabelId
   * @param droppedParentId
   * @param droppedLabelId
   * @param dropAtEndOfList
   */
  updateInitiativeLabelPosition = async (
    workspaceSlug: string,
    draggingLabelId: string,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    const currInitiativelabels = this.initiativeLabelsMap.get(workspaceSlug);
    const draggingLabel = currInitiativelabels?.get(draggingLabelId);

    if (!draggingLabel || !currInitiativelabels) return;

    const labelsArray = Array.from(currInitiativelabels.values()).sort((a, b) => a.sort_order - b.sort_order);
    const filteredLabels = labelsArray.filter((label) => label.id !== draggingLabelId);

    let targetIndex: number;

    if (dropAtEndOfList) {
      targetIndex = filteredLabels.length - 1;
    } else if (droppedLabelId) {
      const droppedLabelIndex = filteredLabels.findIndex((label) => label.id === droppedLabelId);
      targetIndex = droppedLabelIndex;
    } else {
      return;
    }

    let sortOrder: number = 65535;

    if (filteredLabels.length > 0) {
      let prevSortOrder: number | undefined, nextSortOrder: number | undefined;

      if (dropAtEndOfList) {
        prevSortOrder = filteredLabels[filteredLabels.length - 1].sort_order;
        nextSortOrder = undefined;
      } else {
        // Normal case: look at adjacent items
        if (typeof filteredLabels[targetIndex - 1] !== "undefined") {
          prevSortOrder = filteredLabels[targetIndex - 1].sort_order;
        }
        if (typeof filteredLabels[targetIndex] !== "undefined") {
          nextSortOrder = filteredLabels[targetIndex].sort_order;
        }
      }

      // Calculate sort order based on adjacent labels
      if (prevSortOrder && nextSortOrder) {
        sortOrder = (prevSortOrder + nextSortOrder) / 2;
      } else if (nextSortOrder) {
        sortOrder = nextSortOrder / 2;
      } else if (prevSortOrder) {
        sortOrder = prevSortOrder + 10000;
      }
    }

    // Update only the dragged label with the new sort order
    return this.updateInitiativeLabel(workspaceSlug, draggingLabelId, { sort_order: sortOrder });
  };

  // permissions

  private getCommentConditionContextById(initiativeId: string, commentId: string): { creator: boolean } {
    const activities = this.initiativeCommentActivities.getActivityAndCommentByIssueId(initiativeId);
    const comment = activities?.find(
      (a) => a.activity_type === "COMMENT" && a.detail && "id" in a.detail && a.detail.id === commentId
    );
    if (!comment || !("detail" in comment) || !("created_by" in comment.detail)) return { creator: false };
    const commentDetail = comment.detail;
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(commentDetail?.created_by && currentUserId && commentDetail.created_by === currentUserId) };
  }

  private getAttachmentConditionContextById(_initiativeId: string, attachmentId: string): { creator: boolean } {
    const attachment = this.initiativeAttachments.getAttachmentById(attachmentId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(attachment?.created_by && currentUserId && attachment.created_by === currentUserId) };
  }
}
