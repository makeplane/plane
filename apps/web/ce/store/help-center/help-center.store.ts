/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { HelpCenterService } from "@/plane-web/services/help-center.service";
import { HelpArticleStore } from "./article.store";
import type { IHelpArticleStore } from "./article.store";
import { HelpCategoryStore } from "./category.store";
import type { IHelpCategoryStore } from "./category.store";

export interface IHelpCenterStore {
  category: IHelpCategoryStore;
  article: IHelpArticleStore;
}

export class HelpCenterStore implements IHelpCenterStore {
  category: IHelpCategoryStore;
  article: IHelpArticleStore;

  constructor() {
    // One service shared by both sub-stores. The store deliberately holds only
    // raw data (no workspaceId resolution — that is a component concern).
    const service = new HelpCenterService();
    this.category = new HelpCategoryStore(service);
    this.article = new HelpArticleStore(service);
  }
}
