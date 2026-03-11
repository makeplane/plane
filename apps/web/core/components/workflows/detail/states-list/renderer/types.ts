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

import type { TStateGroups } from "@plane/types";

export type TWorkflowRendererNode = {
  id: string;
  name: string;
  color: string;
  group: TStateGroups;
  order: number;
  columnIndex: number;
  rowIndex: number;
};

export type TWorkflowRendererColumn = {
  id: string;
  label: string;
  columnIndex: number;
  nodes: TWorkflowRendererNode[];
};

export type TWorkflowRendererGraph = {
  columns: TWorkflowRendererColumn[];
  nodesById: Record<string, TWorkflowRendererNode>;
};
