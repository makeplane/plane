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

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { Release, ReleaseWrite } from "@plane/types";
import releaseService from "@/services/release.service";
import type { RootStore } from "@/plane-web/store/root.store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { ReleaseInstance } from "./release-instance";

export interface IReleaseStore {
  // observables
  addWorkItemsModalReleaseId: string | null;
  // computed fns
  getCanCreate: (workspaceSlug: string) => boolean;
  getReleaseIdsByWorkspaceSlug: (workspaceSlug: string) => string[];
  getReleaseById: (releaseId: string) => ReleaseInstance | undefined;
  isReleasesEnabled: (workspaceSlug: string) => boolean;
  areReleasesAvailableByWorkspaceSlug: (workspaceSlug: string) => boolean;
  // actions
  fetchReleases: (workspaceSlug: string) => Promise<Release[]>;
  fetchReleaseDetails: (workspaceSlug: string, releaseId: string) => Promise<Release>;
  updateRelease: (workspaceSlug: string, releaseId: string, payload: ReleaseWrite) => Promise<void>;
  deleteRelease: (workspaceSlug: string, releaseId: string) => Promise<void>;
  addWorkItemsToRelease: (workspaceSlug: string, releaseId: string, workItemIds: string[]) => Promise<void>;
  removeWorkItemsFromRelease: (workspaceSlug: string, releaseId: string, workItemIds: string[]) => Promise<void>;
  openAddWorkItemsModal: (releaseId: string) => void;
  closeAddWorkItemsModal: () => void;
}

export class ReleaseStore implements IReleaseStore {
  // observables
  private releasesMap: Map<string, ReleaseInstance> = new Map();
  addWorkItemsModalReleaseId: string | null = null;
  // root store
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeObservable<ReleaseStore, "releasesMap" | "addWorkItemsModalReleaseId">(this, {
      releasesMap: observable,
      addWorkItemsModalReleaseId: observable.ref,
      fetchReleases: action,
      fetchReleaseDetails: action,
      updateRelease: action,
      deleteRelease: action,
      addWorkItemsToRelease: action,
      removeWorkItemsFromRelease: action,
      openAddWorkItemsModal: action,
      closeAddWorkItemsModal: action,
    });
  }

  getReleaseIdsByWorkspaceSlug = computedFn((workspaceSlug: string): string[] =>
    Array.from(this.releasesMap.values())
      .filter((release) => {
        const releaseWorkspaceSlug = this.getWorkspaceSlugById(release.workspace);
        if (!releaseWorkspaceSlug) return false;
        return releaseWorkspaceSlug === workspaceSlug;
      })
      .map((release) => release.id)
  );

  getCanCreate = computedFn((workspaceSlug: string): boolean =>
    this.rootStore.permissionAccessStore.can({
      resource: "release",
      action: "create",
      workspaceSlug,
    })
  );

  areReleasesAvailableByWorkspaceSlug = computedFn(
    (workspaceSlug: string): boolean => this.getReleaseIdsByWorkspaceSlug(workspaceSlug).length > 0
  );

  private getWorkspaceSlugById = computedFn(
    (workspaceId: string): string | undefined => this.rootStore.workspaceRoot.getWorkspaceById(workspaceId)?.slug
  );

  openAddWorkItemsModal = (releaseId: string): void => {
    this.addWorkItemsModalReleaseId = releaseId;
  };

  closeAddWorkItemsModal = (): void => {
    this.addWorkItemsModalReleaseId = null;
  };

  getReleaseById = computedFn((releaseId: string) => this.releasesMap.get(releaseId));

  isReleasesEnabled = computedFn((workspaceSlug: string): boolean => {
    if (!workspaceSlug) return false;

    const isFeatureFlagEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      E_FEATURE_FLAGS.RELEASES,
      false
    );
    const workspaceFeatures = this.rootStore.workspaceFeatures.isWorkspaceFeatureEnabled(
      workspaceSlug,
      EWorkspaceFeatures.IS_RELEASES_ENABLED
    );
    return isFeatureFlagEnabled && workspaceFeatures;
  });

  private addReleaseToMap = (workspaceSlug: string, release: Release): ReleaseInstance => {
    const instance = new ReleaseInstance(release, {
      update: async (payload) => {
        const res = await releaseService.update(workspaceSlug, release.id, payload);
        return res;
      },
      addWorkItems: async (workItemIds) => {
        await releaseService.addWorkItems(workspaceSlug, release.id, workItemIds);
      },
      removeWorkItems: async (workItemIds) => {
        await releaseService.removeWorkItems(workspaceSlug, release.id, workItemIds);
      },
      changelog: {
        fetch: async () => {
          const res = await releaseService.retrieveChangelog(workspaceSlug, release.id);
          return res;
        },
        update: async (data) => {
          const res = await releaseService.updateChangelog(workspaceSlug, release.id, data);
          return res;
        },
      },
      can: this.rootStore.permissionAccessStore.can,
      getWorkspaceSlugById: this.getWorkspaceSlugById,
      currentUserId: this.rootStore.user.data?.id,
    });
    this.releasesMap.set(release.id, instance);
    return instance;
  };

  fetchReleases = async (workspaceSlug: string): Promise<Release[]> => {
    try {
      const response = await releaseService.list(workspaceSlug);

      runInAction(() => {
        for (const release of response) {
          if (!release.id) continue;
          const existing = this.releasesMap.get(release.id);
          if (existing) {
            existing.mutateProperties(release);
          } else {
            this.addReleaseToMap(workspaceSlug, release);
          }
        }
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch releases:", error);
      throw error;
    }
  };

  fetchReleaseDetails = async (workspaceSlug: string, releaseId: string): Promise<Release> => {
    const response = await releaseService.retrieve(workspaceSlug, releaseId);

    runInAction(() => {
      const existing = this.releasesMap.get(releaseId);
      if (existing) {
        existing.mutateProperties(response);
      } else {
        this.addReleaseToMap(workspaceSlug, response);
      }
    });

    return response;
  };

  updateRelease = async (workspaceSlug: string, releaseId: string, payload: ReleaseWrite): Promise<void> => {
    const instance = this.releasesMap.get(releaseId);
    if (!instance) return;

    const { description_html: _dh, description_json: _dj, ...optimisticPayload } = payload;

    try {
      runInAction(() => {
        instance.mutateProperties(optimisticPayload);
      });

      await releaseService.update(workspaceSlug, releaseId, payload);
    } catch (error) {
      await this.fetchReleaseDetails(workspaceSlug, releaseId);
      throw error;
    }
  };

  deleteRelease = async (workspaceSlug: string, releaseId: string): Promise<void> => {
    const previous = this.releasesMap.get(releaseId);
    if (!previous) return;

    try {
      runInAction(() => {
        this.releasesMap.delete(releaseId);
      });
      await releaseService.destroy(workspaceSlug, releaseId);
    } catch (error) {
      runInAction(() => {
        this.releasesMap.set(releaseId, previous);
      });
      throw error;
    }
  };

  addWorkItemsToRelease = async (workspaceSlug: string, releaseId: string, workItemIds: string[]): Promise<void> => {
    const instance = this.releasesMap.get(releaseId);
    if (!instance) return;

    const prevIds = instance.work_item_ids ?? [];
    const optimisticIds = [...new Set([...prevIds, ...workItemIds])];

    try {
      runInAction(() => {
        instance.mutateProperties({ work_item_ids: optimisticIds });
      });
      await releaseService.addWorkItems(workspaceSlug, releaseId, workItemIds);
    } catch (error) {
      runInAction(() => {
        instance.mutateProperties({ work_item_ids: prevIds });
      });
      throw error;
    }
  };

  removeWorkItemsFromRelease = async (
    workspaceSlug: string,
    releaseId: string,
    workItemIds: string[]
  ): Promise<void> => {
    const instance = this.releasesMap.get(releaseId);
    if (!instance) return;

    const prevIds = instance.work_item_ids ?? [];
    const setToRemove = new Set(workItemIds);
    const filtered = prevIds.filter((id) => !setToRemove.has(id));

    try {
      runInAction(() => {
        instance.mutateProperties({ work_item_ids: filtered });
      });
      await releaseService.removeWorkItems(workspaceSlug, releaseId, workItemIds);
    } catch (error) {
      runInAction(() => {
        instance.mutateProperties({ work_item_ids: prevIds });
      });
      throw error;
    }
  };
}
