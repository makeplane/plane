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

import type { IBaseAnalyticsStore } from "@/store/analytics.store";
import { BaseAnalyticsStore } from "@/store/analytics.store";

// oxlint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAnalyticsStore extends IBaseAnalyticsStore {
  //observables
}

export class AnalyticsStore extends BaseAnalyticsStore {}
