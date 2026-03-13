/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export interface IMyStaffProfile {
  id: string;
  staff_id: string;
  position: string;
  department: string | null;
  department_detail: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export class MyStaffProfileService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getMyStaffProfile(): Promise<IMyStaffProfile> {
    return this.get(`/api/v1/users/me/staff-profile/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
