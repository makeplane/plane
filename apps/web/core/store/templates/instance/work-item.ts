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

// plane imports
import { EUserPermissions } from "@plane/constants";
import type { TWorkItemTemplate } from "@plane/types";
// local imports
import type { IBaseTemplateInstance, TBaseTemplateInstanceProps } from "./base";
import { BaseTemplateInstance } from "./base";

export type TWorkItemTemplateInstanceProps = TBaseTemplateInstanceProps<TWorkItemTemplate>;

// export interface IWorkItemTemplateInstance extends IBaseTemplate<TWorkItemTemplate> { }
export type IWorkItemTemplateInstance = IBaseTemplateInstance<TWorkItemTemplate>;

export class WorkItemTemplateInstance
  extends BaseTemplateInstance<TWorkItemTemplate>
  implements IWorkItemTemplateInstance
{
  constructor(protected store: TWorkItemTemplateInstanceProps) {
    super(store);
  }

  // computed
  get canCurrentUserEditTemplate() {
    return this.getUserRoleForTemplateInstance === EUserPermissions.ADMIN;
  }

  get canCurrentUserDeleteTemplate() {
    return this.getUserRoleForTemplateInstance === EUserPermissions.ADMIN;
  }

  get canCurrentUserPublishTemplate() {
    return false;
  }

  get canCurrentUserUnpublishTemplate() {
    return this.canCurrentUserPublishTemplate && this.is_published;
  }
}
