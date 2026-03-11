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

import type { IState, IWorkflow, TStateGroups } from "@plane/types";
import type { TWorkflowRendererGraph, TWorkflowRendererNode } from "./types";
import { STATE_GROUP_ORDER } from "@plane/constants";

const sortStates = (a: IState, b: IState) => {
  if (a.order !== b.order) return a.order - b.order;
  return a.name.localeCompare(b.name);
};

const sortGroups = (a: TStateGroups, b: TStateGroups) => STATE_GROUP_ORDER[a] - STATE_GROUP_ORDER[b];

export const buildWorkflowRendererGraph = (
  workflow: IWorkflow,
  getStateById: (stateId: string | undefined | null) => IState | undefined
): TWorkflowRendererGraph => {
  const statesById = new Map<string, IState>();
  for (const stateId of workflow.stateIds) {
    const state = getStateById(stateId);
    if (state) statesById.set(stateId, state);
  }

  const groupedStates = new Map<TStateGroups, IState[]>();
  statesById.forEach((state) => {
    const list = groupedStates.get(state.group) ?? [];
    list.push(state);
    groupedStates.set(state.group, list);
  });

  const columns = Array.from(groupedStates.entries())
    .sort(([groupA], [groupB]) => sortGroups(groupA, groupB))
    .map(([group, states], columnIndex) => {
      const sortedStates = [...states].sort(sortStates);
      return {
        id: group,
        label: group.charAt(0).toUpperCase() + group.slice(1),
        columnIndex,
        nodes: sortedStates.map((state, rowIndex) => ({
          id: state.id,
          name: state.name,
          color: state.color,
          group: state.group,
          order: state.order,
          columnIndex,
          rowIndex,
        })),
      };
    });

  const nodesById = columns.reduce<Record<string, TWorkflowRendererNode>>((acc, column) => {
    column.nodes.forEach((node) => {
      acc[node.id] = node;
    });
    return acc;
  }, {});

  return {
    columns,
    nodesById,
  };
};

export const hasWorkflowRendererContent = (graph: TWorkflowRendererGraph) =>
  graph.columns.some((column) => column.nodes.length > 0);
