/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageCoreService } from "./core.service";

/**
 * This is the extended service for the page service.
 * It extends the core service and adds additional functionality.
 * Implementation for this is found in the enterprise repository.
 */
export abstract class PageService extends PageCoreService {
  constructor() {
    super();
  }
}
