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

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { E_FEATURE_FLAGS, EUserPermissionsLevel } from "@plane/constants";
import type { Release, ReleaseWrite } from "@plane/types";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import releaseService from "@/services/release.service";
import type { RootStore } from "@/plane-web/store/root.store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { ReleaseInstance } from "./release-instance";

export interface IReleaseStore {
  // observables
  releasesMap: Map<string, ReleaseInstance>;
  workspaceSlugReleasesMap: Map<string, string[]>;
  releasesLoader: boolean;
  addWorkItemsModalReleaseId: string | null;
  // computed
  permissions: {
    canEdit: boolean;
  };
  // computed fns
  getReleaseIdsByWorkspaceSlug: (workspaceSlug: string) => string[];
  getReleaseById: (releaseId: string) => ReleaseInstance | undefined;
  isReleasesEnabled: (workspaceSlug: string) => boolean;
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
  releasesMap: Map<string, ReleaseInstance> = new Map();
  workspaceSlugReleasesMap: Map<string, string[]> = new Map();
  releasesLoader = false;
  addWorkItemsModalReleaseId: string | null = null;
  // root store
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    makeObservable(this, {
      releasesMap: observable,
      workspaceSlugReleasesMap: observable,
      releasesLoader: observable.ref,
      addWorkItemsModalReleaseId: observable.ref,
      permissions: computed,
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

  getReleaseIdsByWorkspaceSlug = computedFn(
    (workspaceSlug: string): string[] => this.workspaceSlugReleasesMap.get(workspaceSlug) ?? []
  );

  get permissions() {
    const permissionStore = this.rootStore.user.permission;

    return {
      canEdit: permissionStore.allowPermissions(
        [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
        EUserPermissionsLevel.WORKSPACE
      ),
    };
  }

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
      permissions: {
        canEditWorkItemProperties: (projectId: string) =>
          this.rootStore.user.permission.allowPermissions(
            [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
            EUserPermissionsLevel.PROJECT,
            workspaceSlug,
            projectId
          ),
        canEditChangelog: this.rootStore.user.permission.allowPermissions(
          [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
          EUserPermissionsLevel.WORKSPACE,
          workspaceSlug
        ),
      },
    });
    this.releasesMap.set(release.id, instance);
    return instance;
  };

  fetchReleases = async (workspaceSlug: string): Promise<Release[]> => {
    try {
      runInAction(() => {
        this.releasesLoader = true;
      });

      const response = await releaseService.list(workspaceSlug);

      runInAction(() => {
        const ids: string[] = [];
        for (const release of response) {
          if (!release.id) continue;
          const existing = this.releasesMap.get(release.id);
          if (existing) {
            existing.mutateProperties(release);
          } else {
            this.addReleaseToMap(workspaceSlug, release);
          }
          ids.push(release.id);
        }
        this.workspaceSlugReleasesMap.set(workspaceSlug, ids);
        this.releasesLoader = false;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.releasesLoader = false;
      });
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
        const currentIds = this.workspaceSlugReleasesMap.get(workspaceSlug) ?? [];
        if (!currentIds.includes(releaseId)) {
          this.workspaceSlugReleasesMap.set(workspaceSlug, [...currentIds, releaseId]);
        }
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
        const currentIds = this.workspaceSlugReleasesMap.get(workspaceSlug) ?? [];
        this.workspaceSlugReleasesMap.set(
          workspaceSlug,
          currentIds.filter((id) => id !== releaseId)
        );
      });
      await releaseService.destroy(workspaceSlug, releaseId);
    } catch (error) {
      runInAction(() => {
        this.releasesMap.set(releaseId, previous);
        const currentIds = this.workspaceSlugReleasesMap.get(workspaceSlug) ?? [];
        if (!currentIds.includes(releaseId)) {
          this.workspaceSlugReleasesMap.set(workspaceSlug, [...currentIds, releaseId]);
        }
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
