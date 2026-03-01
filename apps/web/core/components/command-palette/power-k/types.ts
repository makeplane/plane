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

export type TPowerKContextTypeExtended = "initiative";

export type TPowerKPageTypeExtended =
  | "open-teamspace"
  | "open-initiative"
  | "open-customer"
  // initiative context based actions
  | "change-initiative-state"
  | "change-initiative-lead";

export type TPowerKSearchResultsKeysExtended = "epic" | "team" | "initiative";
