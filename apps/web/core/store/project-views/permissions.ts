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

import { computedFn } from "mobx-utils";
// local imports
import type { ProjectViewStore } from "./project-view.store";
import type { CoreRootStore } from "../root.store";

type ProjectViewMeta = {
  projectId: string;
  workspaceSlug: string;
  conditionContext: { creator: boolean };
};

export interface ProjectViewPermissions {
  getCanViewViews: (workspaceSlug: string, projectId: string) => boolean;
  getCanConfigureViews: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreateView: (workspaceSlug: string, projectId: string) => boolean;
  getCanEditView: (viewId: string) => boolean;
  getCanDeleteView: (viewId: string) => boolean;
  getCanPublishView: (viewId: string) => boolean;
  getCanExport: (viewId: string) => boolean;
}

export class ProjectViewPermissionsInstance implements ProjectViewPermissions {
  // store
  rootStore: CoreRootStore;
  projectViewsStore: ProjectViewStore;

  constructor(rootStore: CoreRootStore, projectViewsStore: ProjectViewStore) {
    this.rootStore = rootStore;
    this.projectViewsStore = projectViewsStore;
  }

  private getProjectViewMetaById = computedFn((viewId: string): ProjectViewMeta | undefined => {
    const view = this.projectViewsStore.getViewById(viewId);
    if (!view) return undefined;
    const workspaceDetails = this.rootStore.workspaceRoot.getWorkspaceById(view.workspace);
    if (!workspaceDetails) return undefined;
    const currentUserId = this.rootStore.user.data?.id;
    const conditionContext = { creator: !!(view.created_by && currentUserId && view.created_by === currentUserId) };
    return {
      projectId: view.project,
      workspaceSlug: workspaceDetails.slug,
      conditionContext,
    };
  });

  getCanViewViews: ProjectViewPermissions["getCanViewViews"] = computedFn((workspaceSlug, projectId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "workitem_view",
      action: "view",
      projectId,
      workspaceSlug,
    });
  });

  getCanConfigureViews: ProjectViewPermissions["getCanConfigureViews"] = computedFn((workspaceSlug, projectId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "project",
      action: "manage",
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    });
  });

  getCanCreateView: ProjectViewPermissions["getCanCreateView"] = computedFn((workspaceSlug, projectId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "workitem_view",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanEditView: ProjectViewPermissions["getCanEditView"] = computedFn((viewId) => {
    const viewMeta = this.getProjectViewMetaById(viewId);
    if (!viewMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "workitem_view",
      action: "edit",
      projectId: viewMeta.projectId,
      workspaceSlug: viewMeta.workspaceSlug,
      resourceMeta: {
        resourceId: viewId,
        conditionContext: viewMeta.conditionContext,
      },
    });
  });

  getCanDeleteView: ProjectViewPermissions["getCanDeleteView"] = computedFn((viewId) => {
    const viewMeta = this.getProjectViewMetaById(viewId);
    if (!viewMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "workitem_view",
      action: "delete",
      projectId: viewMeta.projectId,
      workspaceSlug: viewMeta.workspaceSlug,
      resourceMeta: {
        resourceId: viewId,
        conditionContext: viewMeta.conditionContext,
      },
    });
  });

  getCanPublishView: ProjectViewPermissions["getCanPublishView"] = computedFn((viewId) => {
    return this.getCanEditView(viewId);
  });

  getCanExport: ProjectViewPermissions["getCanExport"] = computedFn((viewId) => {
    const viewMeta = this.getProjectViewMetaById(viewId);
    if (!viewMeta) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "workitem_view",
      action: "export",
      projectId: viewMeta.projectId,
      workspaceSlug: viewMeta.workspaceSlug,
      resourceMeta: {
        resourceId: viewId,
      },
    });
  });
}
