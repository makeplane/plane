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

export interface IWorkItemRelationDefinition {
  id: string;
  workspace: string;
  name: string;
  description: string;
  outward: string;
  inward: string;
  is_default: boolean;
  is_active: boolean;
  color: string;
  logo_props: Record<string, unknown>;
  sort_order: number;
  external_source: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
}

export type TWorkItemRelationDefinitionPayload = Partial<
  Pick<
    IWorkItemRelationDefinition,
    "name" | "description" | "outward" | "inward" | "is_active" | "color" | "logo_props"
  >
>;
