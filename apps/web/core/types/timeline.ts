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

import type { EDependencyPosition, ETimelineRelation } from "@/constants/timeline";

export type TCoreWorkItemRelationTypes = "blocking" | "blocked_by" | "duplicate" | "relates_to";
export type TExtendedWorkItemRelationTypes =
  | "start_before"
  | "start_after"
  | "finish_before"
  | "finish_after"
  | "implements"
  | "implemented_by";
export type TIssueRelationTypes = TCoreWorkItemRelationTypes | TExtendedWorkItemRelationTypes;

export type DependencyTree = {
  dependencyId: string;
  [EDependencyPosition.START]: number;
  [EDependencyPosition.END]: number;
  originalValues: {
    [EDependencyPosition.START]: number;
    [EDependencyPosition.END]: number;
  };
  parentDependency?: EDependencyPosition;
  childDependency?: EDependencyPosition;
  dependencyIndicator?: 1 | -1;
  dependencies: DependencyTree[];
};

export type Relation = {
  id: string;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  originDependencyPosition: EDependencyPosition;
  destinationDependencyPosition: EDependencyPosition;
  originBlock: string;
  destinationBlock: string;
  relationType: ETimelineRelation;
  isAdhering: boolean;
  projectId?: string;
};

export type DependencyDraggingDetails = {
  startPosition: { x: number; y: number };
  dragPosition: { x: number; y: number };
  draggedFrom: string;
  draggedFromPosition: EDependencyPosition;
  draggedOn?: string;
  draggedOnPosition?: EDependencyPosition;
};
