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
import { IntakeFormsService } from "@plane/services";
import type { IIntakeTypeFormInstance } from "@plane/shared-state";
import { IntakeTypeFormInstance } from "@plane/shared-state";
import type { TIntakeTypeForm } from "@plane/types";
import type { RootStore } from "../../ee/store/root.store";

export interface IIntakeTypeFormStore {
  typeFormsMap: Map<string, Map<string, IIntakeTypeFormInstance>>;
  fetchTypeForms: (workspaceSlug: string, projectId: string) => Promise<void>;
  createTypeForm: (workspaceSlug: string, projectId: string, data: Partial<TIntakeTypeForm>) => Promise<void>;
  updateTypeForm: (projectId: string, typeFormId: string, data: Partial<TIntakeTypeForm>) => Promise<void>;
  deleteTypeForm: (workspaceSlug: string, projectId: string, typeFormId: string) => Promise<void>;
  regenerateFormAnchor: (workspaceSlug: string, projectId: string, typeFormId: string) => Promise<void>;
  // computed
  getProjectFormIds: (projectId: string) => string[];
  getTypeFormById: (projectId: string, typeFormId: string) => IIntakeTypeFormInstance | undefined;
  isCustomFormsEnabled: (workspaceSlug: string, projectId: string) => boolean;
}

export class IntakeTypeFormStore implements IIntakeTypeFormStore {
  // observables
  typeFormsMap: Map<string, Map<string, IIntakeTypeFormInstance>> = new Map(); // projectId -> typeFormId -> IIntakeTypeFormInstance

  // services
  intakeFormsService = new IntakeFormsService();

  // store
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      typeFormsMap: observable,
      // actions
      fetchTypeForms: action,
      createTypeForm: action,
      deleteTypeForm: action,
      updateTypeForm: action,
      regenerateFormAnchor: action,
    });
    this.rootStore = rootStore;
  }

  // actions
  fetchTypeForms = async (workspaceSlug: string, projectId: string) => {
    try {
      const typeForms = await this.intakeFormsService.list(workspaceSlug, projectId);
      runInAction(() => {
        const projectTypeFormsMap = new Map<string, IIntakeTypeFormInstance>();
        typeForms.forEach((typeForm) => {
          projectTypeFormsMap.set(
            typeForm.id,
            new IntakeTypeFormInstance(typeForm, (data) =>
              this.intakeFormsService.update(workspaceSlug, projectId, typeForm.id, data)
            )
          );
        });
        this.typeFormsMap.set(projectId, projectTypeFormsMap);
      });
    } catch (error) {
      console.error("Error fetching type forms", error);
      throw error;
    }
  };

  createTypeForm = async (workspaceSlug: string, projectId: string, data: Partial<TIntakeTypeForm>) => {
    try {
      const typeForm = await this.intakeFormsService.create(workspaceSlug, projectId, data);
      runInAction(() => {
        const projectTypeForms = this.typeFormsMap.get(projectId);
        const newFormInstance = new IntakeTypeFormInstance(typeForm, (data) =>
          this.intakeFormsService.update(workspaceSlug, projectId, typeForm.id, data)
        );
        if (!projectTypeForms) {
          this.typeFormsMap.set(projectId, new Map([[typeForm.id, newFormInstance]]));
        } else {
          projectTypeForms.set(typeForm.id, newFormInstance);
        }
      });
    } catch (error) {
      console.error("Error creating type form", error);
      throw error;
    }
  };

  updateTypeForm = async (projectId: string, typeFormId: string, data: Partial<TIntakeTypeForm>) => {
    try {
      // Get the map of type forms for the specified project
      const projectTypeForms = this.typeFormsMap.get(projectId);
      if (!projectTypeForms) return; // If no type forms exist for this project, exit early

      // Get the type form instance by its ID
      const typeForm = projectTypeForms.get(typeFormId);
      if (!typeForm) return; // If the type form instance doesn't exist, exit early

      // Update the instance
      typeForm.mutateInstance(data);

      // update the instance at server
      await typeForm.update();
    } catch (error) {
      console.error("Error updating type form", error);
      throw error;
    }
  };

  deleteTypeForm = async (workspaceSlug: string, projectId: string, typeFormId: string) => {
    try {
      await this.intakeFormsService.destroy(workspaceSlug, projectId, typeFormId);
      runInAction(() => {
        const projectTypeForms = this.typeFormsMap.get(projectId);
        if (!projectTypeForms) return;
        projectTypeForms.delete(typeFormId);
        if (projectTypeForms.size === 0) {
          this.typeFormsMap.delete(projectId);
        }
      });
    } catch (error) {
      console.error("Error deleting type form", error);
      throw error;
    }
  };

  regenerateFormAnchor = async (workspaceSlug: string, projectId: string, typeFormId: string) => {
    try {
      const result = await this.intakeFormsService.regenerateFormAnchor(workspaceSlug, projectId, typeFormId);
      runInAction(() => {
        const projectTypeForms = this.typeFormsMap.get(projectId);
        if (!projectTypeForms) return;
        const typeForm = projectTypeForms.get(typeFormId);
        if (!typeForm) return;
        typeForm.anchor = result.anchor;
      });
    } catch (error) {
      console.error("Error regenerating form anchor", error);
      throw error;
    }
  };

  // computed
  getProjectFormIds = computedFn((projectId: string) => {
    const projectTypeForms = this.typeFormsMap.get(projectId);
    if (!projectTypeForms) return [];
    return Array.from(projectTypeForms.values()).map((typeForm) => typeForm.id);
  });

  getTypeFormById = computedFn((projectId: string, typeFormId: string) => {
    const projectTypeForms = this.typeFormsMap.get(projectId);
    if (!projectTypeForms) return undefined;
    return projectTypeForms.get(typeFormId);
  });

  isCustomFormsEnabled = computedFn((workspaceSlug: string, projectId: string) => {
    const isWorkItemTypesEnabled = this.rootStore.issueTypes.isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    const isIntakeFormFeatureFlagEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      E_FEATURE_FLAGS.WORKITEM_TYPE_INTAKE_FORM,
      false
    );

    return isWorkItemTypesEnabled && isIntakeFormFeatureFlagEnabled;
  });
}
