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
import type { TPageTemplate } from "@plane/types";
// local imports
import type { IBaseTemplateInstance, TBaseTemplateInstanceProps } from "./base";
import { BaseTemplateInstance } from "./base";

export type TPageTemplateInstanceProps = TBaseTemplateInstanceProps<TPageTemplate>;

// export interface IPageTemplateInstance extends IBaseTemplate<TPageTemplate> { }
export type IPageTemplateInstance = IBaseTemplateInstance<TPageTemplate>;

export class PageTemplateInstance extends BaseTemplateInstance<TPageTemplate> implements IPageTemplateInstance {
  constructor(protected store: TPageTemplateInstanceProps) {
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
