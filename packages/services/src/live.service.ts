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

import { LIVE_URL } from "@plane/constants";
import { APIService } from "./api.service";

export class LiveService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || LIVE_URL);
  }

  async getFileContent(fileUrl: string): Promise<string> {
    return this.get("/content", { params: { url: fileUrl } })
      .then((response) => response?.data?.content ?? "")
      .catch((error) => {
        console.error("Error loading file content:", error);
        return "";
      });
  }
}
