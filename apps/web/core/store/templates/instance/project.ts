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

import { action, makeObservable } from "mobx";
// plane imports
import type { PermissionActionForResource, TProjectTemplate } from "@plane/types";
import { E_FEATURE_FLAGS } from "@plane/constants";
// local imports
import type { IBaseTemplateInstance, TBaseTemplateInstanceArgs } from "./base";
import { BaseTemplateInstance } from "./base";

export type TProjectTemplateInstanceArgs = TBaseTemplateInstanceArgs<TProjectTemplate>;

export type IProjectTemplateInstance = IBaseTemplateInstance<TProjectTemplate>;

export class ProjectTemplateInstance
  extends BaseTemplateInstance<TProjectTemplate>
  implements IProjectTemplateInstance
{
  constructor(protected args: TProjectTemplateInstanceArgs) {
    super(args);

    makeObservable<ProjectTemplateInstance, "canPerformAction">(this, {
      canPerformAction: action,
    });
  }

  // actions
  private canPerformAction = action((action: PermissionActionForResource<"workspace_project_template">) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) return false;

    return this.args.can({
      resource: "workspace_project_template",
      action,
      workspaceSlug,
      resourceMeta: this.permissionMeta,
    });
  });

  // computed
  get canEdit() {
    return this.canPerformAction("edit");
  }

  get canDelete() {
    return this.canPerformAction("delete");
  }

  get canPublish() {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) return false;
    return (
      this.args.getFeatureFlagByWorkspaceSlug(workspaceSlug, E_FEATURE_FLAGS.PROJECT_TEMPLATES_PUBLISH) &&
      this.canPerformAction("publish")
    );
  }

  get canUnpublish() {
    return this.canPublish && this.is_published;
  }
}
