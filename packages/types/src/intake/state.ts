/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TIntakeStateGroups = "triage";

export interface IIntakeState {
  readonly id: string;
  color: string;
  default: boolean;
  description: string;
  group: TIntakeStateGroups;
  name: string;
  project_id: string;
  sequence: number;
  workspace_id: string;
}
