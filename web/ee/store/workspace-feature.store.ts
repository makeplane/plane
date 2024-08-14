/* eslint-disable no-useless-catch */

import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane web services
import workspaceFeatureService from "@/plane-web/services/workspace-feature.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  TWorkspaceFeatures,
  TWorkspaceFeature,
  EWorkspaceFeatures,
  TWorkspaceFeatureLoader,
  EWorkspaceFeatureLoader,
} from "@/plane-web/types/workspace-feature";

export interface IWorkspaceFeatureStore {
  // observables
  loader: TWorkspaceFeatureLoader;
  workspaceFeatures: Record<string, TWorkspaceFeatures>; // workspaceSlug -> TWorkspaceFeatures
  // computed methods
  featuresByWorkspaceSlug: (workspaceSlug: string) => TWorkspaceFeatures | undefined;
  isWorkspaceFeatureEnabled: (feature: EWorkspaceFeatures) => boolean;
  // actions
  fetchWorkspaceFeatures: (workspaceSlug: string) => Promise<TWorkspaceFeatures | undefined>;
  updateWorkspaceFeature: (
    workspaceSlug: string,
    payload: Partial<TWorkspaceFeature>
  ) => Promise<TWorkspaceFeatures | undefined>;
}

export class WorkspaceFeatureStore implements IWorkspaceFeatureStore {
  // observables
  loader: TWorkspaceFeatureLoader = undefined;
  workspaceFeatures: Record<string, TWorkspaceFeatures> = {};

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      workspaceFeatures: observable,
      // actions
      fetchWorkspaceFeatures: action,
      updateWorkspaceFeature: action,
    });
  }

  // computed methods
  /**
   * @description get workspace features by workspace slug
   * @returns { TWorkspaceFeatures | undefined }
   */
  featuresByWorkspaceSlug = computedFn((workspaceSlug: string) => {
    if (!workspaceSlug) return undefined;

    return this.workspaceFeatures?.[workspaceSlug] || undefined;
  });

  /**
   * @description get workspace feature by workspace slug
   * @returns { TWorkspaceFeatures | undefined }
   */
  isWorkspaceFeatureEnabled = computedFn((feature: EWorkspaceFeatures) => {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return false;

    const workspaceFeatures = this.featuresByWorkspaceSlug(workspaceSlug);
    if (!workspaceFeatures) return false;

    return workspaceFeatures?.[feature] ?? false;
  });

  // actions
  /**
   * @description fetching workspace features
   * @param { string } workspaceSlug
   * @returns { TWorkspaceFeatures | undefined }
   */
  fetchWorkspaceFeatures = async (workspaceSlug: string): Promise<TWorkspaceFeatures | undefined> => {
    try {
      const currentWorkspaceFeatures = this.featuresByWorkspaceSlug(workspaceSlug) || undefined;
      set(
        this,
        "loader",
        currentWorkspaceFeatures ? EWorkspaceFeatureLoader.MUTATION_LOADER : EWorkspaceFeatureLoader.INIT_LOADER
      );

      const workspaceFeatures = await workspaceFeatureService.fetchWorkspaceFeatures(workspaceSlug);
      if (workspaceFeatures) {
        runInAction(() => set(this.workspaceFeatures, [workspaceSlug], workspaceFeatures));
      }
      return workspaceFeatures;
    } catch (error) {
      console.error("workspace features --> fetchWorkspaceFeatures", error);
      throw error;
    } finally {
      runInAction(() => (this.loader = undefined));
    }
  };

  /**
   * @description update workspace feature
   * @param { string } workspaceSlug
   * @param { Partial<TWorkspaceFeatures> } payload
   * @returns { TWorkspaceFeatures | undefined }
   */
  updateWorkspaceFeature = async (
    workspaceSlug: string,
    payload: Partial<TWorkspaceFeature>
  ): Promise<TWorkspaceFeatures | undefined> => {
    const currentWorkspaceFeatures = this.workspaceFeatures?.[workspaceSlug];
    try {
      runInAction(() => {
        this.loader = EWorkspaceFeatureLoader.MUTATION_LOADER;
        Object.entries(payload).forEach(([key, value]) => {
          if (this.workspaceFeatures) {
            set(this.workspaceFeatures, [workspaceSlug, key], value);
          }
        });
      });
      const workspaceFeatures = await workspaceFeatureService.updateWorkspaceFeature(workspaceSlug, payload);
      return workspaceFeatures;
    } catch (error) {
      runInAction(() => {
        Object.entries(payload).forEach(([key]) => {
          if (this.workspaceFeatures && currentWorkspaceFeatures) {
            const featureKey = key as EWorkspaceFeatures;
            set(this.workspaceFeatures, [workspaceSlug, key], currentWorkspaceFeatures[featureKey]);
          }
        });
      });
      console.error("workspace features --> updateWorkspaceFeature", error);
      throw error;
    } finally {
      runInAction(() => (this.loader = undefined));
    }
  };
}
