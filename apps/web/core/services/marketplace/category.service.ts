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

// helpers
import { API_BASE_URL } from "@plane/constants";
import type { TApplicationCategory } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class CategoryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all application categories
   * @returns The application categories
   */
  async getApplicationCategories(): Promise<TApplicationCategory[] | undefined> {
    return this.get(`/marketplace/application-categories/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
