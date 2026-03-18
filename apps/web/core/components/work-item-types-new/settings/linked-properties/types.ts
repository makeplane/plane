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

import type { CustomProperty, CustomPropertyType } from "@plane/types";

/**
 * A simplified representation of a custom property used for linking UI.
 * This avoids coupling with store instance schemas and keeps the linking
 * components independent of MobX.
 */
export type LinkedPropertyData = CustomProperty<CustomPropertyType>;

export type LinkedPropertyActions = {
  link: (propertyIds: string[]) => Promise<void>;
  unlink: (propertyId: string) => Promise<void>;
  reorder: (propertyId: string, newSortOrder: number) => Promise<void>;
};

export type LinkedPropertyPermissions = {
  canLink: boolean;
  canUnlink: boolean;
  canReorder: boolean;
};
