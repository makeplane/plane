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

// root store
import type { RootStore } from "@/plane-web/store/root.store";
// templates stores
import type { ITemplateHelperStore } from "./helper.store";
import { TemplateHelperStore } from "./helper.store";
import type { IPageTemplateStore } from "./page.store";
import { PageTemplateStore } from "./page.store";
import type { IProjectTemplateStore } from "./project.store";
import { ProjectTemplateStore } from "./project.store";
import type { IWorkItemTemplateStore } from "./work-item.store";
import { WorkItemTemplateStore } from "./work-item.store";

export interface ITemplatesRootStore {
  projectTemplates: IProjectTemplateStore;
  workItemTemplates: IWorkItemTemplateStore;
  pageTemplates: IPageTemplateStore;
  templateHelper: ITemplateHelperStore;
}

export class TemplatesRootStore implements ITemplatesRootStore {
  projectTemplates: IProjectTemplateStore;
  workItemTemplates: IWorkItemTemplateStore;
  pageTemplates: IPageTemplateStore;
  templateHelper: ITemplateHelperStore;

  constructor(root: RootStore) {
    this.projectTemplates = new ProjectTemplateStore(root);
    this.workItemTemplates = new WorkItemTemplateStore(root);
    this.pageTemplates = new PageTemplateStore(root);
    this.templateHelper = new TemplateHelperStore(root);
  }
}
