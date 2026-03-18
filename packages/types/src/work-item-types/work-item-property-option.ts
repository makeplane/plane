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

// local imports
import type { TLogoProps } from "../common";

export type CustomPropertyOption = {
  created_at: Date;
  created_by: string | null;
  description: string | null;
  id: string;
  is_active: boolean;
  is_default: boolean;
  logo_props: TLogoProps | null;
  name: string;
  parent: string | null;
  property_id: string;
  sort_order: number;
  updated_at: Date;
  updated_by: string | null;
};

// Work item property option store
export interface CustomPropertyOptionsInstanceSchema extends CustomPropertyOption {
  // computed
  asJSON: CustomPropertyOption;
  // helper action
  mutateProperties: (data: Partial<CustomPropertyOption>) => void;
}

// Work item property options payload
export type TWorkItemPropertyOptionsPayload = {
  [propertyId: string]: CustomPropertyOption[];
};

// Work item property option create list
export type TWorkItemPropertyOptionCreateUpdateData = Partial<CustomPropertyOption> & {
  key?: string;
};
