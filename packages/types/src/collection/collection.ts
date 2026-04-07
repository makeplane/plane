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

import type { TLogoProps } from "../common";

export enum ECollectionAccess {
  PUBLIC = 0,
  PRIVATE = 1,
}

export type TCollection = {
  id: string;
  name: string;
  owned_by_id: string;
  access: ECollectionAccess;
  is_default: boolean;
  is_global: boolean;
  logo_props: TLogoProps | Record<string, unknown>;
  sort_order: number;
  workspace: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
};

export type TCollectionCreatePayload = {
  name: string;
  access: ECollectionAccess;
  logo_props?: TLogoProps | Record<string, unknown>;
};

export type TCollectionUpdatePayload = Partial<TCollectionCreatePayload> & {
  sort_order?: number;
};
