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
import type { PermissionActionForResource, TPageTemplate } from "@plane/types";
// local imports
import type { IBaseTemplateInstance, TBaseTemplateInstanceArgs } from "./base";
import { BaseTemplateInstance } from "./base";

export type TPageTemplateInstanceArgs = TBaseTemplateInstanceArgs<TPageTemplate>;

export type IPageTemplateInstance = IBaseTemplateInstance<TPageTemplate>;

export class PageTemplateInstance extends BaseTemplateInstance<TPageTemplate> implements IPageTemplateInstance {
  constructor(protected args: TPageTemplateInstanceArgs) {
    super(args);

    makeObservable<PageTemplateInstance, "canPerformAction">(this, {
      canPerformAction: action,
    });
  }

  // actions
  private canPerformAction = action(
    (action: PermissionActionForResource<"workspace_page_template" | "project_page_template">) => {
      const workspaceSlug = this.workspaceSlug;
      if (!workspaceSlug) return false;

      if (this.project) {
        return this.args.can({
          resource: "project_page_template",
          action,
          projectId: this.project,
          workspaceSlug,
          resourceMeta: this.permissionMeta,
        });
      }

      return this.args.can({
        resource: "workspace_page_template",
        action,
        workspaceSlug,
        resourceMeta: this.permissionMeta,
      });
    }
  );

  // computed
  get canEdit() {
    return this.canPerformAction("edit");
  }

  get canDelete() {
    return this.canPerformAction("delete");
  }

  get canPublish() {
    return false;
  }

  get canUnpublish() {
    return this.canPublish && this.is_published;
  }
}
