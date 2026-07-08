/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TProjectPublishSettings } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing view publish operations within plane sites application.
 * Extends APIService to handle HTTP requests to the view publish-related endpoints.
 * @extends {APIService}
 * @remarks This service is only available for plane sites
 */
export class SitesViewPublishService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves publish settings for a specific published view anchor.
   * @param {string} anchor - The anchor identifier
   * @returns {Promise<TProjectPublishSettings>} The publish settings
   * @throws {Error} If the API request fails
   */
  async retrieveSettingsByAnchor(anchor: string): Promise<TProjectPublishSettings> {
    return this.get(`/api/public/anchor/${anchor}/views/settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
